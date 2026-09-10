import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";

const API_BASE = "https://api.cloudconvert.com/v2";

function assertConfigured(): void {
  if (!env.cloudConvertApiKey || env.cloudConvertApiKey.startsWith("REPLACE_WITH")) {
    throw new AppError(
      "This tool needs a CloudConvert API key. Sign up free at cloudconvert.com, create an API key " +
        "(Dashboard -> API v2 -> API Keys), and set CLOUDCONVERT_API_KEY in server/.env.",
      "CLOUDCONVERT_NOT_CONFIGURED",
      503
    );
  }
}

interface CloudConvertTask {
  name: string;
  operation: string;
  status: string;
  result?: {
    form?: { url: string; parameters: Record<string, string> };
    files?: { filename: string; url: string }[];
  };
  message?: string;
}

interface CloudConvertJob {
  id: string;
  status: string;
  tasks: CloudConvertTask[];
}

async function apiRequest<T>(endpoint: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.cloudConvertApiKey}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    throw new AppError(
      `Couldn't reach the conversion service — check your network connection. (${err instanceof Error ? err.message : "unknown network error"})`,
      "CLOUDCONVERT_NETWORK_ERROR",
      502
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // 401/403 specifically usually means the API key is wrong or malformed.
    if (res.status === 401 || res.status === 403) {
      throw new AppError(
        `CloudConvert rejected the API key (HTTP ${res.status}). Double-check CLOUDCONVERT_API_KEY in server/.env is the full key with no quotes or extra spaces. Response: ${body.slice(0, 200)}`,
        "CLOUDCONVERT_AUTH_FAILED",
        502
      );
    }
    throw new AppError(
      `The conversion service returned an error (HTTP ${res.status}). ${body.slice(0, 300)}`,
      "CLOUDCONVERT_ERROR",
      502
    );
  }

  let json: { data?: T };
  try {
json = (await res.json()) as { data?: T };  } catch (err) {
    throw new AppError(
      `The conversion service returned a response that wasn't valid JSON. (${err instanceof Error ? err.message : "parse error"})`,
      "CLOUDCONVERT_BAD_RESPONSE",
      502
    );
  }

  if (json.data === undefined) {
    throw new AppError("The conversion service response was missing expected data.", "CLOUDCONVERT_BAD_RESPONSE", 502);
  }

  return json.data;
}

async function uploadFile(uploadTask: CloudConvertTask, filePath: string): Promise<void> {
  const form = uploadTask.result?.form;
  if (!form) throw new AppError("Conversion service didn't return an upload target.", "CLOUDCONVERT_ERROR", 502);

  const fileBuffer = await fs.readFile(filePath);
  const body = new FormData();
  for (const [key, value] of Object.entries(form.parameters)) {
    body.append(key, value);
  }
  body.append("file", new Blob([fileBuffer]), path.basename(filePath));

  let res: Response;
  try {
    res = await fetch(form.url, { method: "POST", body });
  } catch (err) {
    throw new AppError(
      `Uploading the file to the conversion service failed. (${err instanceof Error ? err.message : "network error"})`,
      "CLOUDCONVERT_UPLOAD_FAILED",
      502
    );
  }
  if (!res.ok) {
    throw new AppError(`Uploading the file to the conversion service failed (HTTP ${res.status}).`, "CLOUDCONVERT_UPLOAD_FAILED", 502);
  }
}

async function pollJobUntilFinished(jobId: string, timeoutMs = 120_000): Promise<CloudConvertJob> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await apiRequest<CloudConvertJob>(`/jobs/${jobId}`);
    if (job.status === "finished") return job;
    if (job.status === "error") {
      const failedTask = (job.tasks ?? []).find((t) => t.status === "error");
      throw new AppError(
        `Conversion failed: ${failedTask?.message ?? "unknown error from the conversion service."}`,
        "CLOUDCONVERT_JOB_FAILED",
        502
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new AppError("The conversion service is taking too long to respond. Please try again.", "CLOUDCONVERT_TIMEOUT", 504);
}

export interface ConvertFileOptions {
  inputFormat: string;
  outputFormat: string;
  /** Optional per-conversion engine options, e.g. { engine: "office" } or page range for renders. */
  extra?: Record<string, unknown>;
}

/**
 * Converts a single file via CloudConvert and downloads the result(s) to
 * outputDir. Returns every output file's path — some conversions (e.g. a
 * multi-page PDF rendered to images) produce more than one file, which the
 * caller/controller already knows how to package into a ZIP.
 */
export async function convertFileViaCloudConvert(
  inputPath: string,
  outputDir: string,
  { inputFormat, outputFormat, extra }: ConvertFileOptions
): Promise<string[]> {
  assertConfigured();

  const job = await apiRequest<CloudConvertJob>("/jobs", {
    method: "POST",
    body: JSON.stringify({
      tasks: {
        "import-1": { operation: "import/upload" },
        "convert-1": {
          operation: "convert",
          input: "import-1",
          input_format: inputFormat,
          output_format: outputFormat,
          ...extra,
        },
        "export-1": { operation: "export/url", input: "convert-1" },
      },
    }),
  });

  const uploadTask = (job.tasks ?? []).find((t) => t.name === "import-1");
  if (!uploadTask) throw new AppError("Conversion service response was malformed.", "CLOUDCONVERT_ERROR", 502);
  await uploadFile(uploadTask, inputPath);

  const finishedJob = await pollJobUntilFinished(job.id);
  const exportTask = (finishedJob.tasks ?? []).find((t) => t.name === "export-1");
  const files = exportTask?.result?.files ?? [];

  if (files.length === 0) {
    throw new AppError("The conversion completed but produced no output file.", "CLOUDCONVERT_NO_OUTPUT", 502);
  }

  const outputPaths: string[] = [];
  for (const file of files) {
    let res: Response;
    try {
      res = await fetch(file.url);
    } catch (err) {
      throw new AppError(
        `Couldn't download the converted file. (${err instanceof Error ? err.message : "network error"})`,
        "CLOUDCONVERT_DOWNLOAD_FAILED",
        502
      );
    }
    if (!res.ok) throw new AppError(`Couldn't download the converted file (HTTP ${res.status}).`, "CLOUDCONVERT_DOWNLOAD_FAILED", 502);
    const buffer = Buffer.from(await res.arrayBuffer());
    const outputPath = path.join(outputDir, file.filename || `output-${outputPaths.length + 1}.${outputFormat}`);
    await fs.writeFile(outputPath, buffer);
    outputPaths.push(outputPath);
  }

  return outputPaths;
}

/** Quick check used by callers that want to fail fast with a clear message before reading the file. */
export function isCloudConvertConfigured(): boolean {
  return Boolean(env.cloudConvertApiKey) && !env.cloudConvertApiKey.startsWith("REPLACE_WITH");
}

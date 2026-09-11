const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Wraps fetch() so a network failure (backend unreachable — wrong
 * VITE_API_URL, backend not deployed, CORS misconfiguration) produces a
 * specific, diagnosable error instead of an unhandled exception or a vague
 * "something went wrong." This matters a lot in production: if the
 * frontend and backend are deployed separately (e.g. frontend on Vercel,
 * backend on Render), a misconfigured VITE_API_URL means EVERY tool fails
 * identically, and this is what tells you why.
 */
async function safeFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    throw new ApiError(
      `Couldn't reach the server at "${input}". If this is a production deployment, check that VITE_API_URL points to your actual backend URL and that the backend is running. (${err instanceof Error ? err.message : "network error"})`,
      "NETWORK_ERROR",
      0
    );
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";

  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string } } = {};
    let rawBody = "";
    try {
      rawBody = await res.text();
      payload = JSON.parse(rawBody);
    } catch {
      // Response wasn't JSON — very likely means the request hit a static
      // host's own 404/error page rather than this app's API at all (e.g.
      // the backend isn't deployed, or VITE_API_URL is wrong and the
      // request landed on the frontend's own domain with no API there).
      throw new ApiError(
        res.status === 404
          ? "The server returned a plain 404 instead of an API response — this usually means the backend isn't deployed or reachable at the configured API URL, not that the specific tool failed."
          : `The server returned an unexpected non-JSON response (HTTP ${res.status}).`,
        "NON_JSON_RESPONSE",
        res.status
      );
    }
    throw new ApiError(
      payload.error?.message ?? `Request failed (HTTP ${res.status}).`,
      payload.error?.code ?? "UNKNOWN_ERROR",
      res.status
    );
  }

  if (!contentType.includes("application/json")) {
    throw new ApiError(
      "The server responded successfully but not with JSON — check VITE_API_URL is pointing at the API, not the frontend itself.",
      "NON_JSON_RESPONSE",
      res.status
    );
  }

  return res.json() as Promise<T>;
}

export interface JobResponse {
  jobId: string;
  status: "queued" | "processing" | "done" | "failed";
  error?: string;
}

export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "unsupported";
  options?: string[];
}

export async function inspectFillablePdf(file: File): Promise<FormFieldInfo[]> {
  const formData = new FormData();
  formData.append("files", file);
  const res = await safeFetch(`${API_BASE}/tools/fill-pdf/inspect`, { method: "POST", body: formData });
  const data = await handleResponse<{ fields: FormFieldInfo[] }>(res);
  return data.fields;
}

export async function createJob(toolSlug: string, files: File[], options: Record<string, unknown> = {}): Promise<JobResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("options", JSON.stringify(options));

  const res = await safeFetch(`${API_BASE}/tools/${toolSlug}/run`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<JobResponse>(res);
}

export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const res = await safeFetch(`${API_BASE}/jobs/${jobId}`);
  return handleResponse<JobResponse>(res);
}

export function getJobDownloadUrl(jobId: string): string {
  return `${API_BASE}/jobs/${jobId}/download`;
}

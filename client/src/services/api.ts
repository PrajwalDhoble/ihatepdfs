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

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string } } = {};
    try {
      payload = await res.json();
    } catch {
      // response body wasn't JSON
    }
    throw new ApiError(
      payload.error?.message ?? "Something went wrong while processing your request.",
      payload.error?.code ?? "UNKNOWN_ERROR",
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
  const res = await fetch(`${API_BASE}/tools/fill-pdf/inspect`, { method: "POST", body: formData });
  const data = await handleResponse<{ fields: FormFieldInfo[] }>(res);
  return data.fields;
}

export async function createJob(toolSlug: string, files: File[], options: Record<string, unknown> = {}): Promise<JobResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("options", JSON.stringify(options));

  const res = await fetch(`${API_BASE}/tools/${toolSlug}/run`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<JobResponse>(res);
}

export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_BASE}/jobs/${jobId}`);
  return handleResponse<JobResponse>(res);
}

export function getJobDownloadUrl(jobId: string): string {
  return `${API_BASE}/jobs/${jobId}/download`;
}

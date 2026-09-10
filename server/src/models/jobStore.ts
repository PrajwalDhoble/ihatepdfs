export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface JobRecord {
  id: string;
  toolSlug: string;
  status: JobStatus;
  createdAt: number;
  outputFiles: string[]; // absolute paths within the job's output dir
  error?: string;
}

/**
 * Simple in-memory job registry. Sufficient for a single-instance MVP where
 * jobs complete in seconds and don't need to survive a server restart.
 * If the app scales to multiple instances or needs durable job history,
 * swap this for the `jobs` MongoDB collection described in the Phase 0
 * architecture doc — the JobRecord shape maps directly onto that schema.
 */
const jobs = new Map<string, JobRecord>();

export function createJobRecord(id: string, toolSlug: string): JobRecord {
  const record: JobRecord = { id, toolSlug, status: "queued", createdAt: Date.now(), outputFiles: [] };
  jobs.set(id, record);
  return record;
}

export function getJobRecord(id: string): JobRecord | undefined {
  return jobs.get(id);
}

export function updateJobRecord(id: string, patch: Partial<JobRecord>): void {
  const existing = jobs.get(id);
  if (!existing) return;
  jobs.set(id, { ...existing, ...patch });
}

export function deleteJobRecord(id: string): void {
  jobs.delete(id);
}

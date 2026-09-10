import { Request, Response, NextFunction } from "express";
import path from "node:path";
import { getJobRecord, deleteJobRecord } from "../models/jobStore.js";
import { deleteJobWorkspace } from "../utils/tempDir.js";
import { AppError } from "../middleware/errorHandler.js";

export function getJobStatus(req: Request, res: Response, next: NextFunction): void {
  const job = getJobRecord(req.params.id);
  if (!job) return next(new AppError("Job not found or has expired.", "JOB_NOT_FOUND", 404));

  res.json({ jobId: job.id, status: job.status, error: job.error });
}

export async function downloadJob(req: Request, res: Response, next: NextFunction): Promise<void> {
  const job = getJobRecord(req.params.id);
  if (!job) return next(new AppError("Job not found or has expired.", "JOB_NOT_FOUND", 404));
  if (job.status !== "done") return next(new AppError("This job hasn't finished processing yet.", "JOB_NOT_READY", 409));
  if (job.outputFiles.length === 0) return next(new AppError("No output file was produced.", "NO_OUTPUT", 500));

  // Single output file streams directly; multiple outputs would be zipped
  // by the processor itself so there's always exactly one file to stream.
  const filePath = job.outputFiles[0];
  const filename = path.basename(filePath);

  res.download(filePath, filename, async (err) => {
    if (err) {
      console.error("[download] Failed to stream file:", err);
      return;
    }
    // Clean up immediately after a successful download rather than waiting
    // for the expiry sweep.
    await deleteJobWorkspace(job.id).catch(() => undefined);
    deleteJobRecord(job.id);
  });
}

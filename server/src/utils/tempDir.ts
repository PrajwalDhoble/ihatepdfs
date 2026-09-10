import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

export interface JobWorkspace {
  jobId: string;
  root: string;
  inputDir: string;
  outputDir: string;
}

/**
 * Creates an isolated temporary workspace for a single job:
 *   /tmp/repairmypdf/{jobId}/input
 *   /tmp/repairmypdf/{jobId}/output
 * The jobId is always a server-generated UUID (see controllers), never
 * derived from user input, which is what actually prevents path traversal —
 * sanitizeFilename() is defense in depth on top of this.
 */
export async function createJobWorkspace(jobId: string): Promise<JobWorkspace> {
  const root = path.join(env.tempDir, jobId);
  const inputDir = path.join(root, "input");
  const outputDir = path.join(root, "output");

  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  return { jobId, root, inputDir, outputDir };
}

export async function deleteJobWorkspace(jobId: string): Promise<void> {
  const root = path.join(env.tempDir, jobId);
  await fs.rm(root, { recursive: true, force: true });
}

/**
 * Sweeps the temp root for job workspaces older than the configured
 * expiry and removes them. Runs on an interval and should also be called
 * defensively at server startup in case of an earlier unclean shutdown.
 */
export async function cleanupExpiredWorkspaces(): Promise<void> {
  const expiryMs = env.jobExpiryMinutes * 60 * 1000;
  let entries: string[];

  try {
    entries = await fs.readdir(env.tempDir);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return; // nothing to clean yet
    console.error("[cleanup] Failed to read temp dir:", err);
    return;
  }

  await Promise.all(
    entries.map(async (jobId) => {
      const jobPath = path.join(env.tempDir, jobId);
      try {
        const stats = await fs.stat(jobPath);
        const age = Date.now() - stats.mtimeMs;
        if (age > expiryMs) {
          await fs.rm(jobPath, { recursive: true, force: true });
          console.log(`[cleanup] Removed expired job workspace: ${jobId}`);
        }
      } catch {
        // Workspace may have been removed concurrently — safe to ignore.
      }
    })
  );
}

let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupScheduler(intervalMs = 10 * 60 * 1000): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    cleanupExpiredWorkspaces().catch((err) => console.error("[cleanup] Sweep failed:", err));
  }, intervalMs);
  // Run once at startup too, in case of a previous unclean shutdown.
  cleanupExpiredWorkspaces().catch((err) => console.error("[cleanup] Initial sweep failed:", err));
}

export function stopCleanupScheduler(): void {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = null;
}

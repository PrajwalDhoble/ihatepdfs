import { Request, Response, NextFunction } from "express";
import { v4 as uuid } from "uuid";
import fs from "node:fs/promises";
import path from "node:path";
import { Tool } from "@shared/tools";
import { createJobWorkspace, deleteJobWorkspace } from "../utils/tempDir.js";
import { validateFileSignature } from "../security/fileSignature.js";
import { sanitizeFilename, getExtension } from "../security/sanitizeFilename.js";
import { createJobRecord, updateJobRecord } from "../models/jobStore.js";
import { AppError } from "../middleware/errorHandler.js";
import { runProcessor } from "../processors/index.js";
import { zipFiles } from "../utils/zip.js";

async function zipOutputs(files: string[], outputDir: string): Promise<string> {
  const zipPath = path.join(outputDir, "results.zip");
  await zipFiles(files, zipPath);
  return zipPath;
}

interface RequestWithTool extends Request {
  tool: Tool;
}

/**
 * POST /api/tools/:slug/run
 * Validates file signatures (defense beyond the extension/size check already
 * done in middleware/validate.ts), moves files into an isolated job
 * workspace, then hands off to the tool's processor. Runs synchronously and
 * returns the finished job for fast tools; the same JobResponse shape lets
 * the client treat every tool consistently even before slower tools switch
 * to true async polling.
 */
export async function runTool(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { tool } = req as RequestWithTool;
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const jobId = uuid();

  try {
    const workspace = await createJobWorkspace(jobId);
    createJobRecord(jobId, tool.slug);
    updateJobRecord(jobId, { status: "processing" });

    const inputPaths: string[] = [];

    for (const file of files) {
      const ext = getExtension(file.originalname);
      const signatureResult = await validateFileSignature(file.path, ext);
      if (!signatureResult.valid) {
        throw new AppError(
          signatureResult.reason ?? "This file's content doesn't match its expected format.",
          "INVALID_FILE_SIGNATURE",
          400
        );
      }

      const safeName = sanitizeFilename(file.originalname);
      const destination = path.join(workspace.inputDir, safeName);
      await fs.rename(file.path, destination);
      inputPaths.push(destination);
    }

    let options: Record<string, unknown> = {};
    try {
      options = req.body?.options ? JSON.parse(req.body.options) : {};
    } catch {
      throw new AppError("Invalid options payload.", "INVALID_OPTIONS", 400);
    }

    const rawOutputs = await runProcessor(tool.slug, {
      inputPaths,
      outputDir: workspace.outputDir,
      options,
    });

    // If a processor produced multiple output files (e.g. batch image
    // compression), package them into one ZIP — the download endpoint
    // always streams exactly one file per job.
    const outputFiles =
      rawOutputs.length > 1 ? [await zipOutputs(rawOutputs, workspace.outputDir)] : rawOutputs;

    updateJobRecord(jobId, { status: "done", outputFiles });

    res.status(200).json({ jobId, status: "done" });
  } catch (err) {
    updateJobRecord(jobId, { status: "failed", error: err instanceof Error ? err.message : "Unknown error" });
    await deleteJobWorkspace(jobId).catch(() => undefined);
    next(err);
  }
}

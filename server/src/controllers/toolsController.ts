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
import { inspectPdfForm } from "../processors/pdfFormProcessor.js";

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
    // Clean up original multer temp files too — on early failures (e.g.
    // signature validation) they were never renamed into the job
    // workspace, so deleteJobWorkspace() alone wouldn't remove them.
    await Promise.all(files.map((f) => fs.unlink(f.path).catch(() => undefined)));
    next(err);
  }
}

/**
 * POST /api/tools/fill-pdf/inspect
 * Stateless first step for Fill PDF: reads the uploaded PDF's AcroForm
 * fields and returns them so the client can render a matching input for
 * each one. The file itself is discarded immediately after — the client
 * re-uploads it (with the collected values) to the normal run endpoint,
 * so no server-side session state is needed between the two steps.
 */
export async function inspectFillablePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  const uploaded = (req.files as Express.Multer.File[] | undefined)?.[0];
  if (!uploaded) {
    next(new AppError("No file was uploaded.", "NO_FILE", 400));
    return;
  }

  try {
    const signatureResult = await validateFileSignature(uploaded.path, "pdf");
    if (!signatureResult.valid) {
      throw new AppError(signatureResult.reason ?? "This doesn't look like a valid PDF.", "INVALID_FILE_SIGNATURE", 400);
    }
    const fields = await inspectPdfForm(uploaded.path);
    res.json({ fields });
  } catch (err) {
    next(err);
  } finally {
    await fs.unlink(uploaded.path).catch(() => undefined);
  }
}

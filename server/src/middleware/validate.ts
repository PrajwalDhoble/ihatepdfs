import { NextFunction, Request, Response } from "express";
import { getToolBySlug } from "../../../shared/tools/index.js";import { AppError } from "./errorHandler.js";
import { getExtension } from "../security/sanitizeFilename.js";

/**
 * Confirms the requested tool exists, is active (not "coming-soon"), and
 * that uploaded files satisfy its registry-defined format/size/count
 * limits, before any processor or subprocess ever sees the files.
 */
export function validateToolRequest(req: Request, _res: Response, next: NextFunction): void {
  const { slug } = req.params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return next(new AppError(`Unknown tool: ${slug}`, "TOOL_NOT_FOUND", 404));
  }

  if (tool.status !== "active") {
    return next(new AppError(`${tool.name} isn't available yet.`, "TOOL_COMING_SOON", 501));
  }

  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    return next(new AppError("No file was uploaded.", "NO_FILE", 400));
  }

  if (files.length > tool.limits.maxFiles) {
    return next(
      new AppError(
        tool.limits.maxFiles === 1
          ? "Only one file can be uploaded for this tool."
          : `You can upload up to ${tool.limits.maxFiles} files at a time.`,
        "TOO_MANY_FILES",
        400
      )
    );
  }

  for (const file of files) {
    const ext = getExtension(file.originalname);
    if (tool.inputFormats.length > 0 && !tool.inputFormats.includes(ext)) {
      return next(
        new AppError(
          `"${file.originalname}" isn't a supported format for ${tool.name}. Accepted: ${tool.inputFormats.join(", ").toUpperCase()}.`,
          "UNSUPPORTED_FORMAT",
          400
        )
      );
    }

    const maxBytes = tool.limits.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return next(
        new AppError(
          `"${file.originalname}" exceeds the maximum allowed size of ${tool.limits.maxFileSizeMB}MB.`,
          "FILE_TOO_LARGE",
          413
        )
      );
    }
  }

  // Attach the resolved tool so the controller doesn't need to look it up again.
  (req as Request & { tool: typeof tool }).tool = tool;
  next();
}

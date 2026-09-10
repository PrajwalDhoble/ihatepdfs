import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "This endpoint does not exist." } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Multer file-size errors etc. arrive as plain Error with a `code` field.
  const maybeCoded = err as { code?: string; message?: string };
  if (maybeCoded?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      error: { code: "FILE_TOO_LARGE", message: "The file exceeds the maximum allowed size." },
    });
    return;
  }

  console.error("[unhandled error]", err);

  // Surface the real underlying message instead of a static generic string.
  // We were hiding this even in development, which made every distinct
  // failure look identical to the person using the app. The message text
  // (not the stack trace) is safe to show — it's diagnostic information,
  // not a secret — and ends the "please paste your server log" loop for
  // anything that reaches this fallback.
  const underlyingMessage = err instanceof Error && err.message ? err.message : null;

  res.status(500).json({
    error: {
      code: "PROCESSING_FAILED",
      message: underlyingMessage
        ? `Processing failed: ${underlyingMessage}`
        : "Processing failed. Please try again.",
    },
  });
}

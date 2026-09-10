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
  res.status(500).json({
    error: {
      code: "PROCESSING_FAILED",
      message: "Processing failed. Please try again.",
    },
  });
}

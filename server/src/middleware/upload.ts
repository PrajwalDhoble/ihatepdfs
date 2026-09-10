import multer from "multer";
import { env } from "../config/env.js";

/**
 * Files are buffered to a temp disk location (not memory) so large uploads
 * don't exhaust server RAM, and are never written to a path derived from
 * the user-supplied filename — multer's default temp naming is used here,
 * and the real, isolated job workspace is created separately per request
 * (see utils/tempDir.ts) once basic multer-level validation has passed.
 */
export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, "/tmp"),
    filename: (_req, file, cb) => {
      // Multer's own temp filename — intentionally NOT the user's filename.
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `upload-${unique}`);
    },
  }),
  limits: {
    fileSize: env.maxUploadMB * 1024 * 1024,
    files: 20,
  },
});

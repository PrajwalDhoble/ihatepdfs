import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

/**
 * Files are buffered to disk (not memory) so large uploads don't exhaust
 * server RAM. Critically, they're written into a subfolder of TEMP_DIR
 * (not a hardcoded "/tmp") so the later `fs.rename()` into the job's
 * workspace (also under TEMP_DIR) always stays on the same filesystem.
 * Mixing "/tmp" with a separately-mounted TEMP_DIR is what causes cross-
 * device rename failures — reliably in Docker (where TEMP_DIR is a named
 * volume) and always on Windows (where "/tmp" doesn't exist at all).
 */
const incomingDir = path.join(env.tempDir, "_incoming");
fs.mkdirSync(incomingDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, incomingDir),
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

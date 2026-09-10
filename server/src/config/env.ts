import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Load server/.env by a path resolved from this file's own location, not
// from process.cwd(). Relying on cwd is the classic reason ".env" silently
// fails to load — it depends on exactly how/where the process was started
// (root of the monorepo vs. server/ vs. a different terminal setup), and
// dotenv does NOT throw or warn if the file it expected isn't found there;
// every variable just silently stays unset. Resolving relative to this
// file (server/src/config/env.ts -> server/.env) removes that ambiguity
// entirely, regardless of how the dev/start script was invoked.
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(currentDir, "../../.env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(
    `[config] Could not load ${envPath} (${result.error.message}). ` +
      "Falling back to environment variables already set in the shell, if any. " +
      "If you meant to configure CLOUDCONVERT_API_KEY etc., confirm the file is at server/.env " +
      '(not server/.env.txt or server/.env.example) — on Windows, check "Folder Options" isn\'t hiding the real extension.'
  );
} else {
  console.log(`[config] Loaded environment from ${envPath}`);
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  // Defensive: strips accidental surrounding quotes and whitespace. dotenv
  // normally handles quoted values itself, but this guards against edge
  // cases (values set via shell export, Docker env files, copy/paste with
  // trailing whitespace) that can otherwise silently break the API key.
  return raw.trim().replace(/^['"]|['"]$/g, "").trim();
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongoUri: process.env.MONGO_URI ?? "", // optional in MVP — see server/src/config/db.ts
  tempDir: process.env.TEMP_DIR ?? "/tmp/repairmypdf",
  maxUploadMB: parseInt(process.env.MAX_UPLOAD_MB ?? "100", 10),
  jobExpiryMinutes: parseInt(process.env.JOB_EXPIRY_MINUTES ?? "60", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? "30", 10),

  // Paid conversion API — used for Office<->PDF, PDF->JPG/PNG rendering,
  // and as the rasterizer OCR PDF needs before running text recognition.
  // Sign up at https://cloudconvert.com, create an API key under
  // Dashboard -> API v2 -> API Keys, and put it here. Tools that need this
  // return a clear "not configured" error rather than failing silently if
  // it's left as the placeholder.
  cloudConvertApiKey: cleanEnvValue(process.env.CLOUDCONVERT_API_KEY),

  // Path to the qpdf binary, used for Protect PDF / Unlock PDF. Free and
  // open-source but must be installed on the host OS (it's a system binary,
  // not an npm package) — see README for install instructions per OS.
  qpdfPath: process.env.QPDF_PATH ?? "qpdf",
};

export { required };

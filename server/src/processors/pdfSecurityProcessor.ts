import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { ProcessorInput } from "./index.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

const execFileAsync = promisify(execFile);

/**
 * qpdf is free and open-source but is a SYSTEM BINARY, not an npm package —
 * it must be installed on the host separately (apt/brew/etc. — see README).
 * pdf-lib has no PDF encryption support at all, so this is the only free
 * route to real Protect/Unlock functionality. If qpdf isn't found, we fail
 * with a specific, actionable error rather than a generic one.
 */
async function ensureQpdfAvailable(): Promise<void> {
  try {
    await execFileAsync(env.qpdfPath, ["--version"]);
  } catch {
    throw new AppError(
      `qpdf isn't installed or isn't on the PATH (looked for "${env.qpdfPath}"). ` +
        "Install it (apt install qpdf / brew install qpdf) or set QPDF_PATH in server/.env to its full path.",
      "QPDF_NOT_AVAILABLE",
      503
    );
  }
}

interface ProtectOptions {
  password?: string;
}

export async function protectPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as ProtectOptions;
  const password = (opts.password ?? "").trim();
  if (!password) throw new AppError("Enter a password to protect the PDF with.", "MISSING_OPTIONS", 400);
  if (password.length < 4) throw new AppError("Use a password of at least 4 characters.", "INVALID_OPTIONS", 400);

  await ensureQpdfAvailable();

  const outputPath = path.join(outputDir, "protected.pdf");
  try {
    // Same password used for both user and owner password for simplicity —
    // this is the common case for "add a password" tools. 256-bit AES.
    await execFileAsync(env.qpdfPath, [
      "--encrypt",
      password,
      password,
      "256",
      "--",
      inputPaths[0],
      outputPath,
    ]);
  } catch (err) {
    throw new AppError(
      "Couldn't encrypt this PDF — it may already be encrypted or corrupted.",
      "ENCRYPT_FAILED",
      400
    );
  }

  return [outputPath];
}

interface UnlockOptions {
  password?: string;
}

export async function unlockPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as UnlockOptions;
  const password = (opts.password ?? "").trim();
  if (!password) throw new AppError("Enter the PDF's current password.", "MISSING_OPTIONS", 400);

  await ensureQpdfAvailable();

  const outputPath = path.join(outputDir, "unlocked.pdf");
  try {
    await execFileAsync(env.qpdfPath, [
      `--password=${password}`,
      "--decrypt",
      inputPaths[0],
      outputPath,
    ]);
  } catch {
    throw new AppError(
      "Couldn't unlock this PDF — the password may be incorrect, or the file isn't encrypted.",
      "DECRYPT_FAILED",
      400
    );
  }

  return [outputPath];
}

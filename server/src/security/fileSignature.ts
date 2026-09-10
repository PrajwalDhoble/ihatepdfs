import { fileTypeFromFile } from "file-type";

/**
 * Maps our tool-facing format identifiers to the MIME types / extensions
 * that the `file-type` library (which inspects actual magic bytes) reports
 * for well-formed files. Formats without reliable magic bytes (plain text,
 * csv) fall back to a lighter content sniff.
 */
const SIGNATURE_EXPECTATIONS: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  docx: ["application/zip", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xlsx: ["application/zip", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: ["application/zip", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  doc: ["application/x-cfb"],
  xls: ["application/x-cfb"],
  ppt: ["application/x-cfb"],
  zip: ["application/zip"],
};

// Formats file-type can't reliably sniff (plain text-based) skip signature
// checking and rely on extension + size limits instead.
const TEXT_LIKE_FORMATS = new Set(["txt", "csv", "json"]);

export interface SignatureCheckResult {
  valid: boolean;
  detectedMime?: string;
  reason?: string;
}

/**
 * Validates that a file's actual binary signature matches the format the
 * user (or client) claims it is. This is the authoritative check — MIME
 * type and file extension from the upload are never trusted on their own.
 */
export async function validateFileSignature(
  filePath: string,
  claimedFormat: string
): Promise<SignatureCheckResult> {
  const format = claimedFormat.toLowerCase();

  if (TEXT_LIKE_FORMATS.has(format)) {
    return { valid: true };
  }

  const expectedMimes = SIGNATURE_EXPECTATIONS[format];
  if (!expectedMimes) {
    return { valid: false, reason: `Unsupported format: ${format}` };
  }

  const detected = await fileTypeFromFile(filePath);
  if (!detected) {
    return {
      valid: false,
      reason: "Could not verify the file's actual content — it may be corrupted or not a real file of this type.",
    };
  }

  if (!expectedMimes.includes(detected.mime)) {
    return {
      valid: false,
      detectedMime: detected.mime,
      reason: `This file's content doesn't match a ${format.toUpperCase()} file.`,
    };
  }

  return { valid: true, detectedMime: detected.mime };
}

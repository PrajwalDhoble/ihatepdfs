export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Client-side validation is a UX convenience only — the server independently
 * re-validates (extension, MIME, file signature, size) since client checks
 * can always be bypassed.
 */
export function validateFile(
  file: File,
  opts: { acceptFormats: string[]; maxFileSizeMB: number }
): ValidationResult {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const normalizedFormats = opts.acceptFormats.map((f) => f.toLowerCase());

  if (normalizedFormats.length > 0 && !normalizedFormats.includes(ext)) {
    return {
      valid: false,
      error: `This file type isn't supported. Accepted formats: ${opts.acceptFormats.join(", ").toUpperCase()}.`,
    };
  }

  const maxBytes = opts.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `The file exceeds the maximum allowed size of ${opts.maxFileSizeMB}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "This file appears to be empty." };
  }

  return { valid: true };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

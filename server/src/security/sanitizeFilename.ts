import path from "node:path";

/**
 * Strips directory components and dangerous characters from a user-supplied
 * filename. The sanitized name is used only for display/download naming —
 * actual files on disk are always stored under a randomly generated job ID,
 * never under a name derived from user input, so this is defense in depth
 * rather than the primary path-traversal protection.
 */
export function sanitizeFilename(originalName: string): string {
  const base = path.basename(originalName); // strips any directory traversal segments
  const cleaned = base
    .replace(/[^a-zA-Z0-9.\-_ ]/g, "") // remove anything not alphanumeric/dot/dash/underscore/space
    .replace(/\.{2,}/g, ".") // collapse repeated dots (blocks "..", "...", etc.)
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 200) : "file";
}

export function getExtension(filename: string): string {
  return path.extname(filename).replace(".", "").toLowerCase();
}

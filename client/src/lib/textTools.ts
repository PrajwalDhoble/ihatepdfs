/** Text Tools */

export function convertCase(text: string, mode: "upper" | "lower" | "title" | "sentence"): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "sentence":
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
  }
}

export function findAndReplace(text: string, find: string, replace: string, caseSensitive: boolean): string {
  if (!find) return text;
  const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped, caseSensitive ? "g" : "gi");
  return text.replace(re, replace);
}

export function removeDuplicateLines(text: string): string {
  const seen = new Set<string>();
  return text
    .split("\n")
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .join("\n");
}

export function removeExtraSpaces(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
    .join("\n");
}

export function reverseText(text: string, mode: "characters" | "words" | "lines"): string {
  if (mode === "characters") return text.split("").reverse().join("");
  if (mode === "words") return text.split(/(\s+)/).reverse().join("");
  return text.split("\n").reverse().join("\n");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat".split(
    " "
  );

export function generateLoremIpsum(paragraphs: number, wordsPerParagraph: number): string {
  const out: string[] = [];
  for (let p = 0; p < paragraphs; p++) {
    const words: string[] = [];
    for (let w = 0; w < wordsPerParagraph; w++) {
      words.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
    }
    const para = words.join(" ");
    out.push(para.charAt(0).toUpperCase() + para.slice(1) + ".");
  }
  return out.join("\n\n");
}

export interface DiffChunk {
  type: "same" | "added" | "removed";
  lines: string[];
}

/** LCS-based line diff, mirrors the same algorithm used server-side for PDF text comparison. */
export function diffText(a: string, b: string): DiffChunk[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const n = linesA.length;
  const m = linesB.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = linesA[i] === linesB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const chunks: DiffChunk[] = [];
  let i = 0;
  let j = 0;
  function push(type: DiffChunk["type"], line: string) {
    const last = chunks[chunks.length - 1];
    if (last && last.type === type) last.lines.push(line);
    else chunks.push({ type, lines: [line] });
  }
  while (i < n && j < m) {
    if (linesA[i] === linesB[j]) {
      push("same", linesA[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      push("removed", linesA[i]);
      i++;
    } else {
      push("added", linesB[j]);
      j++;
    }
  }
  while (i < n) push("removed", linesA[i++]);
  while (j < m) push("added", linesB[j++]);
  return chunks;
}

/** Developer Tools */

export function formatJson(input: string, minify: boolean): string {
  const parsed = JSON.parse(input);
  return minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
}

export function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(text: string): string {
  return decodeURIComponent(escape(atob(text)));
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  return decodeURIComponent(text);
}

export interface DecodedJwt {
  header: unknown;
  payload: unknown;
}

export function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("That doesn't look like a valid JWT (expected three dot-separated parts).");
  const decodePart = (p: string) => JSON.parse(base64Decode(p.replace(/-/g, "+").replace(/_/g, "/")));
  return { header: decodePart(parts[0]), payload: decodePart(parts[1]) };
}

export async function hashText(text: string, algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512"): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateUuid(count: number): string {
  return Array.from({ length: count }, () => crypto.randomUUID()).join("\n");
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(num)) throw new Error("Enter a valid hex color, e.g. #1857e0.");
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Data Tools */

export function csvToJson(csv: string): string {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return "[]";
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

export function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  if (!Array.isArray(data) || data.length === 0) throw new Error("Provide a JSON array of objects.");
  const headers = Array.from(new Set(data.flatMap((row) => Object.keys(row))));
  const escapeCell = (val: unknown) => {
    const s = val === undefined || val === null ? "" : String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(","), ...data.map((row) => headers.map((h) => escapeCell(row[h])).join(","))];
  return lines.join("\n");
}

/** Time Tools */

export function unixToDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toString();
}

export function dateToUnix(dateStr: string): number {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) throw new Error("Enter a valid date.");
  return Math.floor(t / 1000);
}

export function dateDifference(a: string, b: string): { days: number; weeks: number; months: number } {
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) throw new Error("Enter two valid dates.");
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { days, weeks: Math.round((days / 7) * 10) / 10, months: Math.round((days / 30.44) * 10) / 10 };
}

/** Business Tools */

export function calculateEmi(principal: number, annualRatePercent: number, months: number): number {
  const monthlyRate = annualRatePercent / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
}

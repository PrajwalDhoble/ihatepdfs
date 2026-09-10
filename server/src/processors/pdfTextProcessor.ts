import pdfParse from "pdf-parse";
import fs from "node:fs/promises";
import path from "node:path";
import { diffLines } from "../utils/textDiff.js";
import { ProcessorInput } from "./index.js";
import { AppError } from "../middleware/errorHandler.js";

async function extractText(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  } catch {
    throw new AppError("Couldn't extract text — this PDF may be scanned (image-only) or corrupted.", "EXTRACT_FAILED", 400);
  }
}

export async function extractPdfText({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  const text = await extractText(inputPaths[0]);
  const outputPath = path.join(outputDir, "extracted-text.txt");
  await fs.writeFile(outputPath, text || "(No extractable text was found in this PDF — it may be a scanned/image-only document.)");
  return [outputPath];
}

/**
 * Text-based comparison: extracts text from both PDFs and produces a
 * unified line-diff report. This is a content comparison, not a
 * pixel/visual comparison of page layout — described as such to the user.
 */
export async function comparePdfs({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  if (inputPaths.length !== 2) {
    throw new AppError("Upload exactly two PDF files to compare.", "INVALID_FILE_COUNT", 400);
  }

  const [textA, textB] = await Promise.all([extractText(inputPaths[0]), extractText(inputPaths[1])]);
  const diff = diffLines(textA, textB);

  const lines: string[] = [
    `Comparison of "${path.basename(inputPaths[0])}" and "${path.basename(inputPaths[1])}"`,
    `(text-content comparison — page layout and images are not compared)`,
    "",
  ];

  for (const chunk of diff) {
    const prefix = chunk.type === "added" ? "+ " : chunk.type === "removed" ? "- " : "  ";
    lines.push(...chunk.lines.map((l) => `${prefix}${l}`));
  }

  const outputPath = path.join(outputDir, "comparison-report.txt");
  await fs.writeFile(outputPath, lines.join("\n"));
  return [outputPath];
}

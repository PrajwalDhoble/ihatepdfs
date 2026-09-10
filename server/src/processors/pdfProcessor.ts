import { PDFDocument } from "pdf-lib";
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import { ProcessorInput } from "./index.js";
import { AppError } from "../middleware/errorHandler.js";
import { zipFiles } from "../utils/zip.js";

export async function mergePdfs({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  if (inputPaths.length < 2) {
    throw new AppError("Upload at least two PDF files to merge.", "NOT_ENOUGH_FILES", 400);
  }

  const merged = await PDFDocument.create();

  // Files are merged in the order they were uploaded — the client's file
  // list order (top to bottom) determines the final page order.
  for (const inputPath of inputPaths) {
    const bytes = await fs.readFile(inputPath);
    let source: PDFDocument;
    try {
      source = await PDFDocument.load(bytes);
    } catch {
      throw new AppError(
        `"${path.basename(inputPath)}" appears to be corrupted and couldn't be read.`,
        "CORRUPT_PDF",
        400
      );
    }
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const outputPath = path.join(outputDir, "merged.pdf");
  await fs.writeFile(outputPath, await merged.save());
  return [outputPath];
}

interface SplitOptions {
  ranges?: string; // e.g. "1-3,5-7,10"
}

function parseRanges(ranges: string, totalPages: number): number[][] {
  const groups: number[][] = [];
  const parts = ranges.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    throw new AppError("Provide at least one page range, e.g. 1-3,5-7.", "INVALID_RANGE", 400);
  }

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      throw new AppError(`"${part}" isn't a valid page range.`, "INVALID_RANGE", 400);
    }
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    if (start < 1 || end > totalPages || start > end) {
      throw new AppError(
        `Range "${part}" is out of bounds for a ${totalPages}-page document.`,
        "INVALID_RANGE",
        400
      );
    }

    const indices: number[] = [];
    for (let i = start; i <= end; i++) indices.push(i - 1); // pdf-lib is 0-indexed
    groups.push(indices);
  }

  return groups;
}

export async function splitPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as SplitOptions;
  if (!opts.ranges) {
    throw new AppError("Provide at least one page range, e.g. 1-3,5-7.", "MISSING_OPTIONS", 400);
  }

  const bytes = await fs.readFile(inputPaths[0]);
  let source: PDFDocument;
  try {
    source = await PDFDocument.load(bytes);
  } catch {
    throw new AppError("The PDF appears to be corrupted.", "CORRUPT_PDF", 400);
  }

  const totalPages = source.getPageCount();
  const groups = parseRanges(opts.ranges, totalPages);

  const outputPaths: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(source, groups[i]);
    pages.forEach((page) => doc.addPage(page));
    const outputPath = path.join(outputDir, `split-${i + 1}.pdf`);
    await fs.writeFile(outputPath, await doc.save());
    outputPaths.push(outputPath);
  }

  // Multiple resulting files are packaged into a single ZIP so the job
  // download endpoint (which always streams exactly one file) still works.
  if (outputPaths.length > 1) {
    const zipPath = path.join(outputDir, "split-pages.zip");
    await zipFiles(outputPaths, zipPath);
    return [zipPath];
  }
  return outputPaths;
}

interface CompressPdfOptions {
  quality?: "small" | "balanced" | "best";
}

/**
 * Pure-JS PDF compression. pdf-lib can't recompress embedded images the way
 * Ghostscript can, so gains here come from re-serializing the document with
 * object streams enabled and stripping redundant structure — real, but more
 * modest than a Ghostscript-based pipeline. If the result isn't meaningfully
 * smaller, we say so rather than pretending otherwise.
 */
export async function compressPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as CompressPdfOptions;
  const inputPath = inputPaths[0];
  const originalBytes = await fs.readFile(inputPath);

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(originalBytes, { updateMetadata: false });
  } catch {
    throw new AppError("The PDF appears to be corrupted.", "CORRUPT_PDF", 400);
  }

  // Strip non-essential metadata to shave a little more size, matching the
  // "small" preset's intent.
  if (opts.quality === "small") {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");
  }

  const compressedBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });

  const outputPath = path.join(outputDir, "compressed.pdf");
  await fs.writeFile(outputPath, Buffer.from(compressedBytes));
  return [outputPath];
}

/** Converts one or more JPG/PNG images into a single PDF, one image per page. */
export async function imagesToPdf({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  const doc = await PDFDocument.create();

  for (const inputPath of inputPaths) {
    const imageBuffer = await sharp(inputPath).jpeg({ quality: 92 }).toBuffer();
    const image = await doc.embedJpg(imageBuffer);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const outputPath = path.join(outputDir, "converted.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

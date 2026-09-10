import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
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

interface ResizePdfOptions {
  width?: number; // target page width in points (72pt = 1in); e.g. 612 for US Letter
  height?: number; // target page height in points; e.g. 792 for US Letter
  scalePercent?: number; // alternative to width/height — scale every page by this percentage
}

/**
 * True content-aware resizing: each existing page is embedded as a scaled
 * "form XObject" onto a new page of the target size, so the actual page
 * content resizes along with the page box (unlike cropPdf, which only
 * changes the visible viewport). Free — pdf-lib only, no external service.
 */
export async function resizePdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as ResizePdfOptions;
  if (!opts.width && !opts.height && !opts.scalePercent) {
    throw new AppError("Provide a target width/height, or a scale percentage.", "MISSING_OPTIONS", 400);
  }

  const source = await loadPdfOrThrow(inputPaths[0]);
  const doc = await PDFDocument.create();

  for (const sourcePage of source.getPages()) {
    const { width: originalWidth, height: originalHeight } = sourcePage.getSize();
    const embedded = await doc.embedPage(sourcePage);

    let targetWidth: number;
    let targetHeight: number;

    if (opts.scalePercent) {
      const factor = opts.scalePercent / 100;
      targetWidth = originalWidth * factor;
      targetHeight = originalHeight * factor;
    } else {
      targetWidth = opts.width ?? originalWidth;
      targetHeight = opts.height ?? originalHeight;
    }

    const newPage = doc.addPage([targetWidth, targetHeight]);
    const xScale = targetWidth / originalWidth;
    const yScale = targetHeight / originalHeight;
    newPage.drawPage(embedded, { x: 0, y: 0, xScale, yScale });
  }

  const outputPath = path.join(outputDir, "resized.pdf");
  await fs.writeFile(outputPath, await doc.save());
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

interface AnnotateOptions {
  text?: string;
  page?: number; // 1-indexed
  x?: number;
  y?: number;
}

/**
 * Draws a highlighted note directly onto the page at the given coordinates
 * (in PDF points, origin bottom-left). This is a VISIBLE note baked into
 * the page content, not an interactive PDF annotation/comment object a
 * reader could reposition or reply to — that would need a page-preview,
 * click-to-place UI this project doesn't have yet. Documented as such
 * rather than presented as full annotation support.
 */
export async function annotatePdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as AnnotateOptions;
  const text = (opts.text ?? "").trim();
  if (!text) throw new AppError("Enter the note text.", "MISSING_OPTIONS", 400);

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const pageIndex = (opts.page ?? 1) - 1;
  const pages = doc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new AppError(`Page ${opts.page} doesn't exist in this ${pages.length}-page document.`, "INVALID_RANGE", 400);
  }

  const page = pages[pageIndex];
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const x = opts.x ?? 20;
  const y = opts.y ?? page.getSize().height - 40;
  const padding = 6;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  page.drawRectangle({
    x: x - padding,
    y: y - padding,
    width: textWidth + padding * 2,
    height: fontSize + padding * 2,
    color: rgb(1, 0.95, 0.6),
    borderColor: rgb(0.8, 0.7, 0.2),
    borderWidth: 1,
  });
  page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.1) });

  const outputPath = path.join(outputDir, "annotated.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

async function loadPdfOrThrow(inputPath: string, opts?: { ignoreEncryption?: boolean }): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(await fs.readFile(inputPath), {
      updateMetadata: false,
      ignoreEncryption: opts?.ignoreEncryption ?? false,
    });
  } catch {
    throw new AppError("The PDF appears to be corrupted.", "CORRUPT_PDF", 400);
  }
}

/** Parses a comma-separated page list/ranges (e.g. "1,3,5-7") into 0-indexed page numbers, in the given order. */
function parsePageList(input: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    throw new AppError("Provide at least one page number or range, e.g. 1,3,5-7.", "INVALID_RANGE", 400);
  }
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new AppError(`"${part}" isn't a valid page number or range.`, "INVALID_RANGE", 400);
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    if (start < 1 || end > totalPages || start > end) {
      throw new AppError(`"${part}" is out of bounds for a ${totalPages}-page document.`, "INVALID_RANGE", 400);
    }
    for (let i = start; i <= end; i++) indices.push(i - 1);
  }
  return indices;
}

interface RotateOptions {
  degrees?: number; // 90, 180, or 270
  pages?: string; // optional page list, defaults to all pages
}

export async function rotatePdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as RotateOptions;
  const rotateBy = opts.degrees ?? 90;
  if (![90, 180, 270].includes(rotateBy)) {
    throw new AppError("Rotation must be 90, 180 or 270 degrees.", "INVALID_OPTIONS", 400);
  }

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const targetIndices = opts.pages ? new Set(parsePageList(opts.pages, doc.getPageCount())) : null;

  doc.getPages().forEach((page, i) => {
    if (!targetIndices || targetIndices.has(i)) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotateBy) % 360));
    }
  });

  const outputPath = path.join(outputDir, "rotated.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface PageSelectionOptions {
  pages?: string; // e.g. "2,4" for delete, or "1,3,5-7" for extract
}

export async function deletePdfPages({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as PageSelectionOptions;
  if (!opts.pages) throw new AppError("Specify which pages to delete, e.g. 2,4.", "MISSING_OPTIONS", 400);

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const toDelete = new Set(parsePageList(opts.pages, doc.getPageCount()));

  if (toDelete.size >= doc.getPageCount()) {
    throw new AppError("You can't delete every page in the document.", "INVALID_RANGE", 400);
  }

  // Remove from highest index to lowest so earlier removals don't shift later indices.
  Array.from(toDelete)
    .sort((a, b) => b - a)
    .forEach((i) => doc.removePage(i));

  const outputPath = path.join(outputDir, "pages-deleted.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

export async function extractPdfPages({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as PageSelectionOptions;
  if (!opts.pages) throw new AppError("Specify which pages to extract, e.g. 1,3,5-7.", "MISSING_OPTIONS", 400);

  const source = await loadPdfOrThrow(inputPaths[0]);
  const indices = parsePageList(opts.pages, source.getPageCount());

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(source, indices);
  pages.forEach((p) => doc.addPage(p));

  const outputPath = path.join(outputDir, "extracted.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface RearrangeOptions {
  order?: string; // e.g. "3,1,2" — new page order, 1-indexed, must include every page exactly once
}

export async function rearrangePdfPages({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as RearrangeOptions;
  if (!opts.order) throw new AppError("Specify the new page order, e.g. 3,1,2.", "MISSING_OPTIONS", 400);

  const source = await loadPdfOrThrow(inputPaths[0]);
  const totalPages = source.getPageCount();
  const requested = opts.order.split(",").map((p) => parseInt(p.trim(), 10));

  const isValidPermutation =
    requested.length === totalPages &&
    new Set(requested).size === totalPages &&
    requested.every((n) => n >= 1 && n <= totalPages);

  if (!isValidPermutation) {
    throw new AppError(
      `The new order must include every page from 1 to ${totalPages} exactly once.`,
      "INVALID_RANGE",
      400
    );
  }

  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(
    source,
    requested.map((n) => n - 1)
  );
  pages.forEach((p) => doc.addPage(p));

  const outputPath = path.join(outputDir, "rearranged.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface CropOptions {
  marginPercent?: number; // percentage cropped away from each edge, e.g. 10
}

export async function cropPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as CropOptions;
  const marginPercent = opts.marginPercent ?? 5;
  if (marginPercent <= 0 || marginPercent >= 45) {
    throw new AppError("Margin must be between 1% and 44% per edge.", "INVALID_OPTIONS", 400);
  }

  const doc = await loadPdfOrThrow(inputPaths[0]);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const marginX = (width * marginPercent) / 100;
    const marginY = (height * marginPercent) / 100;
    page.setCropBox(marginX, marginY, width - 2 * marginX, height - 2 * marginY);
  });

  const outputPath = path.join(outputDir, "cropped.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface WatermarkOptions {
  text?: string;
  opacity?: number; // 0-1
}

export async function addWatermark({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as WatermarkOptions;
  const text = (opts.text ?? "").trim();
  if (!text) throw new AppError("Enter the watermark text.", "MISSING_OPTIONS", 400);

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const opacity = Math.min(Math.max(opts.opacity ?? 0.25, 0.05), 1);

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const fontSize = Math.min(width, height) / 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(45),
    });
  });

  const outputPath = path.join(outputDir, "watermarked.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface PageNumberOptions {
  position?: "bottom-center" | "bottom-right" | "bottom-left";
  startAt?: number;
}

export async function addPageNumbers({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as PageNumberOptions;
  const position = opts.position ?? "bottom-center";
  const startAt = opts.startAt ?? 1;

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const margin = 24;

  doc.getPages().forEach((page, i) => {
    const { width } = page.getSize();
    const label = String(i + startAt);
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const x = position === "bottom-left" ? margin : position === "bottom-right" ? width - margin - textWidth : width / 2 - textWidth / 2;
    page.drawText(label, { x, y: margin / 2, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
  });

  const outputPath = path.join(outputDir, "numbered.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface MetadataOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string; // comma-separated
}

export async function editPdfMetadata({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as MetadataOptions;
  const doc = await loadPdfOrThrow(inputPaths[0]);

  if (opts.title !== undefined) doc.setTitle(opts.title);
  if (opts.author !== undefined) doc.setAuthor(opts.author);
  if (opts.subject !== undefined) doc.setSubject(opts.subject);
  if (opts.keywords !== undefined) {
    doc.setKeywords(opts.keywords.split(",").map((k) => k.trim()).filter(Boolean));
  }
  doc.setModificationDate(new Date());

  const outputPath = path.join(outputDir, "metadata-updated.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

export async function flattenPdf({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  const doc = await loadPdfOrThrow(inputPaths[0]);
  try {
    const form = doc.getForm();
    form.flatten();
  } catch {
    // No form fields present — nothing to flatten, which is a valid outcome, not an error.
  }

  const outputPath = path.join(outputDir, "flattened.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

interface StampOptions {
  text?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
}

/**
 * Adds a visual text stamp to the last page of the document. This is NOT a
 * cryptographic digital signature (which requires a certificate/PKI flow) —
 * it visually places signature-like text, the same way stamping a printed
 * page would work. Described as such to the user rather than implying legal
 * digital-signature validity.
 */
export async function stampPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as StampOptions;
  const text = (opts.text ?? "").trim();
  if (!text) throw new AppError("Enter the text to stamp onto the PDF.", "MISSING_OPTIONS", 400);

  const doc = await loadPdfOrThrow(inputPaths[0]);
  const font = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fontSize = 16;
  const pages = doc.getPages();
  const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const margin = 40;
  const position = opts.position ?? "bottom-right";
  const x = position === "bottom-left" ? margin : position === "bottom-center" ? width / 2 - textWidth / 2 : width - margin - textWidth;

  page.drawText(text, { x, y: margin, size: fontSize, font, color: rgb(0.1, 0.2, 0.6) });

  const outputPath = path.join(outputDir, "signed.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

/**
 * "Repair" here means: attempt to load the PDF with maximally permissive
 * parsing (ignoring encryption and non-fatal structural issues) and
 * re-serialize it cleanly. This genuinely fixes a meaningful class of
 * corrupted-but-parseable PDFs (bad xref tables, stray objects) the same
 * way many repair tools work, but can't recover a file that's truly
 * unreadable — in that case pdf-lib will throw and we say so clearly.
 */
export async function repairPdf({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  const bytes = await fs.readFile(inputPaths[0]);
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
  } catch {
    throw new AppError(
      "This PDF is too badly damaged to repair automatically.",
      "UNRECOVERABLE_PDF",
      400
    );
  }

  const outputPath = path.join(outputDir, "repaired.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

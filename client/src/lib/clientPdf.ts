import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

/**
 * Every function here runs entirely in the browser via pdf-lib (which is
 * isomorphic — the exact same library used server-side in
 * server/src/processors/pdfProcessor.ts). No file is ever uploaded for
 * these operations: the PDF is read, transformed, and re-saved locally,
 * and the result is handed back as a Blob for direct download. This is
 * what powers the "Processed locally — never uploaded" tools in the UI.
 */

export class ClientPdfError extends Error {}

async function loadPdfOrThrow(file: File): Promise<PDFDocument> {
  try {
    const bytes = await file.arrayBuffer();
    return await PDFDocument.load(bytes);
  } catch {
    throw new ClientPdfError("The PDF appears to be corrupted.");
  }
}

function parsePageList(input: string, totalPages: number): number[] {
  const indices: number[] = [];
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) throw new ClientPdfError("Provide at least one page number or range, e.g. 1,3,5-7.");
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new ClientPdfError(`"${part}" isn't a valid page number or range.`);
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    if (start < 1 || end > totalPages || start > end) {
      throw new ClientPdfError(`"${part}" is out of bounds for a ${totalPages}-page document.`);
    }
    for (let i = start; i <= end; i++) indices.push(i - 1);
  }
  return indices;
}

function toBlob(bytes: Uint8Array): Blob {
return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });}

interface CompressPdfClientOptions {
  quality?: "small" | "balanced" | "best";
}

export async function compressPdfClient(file: File, opts: CompressPdfClientOptions = {}): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  if (opts.quality === "small") {
    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("");
    doc.setCreator("");
  }
  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
  return toBlob(new Uint8Array(bytes));
}

/** Embeds JPG/PNG images directly (no format conversion needed since pdf-lib supports both natively). */
export async function imagesToPdfClient(files: File[]): Promise<Blob> {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type.includes("png") || file.name.toLowerCase().endsWith(".png");
    let image;
    try {
      image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    } catch {
      throw new ClientPdfError(`Couldn't read "${file.name}" — make sure it's a valid JPG or PNG.`);
    }
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return toBlob(await doc.save());
}

export async function mergePdfsClient(files: File[]): Promise<Blob> {
  if (files.length < 2) throw new ClientPdfError("Select at least two PDF files to merge.");
  const merged = await PDFDocument.create();
  for (const file of files) {
    const source = await loadPdfOrThrow(file);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return toBlob(await merged.save());
}

export async function splitPdfClient(file: File, ranges: string): Promise<Blob[]> {
  const source = await loadPdfOrThrow(file);
  const totalPages = source.getPageCount();
  const groups = ranges.split(",").map((p) => p.trim()).filter(Boolean);
  if (groups.length === 0) throw new ClientPdfError("Provide at least one page range, e.g. 1-3,5-7.");

  const blobs: Blob[] = [];
  for (const group of groups) {
    const indices = parsePageList(group, totalPages);
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(source, indices);
    pages.forEach((p) => doc.addPage(p));
    blobs.push(toBlob(await doc.save()));
  }
  return blobs;
}

export async function rotatePdfClient(file: File, rotateBy: 90 | 180 | 270, pages?: string): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  const targetIndices = pages ? new Set(parsePageList(pages, doc.getPageCount())) : null;
  doc.getPages().forEach((page, i) => {
    if (!targetIndices || targetIndices.has(i)) {
      page.setRotation(degrees((page.getRotation().angle + rotateBy) % 360));
    }
  });
  return toBlob(await doc.save());
}

export async function deletePdfPagesClient(file: File, pages: string): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  const toDelete = new Set(parsePageList(pages, doc.getPageCount()));
  if (toDelete.size >= doc.getPageCount()) throw new ClientPdfError("You can't delete every page in the document.");
  Array.from(toDelete).sort((a, b) => b - a).forEach((i) => doc.removePage(i));
  return toBlob(await doc.save());
}

export async function extractPdfPagesClient(file: File, pages: string): Promise<Blob> {
  const source = await loadPdfOrThrow(file);
  const indices = parsePageList(pages, source.getPageCount());
  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(source, indices);
  copied.forEach((p) => doc.addPage(p));
  return toBlob(await doc.save());
}

export async function rearrangePdfPagesClient(file: File, order: string): Promise<Blob> {
  const source = await loadPdfOrThrow(file);
  const totalPages = source.getPageCount();
  const requested = order.split(",").map((p) => parseInt(p.trim(), 10));
  const isValid =
    requested.length === totalPages && new Set(requested).size === totalPages && requested.every((n) => n >= 1 && n <= totalPages);
  if (!isValid) throw new ClientPdfError(`The new order must include every page from 1 to ${totalPages} exactly once.`);
  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(source, requested.map((n) => n - 1));
  copied.forEach((p) => doc.addPage(p));
  return toBlob(await doc.save());
}

export async function cropPdfClient(file: File, marginPercent: number): Promise<Blob> {
  if (marginPercent <= 0 || marginPercent >= 45) throw new ClientPdfError("Margin must be between 1% and 44% per edge.");
  const doc = await loadPdfOrThrow(file);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const marginX = (width * marginPercent) / 100;
    const marginY = (height * marginPercent) / 100;
    page.setCropBox(marginX, marginY, width - 2 * marginX, height - 2 * marginY);
  });
  return toBlob(await doc.save());
}

export async function resizePdfClient(file: File, opts: { width?: number; height?: number; scalePercent?: number }): Promise<Blob> {
  if (!opts.width && !opts.height && !opts.scalePercent) {
    throw new ClientPdfError("Provide a target width/height, or a scale percentage.");
  }
  const source = await loadPdfOrThrow(file);
  const doc = await PDFDocument.create();
  for (const sourcePage of source.getPages()) {
    const { width: ow, height: oh } = sourcePage.getSize();
    const embedded = await doc.embedPage(sourcePage);
    let tw: number;
    let th: number;
    if (opts.scalePercent) {
      const f = opts.scalePercent / 100;
      tw = ow * f;
      th = oh * f;
    } else {
      tw = opts.width ?? ow;
      th = opts.height ?? oh;
    }
    const newPage = doc.addPage([tw, th]);
    newPage.drawPage(embedded, { x: 0, y: 0, xScale: tw / ow, yScale: th / oh });
  }
  return toBlob(await doc.save());
}

export async function addWatermarkClient(file: File, text: string, opacity = 0.25): Promise<Blob> {
  if (!text.trim()) throw new ClientPdfError("Enter the watermark text.");
  const doc = await loadPdfOrThrow(file);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
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
      opacity: Math.min(Math.max(opacity, 0.05), 1),
      rotate: degrees(45),
    });
  });
  return toBlob(await doc.save());
}

export async function addPageNumbersClient(
  file: File,
  position: "bottom-center" | "bottom-left" | "bottom-right" = "bottom-center",
  startAt = 1
): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
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
  return toBlob(await doc.save());
}

export async function editPdfMetadataClient(
  file: File,
  meta: { title?: string; author?: string; subject?: string; keywords?: string }
): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  if (meta.title !== undefined) doc.setTitle(meta.title);
  if (meta.author !== undefined) doc.setAuthor(meta.author);
  if (meta.subject !== undefined) doc.setSubject(meta.subject);
  if (meta.keywords !== undefined) doc.setKeywords(meta.keywords.split(",").map((k) => k.trim()).filter(Boolean));
  doc.setModificationDate(new Date());
  return toBlob(await doc.save());
}

export async function flattenPdfClient(file: File): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  try {
    doc.getForm().flatten();
  } catch {
    // no form fields present — a valid outcome, not an error
  }
  return toBlob(await doc.save());
}

export async function stampPdfClient(
  file: File,
  text: string,
  position: "bottom-right" | "bottom-left" | "bottom-center" = "bottom-right"
): Promise<Blob> {
  if (!text.trim()) throw new ClientPdfError("Enter the text to stamp onto the PDF.");
  const doc = await loadPdfOrThrow(file);
  const font = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fontSize = 16;
  const pages = doc.getPages();
  const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const margin = 40;
  const x = position === "bottom-left" ? margin : position === "bottom-center" ? width / 2 - textWidth / 2 : width - margin - textWidth;
  page.drawText(text, { x, y: margin, size: fontSize, font, color: rgb(0.1, 0.2, 0.6) });
  return toBlob(await doc.save());
}

/** Places an uploaded signature image (e.g. a photo of a handwritten signature) onto the last page. */
export async function stampPdfWithImageClient(
  file: File,
  signatureImage: File,
  position: "bottom-right" | "bottom-left" | "bottom-center" = "bottom-right",
  widthPt = 140
): Promise<Blob> {
  const doc = await loadPdfOrThrow(file);
  const imgBytes = new Uint8Array(await signatureImage.arrayBuffer());
  const isPng = signatureImage.type.includes("png");

  let embedded;
  try {
    embedded = isPng ? await doc.embedPng(imgBytes) : await doc.embedJpg(imgBytes);
  } catch {
    throw new ClientPdfError("Couldn't read the signature image — use a JPG or PNG.");
  }

  const pages = doc.getPages();
  const page = pages[pages.length - 1];
  const { width } = page.getSize();
  const scale = widthPt / embedded.width;
  const h = embedded.height * scale;
  const margin = 40;
  const x = position === "bottom-left" ? margin : position === "bottom-center" ? width / 2 - widthPt / 2 : width - margin - widthPt;
  page.drawImage(embedded, { x, y: margin, width: widthPt, height: h });
  return toBlob(await doc.save());
}

export async function repairPdfClient(file: File): Promise<Blob> {
  try {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
    return toBlob(await doc.save());
  } catch {
    throw new ClientPdfError("This PDF is too badly damaged to repair automatically.");
  }
}

interface HeaderFooterOptions {
  headerText?: string;
  footerText?: string;
}

export async function addHeaderFooterClient(file: File, opts: HeaderFooterOptions): Promise<Blob> {
  if (!opts.headerText?.trim() && !opts.footerText?.trim()) {
    throw new ClientPdfError("Enter header and/or footer text.");
  }
  const doc = await loadPdfOrThrow(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;
  const margin = 24;

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    if (opts.headerText?.trim()) {
      const tw = font.widthOfTextAtSize(opts.headerText, fontSize);
      page.drawText(opts.headerText, { x: width / 2 - tw / 2, y: height - margin, size: fontSize, font, color: rgb(0.4, 0.4, 0.4) });
    }
    if (opts.footerText?.trim()) {
      const tw = font.widthOfTextAtSize(opts.footerText, fontSize);
      page.drawText(opts.footerText, { x: width / 2 - tw / 2, y: margin / 2, size: fontSize, font, color: rgb(0.4, 0.4, 0.4) });
    }
  });

  return toBlob(await doc.save());
}

interface RedactOptions {
  page?: number; // 1-indexed
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Draws an opaque black box over the specified region on the specified
 * page. IMPORTANT, and stated plainly in the tool's own description: this
 * is a VISUAL redaction only — it covers the content so it's no longer
 * visible or copyable through normal viewing, but pdf-lib has no way to
 * search and strip the underlying text objects in that region, so the
 * original text may still technically exist in the file's data. For
 * forensic-grade redaction (removing the data entirely), flattening the
 * result and then re-saving via "Compress PDF" reduces but doesn't
 * guarantee full removal — genuinely sensitive redaction should still use
 * a tool built specifically for that, not implied to be equivalent here.
 */
export async function redactPdfClient(file: File, opts: RedactOptions): Promise<Blob> {
  if (!opts.width || !opts.height) throw new ClientPdfError("Specify the width and height of the area to redact.");
  const doc = await loadPdfOrThrow(file);
  const pageIndex = (opts.page ?? 1) - 1;
  const pages = doc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new ClientPdfError(`Page ${opts.page} doesn't exist in this ${pages.length}-page document.`);
  }
  const page = pages[pageIndex];
  page.drawRectangle({
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    width: opts.width,
    height: opts.height,
    color: rgb(0, 0, 0),
  });
  return toBlob(await doc.save());
}

interface TextToPdfOptions {
  text: string;
  title?: string;
}

/** Creates a new PDF from plain text, paginating and wrapping automatically. */
export async function textToPdfClient(opts: TextToPdfOptions): Promise<Blob> {
  if (!opts.text.trim()) throw new ClientPdfError("Enter some text to convert into a PDF.");
  const doc = await PDFDocument.create();
  if (opts.title) doc.setTitle(opts.title);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize * 1.4;
  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;

  function wrapLine(line: string): string[] {
    const words = line.split(" ");
    const wrapped: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
        wrapped.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) wrapped.push(current);
    return wrapped.length > 0 ? wrapped : [""];
  }

  const allLines = opts.text.split("\n").flatMap(wrapLine);

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of allLines) {
    if (y < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  return toBlob(await doc.save());
}
export interface ClientFormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "unsupported";
  options?: string[];
}

/** Reads a PDF's AcroForm fields locally — no upload. Powers the client-side Fill PDF flow. */
export async function inspectPdfFormClient(file: File): Promise<ClientFormFieldInfo[]> {
  const doc = await loadPdfOrThrow(file);
  let fields;
  try {
    fields = doc.getForm().getFields();
  } catch {
    return [];
  }
  return fields.map((field) => {
    const name = field.getName();
    const ctorName = field.constructor.name;
    if (ctorName === "PDFTextField") return { name, type: "text" as const };
    if (ctorName === "PDFCheckBox") return { name, type: "checkbox" as const };
    if (ctorName === "PDFDropdown") return { name, type: "dropdown" as const, options: (field as unknown as { getOptions: () => string[] }).getOptions() };
    if (ctorName === "PDFRadioGroup") return { name, type: "radio" as const, options: (field as unknown as { getOptions: () => string[] }).getOptions() };
    return { name, type: "unsupported" as const };
  });
}

export async function fillPdfFormClient(file: File, values: Record<string, string | boolean>): Promise<Blob> {
  if (Object.keys(values).length === 0) throw new ClientPdfError("No field values were provided.");
  const doc = await loadPdfOrThrow(file);
  const form = doc.getForm();
  const fieldsByName = new Map(form.getFields().map((f) => [f.getName(), f]));

  for (const [fieldName, value] of Object.entries(values)) {
    const field = fieldsByName.get(fieldName);
    if (!field) continue;
    const ctorName = field.constructor.name;
    if (ctorName === "PDFTextField") (field as unknown as { setText: (v: string) => void }).setText(String(value));
    else if (ctorName === "PDFCheckBox") {
      const cb = field as unknown as { check: () => void; uncheck: () => void };
      value ? cb.check() : cb.uncheck();
    } else if (ctorName === "PDFDropdown" || ctorName === "PDFRadioGroup") {
      (field as unknown as { select: (v: string) => void }).select(String(value));
    }
  }

  return toBlob(await doc.save());
}

export async function annotatePdfClient(  file: File,
  opts: { text: string; page?: number; x?: number; y?: number }
): Promise<Blob> {
  if (!opts.text.trim()) throw new ClientPdfError("Enter the note text.");

  const doc = await loadPdfOrThrow(file);
  const pageIndex = (opts.page ?? 1) - 1;
  const pages = doc.getPages();

  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new ClientPdfError(
      `Page ${opts.page} doesn't exist in this ${pages.length}-page document.`
    );
  }

  const page = pages[pageIndex];
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const x = opts.x ?? 20;
  const y = opts.y ?? page.getSize().height - 40;
  const padding = 6;

  const textWidth = font.widthOfTextAtSize(opts.text, fontSize);

  page.drawRectangle({
    x: x - padding,
    y: y - padding,
    width: textWidth + padding * 2,
    height: fontSize + padding * 2,
    color: rgb(1, 0.95, 0.6),
    borderColor: rgb(0.8, 0.7, 0.2),
    borderWidth: 1,
  });

  page.drawText(opts.text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.1),
  });

  return toBlob(await doc.save());
}

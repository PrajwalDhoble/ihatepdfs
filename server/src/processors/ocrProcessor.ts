import { createWorker } from "tesseract.js";
import fs from "node:fs/promises";
import path from "node:path";
import { ProcessorInput } from "./index.js";
import { convertFileViaCloudConvert } from "./cloudConvertClient.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Scanned PDFs have no embedded text layer, so extract-pdf-text (pdf-parse)
 * can't read them. This tool rasterizes each page to an image (via the same
 * CloudConvert rendering used by PDF-to-JPG — a paid API, see README) and
 * then runs Tesseract.js (free, local) OCR on each page image. Output is a
 * plain text file rather than a searchable PDF with an embedded invisible
 * text layer — that's a meaningfully bigger feature and not implemented
 * here; this tool is honest about extracting text, not rebuilding the PDF.
 */
export async function ocrPdf({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  const pageImages = await convertFileViaCloudConvert(inputPaths[0], outputDir, {
    inputFormat: "pdf",
    outputFormat: "png",
    extra: { pages: "all" },
  });

  if (pageImages.length === 0) {
    throw new AppError("Couldn't render any pages from this PDF.", "OCR_RENDER_FAILED", 400);
  }

  const worker = await createWorker("eng");
  const pageTexts: string[] = [];

  try {
    for (let i = 0; i < pageImages.length; i++) {
      const {
        data: { text },
      } = await worker.recognize(pageImages[i]);
      pageTexts.push(`--- Page ${i + 1} ---\n${text.trim()}`);
    }
  } finally {
    await worker.terminate();
    // Clean up the intermediate page images — only the final text matters.
    await Promise.all(pageImages.map((p) => fs.unlink(p).catch(() => undefined)));
  }

  const outputPath = path.join(outputDir, "ocr-text.txt");
  await fs.writeFile(outputPath, pageTexts.join("\n\n"));
  return [outputPath];
}

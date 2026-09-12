import { registerProcessor } from "./index.js";
import {
  compressImage,
  resizeImage,
  makeFormatConverter,
  cropImage,
  rotateImage,
  flipImage,
  removeImageMetadata,
  changeImageDpi,
} from "./imageProcessor.js";
import {
  mergePdfs,
  splitPdf,
  compressPdf,
  imagesToPdf,
  rotatePdf,
  deletePdfPages,
  extractPdfPages,
  rearrangePdfPages,
  cropPdf,
  resizePdf,
  addWatermark,
  addPageNumbers,
  editPdfMetadata,
  flattenPdf,
  stampPdf,
  repairPdf,
  annotatePdf,
} from "./pdfProcessor.js";
import { extractPdfText, comparePdfs } from "./pdfTextProcessor.js";
import { protectPdf, unlockPdf } from "./pdfSecurityProcessor.js";
import { makeCloudConvertConverter, makePdfToImageConverter } from "./officeConversionProcessor.js";
import { ocrPdf } from "./ocrProcessor.js";
import { summarizePdf, askPdf } from "./aiProcessor.js";
import { fillPdfForm } from "./pdfFormProcessor.js";

/**
 * Wires each implemented processor to its tool slug. Called once at server
 * startup (see src/index.ts). A tool only becomes reachable via the API
 * once it is BOTH registered here AND marked `status: "active"` in
 * shared/tools/registry.ts — the two are kept in sync deliberately so a
 * tool never goes live with only one half done.
 */
export function registerAllProcessors(): void {
  // PDF — file assembly
  registerProcessor("merge-pdf", mergePdfs);
  registerProcessor("split-pdf", splitPdf);
  registerProcessor("compress-pdf", compressPdf);
  registerProcessor("jpg-to-pdf", imagesToPdf);
  registerProcessor("png-to-pdf", imagesToPdf);

  // PDF — page operations (free, pdf-lib only)
  registerProcessor("rotate-pdf", rotatePdf);
  registerProcessor("delete-pdf-pages", deletePdfPages);
  registerProcessor("extract-pdf-pages", extractPdfPages);
  registerProcessor("rearrange-pdf-pages", rearrangePdfPages);
  registerProcessor("crop-pdf", cropPdf);
  registerProcessor("resize-pdf", resizePdf);
  registerProcessor("add-watermark", addWatermark);
  registerProcessor("add-page-numbers", addPageNumbers);
  registerProcessor("edit-pdf-metadata", editPdfMetadata);
  registerProcessor("flatten-pdf", flattenPdf);
  registerProcessor("sign-pdf", stampPdf);
  registerProcessor("repair-pdf", repairPdf);
  registerProcessor("annotate-pdf", annotatePdf);
  registerProcessor("fill-pdf", fillPdfForm);

  // PDF — text
  registerProcessor("extract-pdf-text", extractPdfText);
  registerProcessor("compare-pdfs", comparePdfs);

  // PDF — security (free, requires qpdf installed on the host)
  registerProcessor("protect-pdf", protectPdf);
  registerProcessor("unlock-pdf", unlockPdf);

  // PDF — paid API (CloudConvert): Office conversion, image rendering, OCR
  registerProcessor("pdf-to-word", makeCloudConvertConverter("pdf", "docx"));
  registerProcessor("word-to-pdf", makeCloudConvertConverter("docx", "pdf"));
  registerProcessor("pdf-to-excel", makeCloudConvertConverter("pdf", "xlsx"));
  registerProcessor("excel-to-pdf", makeCloudConvertConverter("xlsx", "pdf"));
  registerProcessor("pdf-to-powerpoint", makeCloudConvertConverter("pdf", "pptx"));
  registerProcessor("powerpoint-to-pdf", makeCloudConvertConverter("pptx", "pdf"));
  registerProcessor("pdf-to-jpg", makePdfToImageConverter("jpg"));
  registerProcessor("pdf-to-png", makePdfToImageConverter("png"));
  registerProcessor("ocr-pdf", ocrPdf);

  // AI (paid): summarize, Q&A
  registerProcessor("summarize-pdf", summarizePdf);
  registerProcessor("ask-pdf", askPdf);

  // Image compression / resize
  registerProcessor("compress-image", compressImage);
  registerProcessor("compress-jpg", compressImage);
  registerProcessor("compress-png", compressImage);
  registerProcessor("compress-webp", compressImage);
  registerProcessor("resize-image", resizeImage);
  registerProcessor("crop-image", cropImage);
  registerProcessor("rotate-image", rotateImage);
  registerProcessor("flip-image", flipImage);
  registerProcessor("image-metadata-remover", removeImageMetadata);
  registerProcessor("image-dpi-changer", changeImageDpi);

  // Image format conversion
  registerProcessor("jpg-to-png", makeFormatConverter("png"));
  registerProcessor("png-to-jpg", makeFormatConverter("jpeg"));
  registerProcessor("jpg-to-webp", makeFormatConverter("webp"));
  registerProcessor("png-to-webp", makeFormatConverter("webp"));
  registerProcessor("webp-to-jpg", makeFormatConverter("jpeg"));
  registerProcessor("webp-to-png", makeFormatConverter("png"));
}

import { registerProcessor } from "./index.js";
import { compressImage, resizeImage, makeFormatConverter } from "./imageProcessor.js";
import { mergePdfs, splitPdf, compressPdf, imagesToPdf } from "./pdfProcessor.js";

/**
 * Wires each implemented processor to its tool slug. Called once at server
 * startup (see src/index.ts). A tool only becomes reachable via the API
 * once it is BOTH registered here AND marked `status: "active"` in
 * shared/tools/registry.ts — the two are kept in sync deliberately so a
 * tool never goes live with only one half done.
 */
export function registerAllProcessors(): void {
  // PDF
  registerProcessor("merge-pdf", mergePdfs);
  registerProcessor("split-pdf", splitPdf);
  registerProcessor("compress-pdf", compressPdf);
  registerProcessor("jpg-to-pdf", imagesToPdf);
  registerProcessor("png-to-pdf", imagesToPdf);

  // Image compression / resize
  registerProcessor("compress-image", compressImage);
  registerProcessor("compress-jpg", compressImage);
  registerProcessor("compress-png", compressImage);
  registerProcessor("compress-webp", compressImage);
  registerProcessor("resize-image", resizeImage);

  // Image format conversion
  registerProcessor("jpg-to-png", makeFormatConverter("png"));
  registerProcessor("png-to-jpg", makeFormatConverter("jpeg"));
  registerProcessor("jpg-to-webp", makeFormatConverter("webp"));
  registerProcessor("png-to-webp", makeFormatConverter("webp"));
  registerProcessor("webp-to-jpg", makeFormatConverter("jpeg"));
  registerProcessor("webp-to-png", makeFormatConverter("png"));
}

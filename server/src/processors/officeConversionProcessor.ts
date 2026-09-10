import { ProcessorInput } from "./index.js";
import { convertFileViaCloudConvert } from "./cloudConvertClient.js";

/** Builds a converter for a fixed input/output format pair (e.g. docx -> pdf). */
export function makeCloudConvertConverter(inputFormat: string, outputFormat: string) {
  return async function convert({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
    return convertFileViaCloudConvert(inputPaths[0], outputDir, { inputFormat, outputFormat });
  };
}

/**
 * Renders every page of a PDF to an image. CloudConvert returns one file
 * per page for multi-page PDFs — the controller already zips multiple
 * outputs into a single download automatically.
 */
export function makePdfToImageConverter(outputFormat: "jpg" | "png") {
  return async function convert({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
    return convertFileViaCloudConvert(inputPaths[0], outputDir, {
      inputFormat: "pdf",
      outputFormat,
      extra: { pages: "all" },
    });
  };
}

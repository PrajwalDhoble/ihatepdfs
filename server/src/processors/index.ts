import { AppError } from "../middleware/errorHandler.js";

export interface ProcessorInput {
  inputPaths: string[];
  outputDir: string;
  options: Record<string, unknown>;
}

export type ProcessorFn = (input: ProcessorInput) => Promise<string[]>; // returns output file paths

/**
 * Registry of implemented processors, keyed by tool slug. Empty for now —
 * Phase 2 will add pdfProcessor.compress, imageProcessor.compress, etc.
 * here. middleware/validate.ts already blocks requests to tools whose
 * registry `status` isn't "active", so this only guards against a tool
 * being flipped to active before its processor is registered.
 */
const processors: Record<string, ProcessorFn> = {};

export async function runProcessor(toolSlug: string, input: ProcessorInput): Promise<string[]> {
  const processor = processors[toolSlug];
  if (!processor) {
    throw new AppError(
      `${toolSlug} does not have a processor implemented yet.`,
      "PROCESSOR_NOT_IMPLEMENTED",
      501
    );
  }
  return processor(input);
}

export function registerProcessor(toolSlug: string, fn: ProcessorFn): void {
  processors[toolSlug] = fn;
}

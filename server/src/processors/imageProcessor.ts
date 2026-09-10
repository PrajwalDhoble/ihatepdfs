import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { ProcessorInput } from "./index.js";
import { AppError } from "../middleware/errorHandler.js";

type SupportedFormat = "jpeg" | "png" | "webp";

function normalizeFormat(ext: string): SupportedFormat {
  const e = ext.toLowerCase();
  if (e === "jpg" || e === "jpeg") return "jpeg";
  if (e === "png") return "png";
  if (e === "webp") return "webp";
  throw new AppError(`Unsupported image format: ${ext}`, "UNSUPPORTED_FORMAT", 400);
}

interface CompressOptions {
  targetSizeKB?: number;
  quality?: number; // 1-100, used when no target size is given
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: string; // defaults to source format
}

/**
 * Iterative target-size compression: binary-searches JPEG/WebP quality
 * within a bounded number of iterations, then progressively downscales
 * dimensions if quality alone can't reach the target. PNG has no quality
 * knob, so target-size mode for PNG falls back to palette/compression
 * level tuning and, if needed, dimension reduction.
 */
async function compressToTarget(
  inputBuffer: Buffer,
  format: SupportedFormat,
  targetBytes: number,
  startWidth: number,
  startHeight: number
): Promise<{ buffer: Buffer; quality: number; width: number; height: number }> {
  const MIN_QUALITY = 30;
  const MAX_QUALITY = 95;
  const MAX_ITERATIONS = 7;
  const MIN_DIMENSION_RATIO = 0.2;

  let width = startWidth;
  let height = startHeight;
  let bestBuffer: Buffer | null = null;
  let bestQuality = MAX_QUALITY;

  // Progressive downscale loop: at each scale, binary-search quality.
  for (let scaleAttempt = 0; scaleAttempt < 4; scaleAttempt++) {
    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let iterations = 0;

    while (iterations < MAX_ITERATIONS) {
      const quality = Math.round((low + high) / 2);
      const pipeline = sharp(inputBuffer).resize({
        width: Math.round(width),
        height: Math.round(height),
        fit: "inside",
        withoutEnlargement: true,
      });

      const buffer =
        format === "jpeg"
          ? await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
          : format === "webp"
          ? await pipeline.webp({ quality }).toBuffer()
          : await pipeline.png({ compressionLevel: 9, palette: quality < 70 }).toBuffer();

      if (buffer.length <= targetBytes) {
        bestBuffer = buffer;
        bestQuality = quality;
        low = quality; // try to push quality up while staying under target
      } else {
        high = quality - 1;
      }

      if (low >= high) break;
      iterations++;
    }

    if (bestBuffer) break; // reached target at this scale

    // Target not reachable at this scale even at minimum quality — shrink dimensions.
    width *= 0.85;
    height *= 0.85;
    if (width < startWidth * MIN_DIMENSION_RATIO) break;
  }

  if (!bestBuffer) {
    // Could not hit the target even at minimum quality/dimensions — return
    // the smallest result we produced rather than pretending we hit target.
    const pipeline = sharp(inputBuffer).resize({
      width: Math.round(width),
      height: Math.round(height),
      fit: "inside",
      withoutEnlargement: true,
    });
    bestBuffer =
      format === "jpeg"
        ? await pipeline.jpeg({ quality: MIN_QUALITY, mozjpeg: true }).toBuffer()
        : format === "webp"
        ? await pipeline.webp({ quality: MIN_QUALITY }).toBuffer()
        : await pipeline.png({ compressionLevel: 9, palette: true }).toBuffer();
    bestQuality = MIN_QUALITY;
  }

  const finalMeta = await sharp(bestBuffer).metadata();
  return { buffer: bestBuffer, quality: bestQuality, width: finalMeta.width ?? width, height: finalMeta.height ?? height };
}

export async function compressImage({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as CompressOptions;
  const outputs: string[] = [];

  for (const inputPath of inputPaths) {
    const inputBuffer = await fs.readFile(inputPath);
    const meta = await sharp(inputBuffer).metadata();
    const sourceExt = path.extname(inputPath).replace(".", "");
    const format = normalizeFormat(opts.outputFormat ?? sourceExt);

    let resultBuffer: Buffer;
    let finalQuality = opts.quality ?? 80;

    const startWidth = opts.maxWidth ? Math.min(meta.width ?? opts.maxWidth, opts.maxWidth) : meta.width ?? 1000;
    const startHeight = opts.maxHeight ? Math.min(meta.height ?? opts.maxHeight, opts.maxHeight) : meta.height ?? 1000;

    if (opts.targetSizeKB && opts.targetSizeKB > 0) {
      const result = await compressToTarget(inputBuffer, format, opts.targetSizeKB * 1024, startWidth, startHeight);
      resultBuffer = result.buffer;
      finalQuality = result.quality;
    } else {
      const pipeline = sharp(inputBuffer).resize({
        width: opts.maxWidth,
        height: opts.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      });
      resultBuffer =
        format === "jpeg"
          ? await pipeline.jpeg({ quality: finalQuality, mozjpeg: true }).toBuffer()
          : format === "webp"
          ? await pipeline.webp({ quality: finalQuality }).toBuffer()
          : await pipeline.png({ compressionLevel: 9 }).toBuffer();
    }

    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outExt = format === "jpeg" ? "jpg" : format;
    const outputPath = path.join(outputDir, `${baseName}-compressed.${outExt}`);
    await fs.writeFile(outputPath, resultBuffer);
    outputs.push(outputPath);
  }

  return outputs;
}

interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export async function resizeImage({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as ResizeOptions;
  if (!opts.width && !opts.height) {
    throw new AppError("Provide a target width and/or height.", "MISSING_OPTIONS", 400);
  }

  const outputs: string[] = [];
  for (const inputPath of inputPaths) {
    const ext = normalizeFormat(path.extname(inputPath).replace(".", ""));
    const pipeline = sharp(inputPath).resize({
      width: opts.width,
      height: opts.height,
      fit: opts.maintainAspectRatio === false ? "fill" : "inside",
    });

    const buffer =
      ext === "jpeg" ? await pipeline.jpeg({ quality: 90 }).toBuffer() : ext === "webp" ? await pipeline.webp({ quality: 90 }).toBuffer() : await pipeline.png().toBuffer();

    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}-resized.${ext === "jpeg" ? "jpg" : ext}`);
    await fs.writeFile(outputPath, buffer);
    outputs.push(outputPath);
  }
  return outputs;
}

/** Generic format conversion — used for jpg<->png, jpg<->webp, png<->webp, etc. */
export function makeFormatConverter(targetFormat: SupportedFormat) {
  return async function convert({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
    const outputs: string[] = [];
    for (const inputPath of inputPaths) {
      const pipeline = sharp(inputPath);
      const buffer =
        targetFormat === "jpeg"
          ? await pipeline.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
          : targetFormat === "webp"
          ? await pipeline.webp({ quality: 92 }).toBuffer()
          : await pipeline.png().toBuffer();

      const baseName = path.basename(inputPath, path.extname(inputPath));
      const outExt = targetFormat === "jpeg" ? "jpg" : targetFormat;
      const outputPath = path.join(outputDir, `${baseName}.${outExt}`);
      await fs.writeFile(outputPath, buffer);
      outputs.push(outputPath);
    }
    return outputs;
  };
}

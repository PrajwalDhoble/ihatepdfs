import { describe, it, expect, beforeEach, afterEach } from "vitest";
import sharp from "sharp";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compressImage, resizeImage, makeFormatConverter } from "../src/processors/imageProcessor.js";

let workDir: string;

async function makeTestJpg(width = 800, height = 600): Promise<string> {
  const buffer = await sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 80, b: 80 } },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
  const filePath = path.join(workDir, "test.jpg");
  await fs.writeFile(filePath, buffer);
  return filePath;
}

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "repairmypdf-img-test-"));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe("compressImage", () => {
  it("reduces file size when compressing at a lower quality", async () => {
    const input = await makeTestJpg();
    const originalSize = (await fs.stat(input)).size;

    const [outputPath] = await compressImage({
      inputPaths: [input],
      outputDir: workDir,
      options: { quality: 40 },
    });

    const compressedSize = (await fs.stat(outputPath)).size;
    expect(compressedSize).toBeLessThan(originalSize);
  });

  it("gets close to a target size in KB", async () => {
    const input = await makeTestJpg(1600, 1200);
    const targetKB = 50;

    const [outputPath] = await compressImage({
      inputPaths: [input],
      outputDir: workDir,
      options: { targetSizeKB: targetKB },
    });

    const resultSizeKB = (await fs.stat(outputPath)).size / 1024;
    // Iterative compression should land at or reasonably close to target,
    // never wildly over it.
    expect(resultSizeKB).toBeLessThan(targetKB * 1.5);
  });
});

describe("resizeImage", () => {
  it("resizes to the requested width", async () => {
    const input = await makeTestJpg(800, 600);
    const [outputPath] = await resizeImage({
      inputPaths: [input],
      outputDir: workDir,
      options: { width: 400 },
    });

    const meta = await sharp(outputPath).metadata();
    expect(meta.width).toBeLessThanOrEqual(400);
  });
});

describe("makeFormatConverter", () => {
  it("converts JPG to PNG", async () => {
    const input = await makeTestJpg();
    const convert = makeFormatConverter("png");
    const [outputPath] = await convert({ inputPaths: [input], outputDir: workDir, options: {} });

    const meta = await sharp(outputPath).metadata();
    expect(meta.format).toBe("png");
  });
});

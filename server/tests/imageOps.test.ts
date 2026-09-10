import { describe, it, expect, beforeEach, afterEach } from "vitest";
import sharp from "sharp";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { cropImage, rotateImage, flipImage, removeImageMetadata, changeImageDpi } from "../src/processors/imageProcessor.js";

let workDir: string;

async function makeTestJpgWithExif(): Promise<string> {
  const buffer = await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    .withMetadata({ exif: { IFD0: { Copyright: "Test Copyright Holder" } } })
    .jpeg({ quality: 95 })
    .toBuffer();
  const filePath = path.join(workDir, "test.jpg");
  await fs.writeFile(filePath, buffer);
  return filePath;
}

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "repairmypdf-imgops-test-"));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe("cropImage", () => {
  it("crops to the exact requested dimensions", async () => {
    const input = await makeTestJpgWithExif();
    const [out] = await cropImage({ inputPaths: [input], outputDir: workDir, options: { left: 10, top: 10, width: 100, height: 80 } });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(100);
    expect(meta.height).toBe(80);
  });

  it("requires width and height", async () => {
    const input = await makeTestJpgWithExif();
    await expect(cropImage({ inputPaths: [input], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("rotateImage", () => {
  it("swaps width/height on a 90-degree rotation", async () => {
    const input = await makeTestJpgWithExif();
    const [out] = await rotateImage({ inputPaths: [input], outputDir: workDir, options: { degrees: 90 } });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(400);
  });
});

describe("flipImage", () => {
  it("produces a valid image when flipped horizontally", async () => {
    const input = await makeTestJpgWithExif();
    const [out] = await flipImage({ inputPaths: [input], outputDir: workDir, options: { direction: "horizontal" } });
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);
  });
});

describe("removeImageMetadata", () => {
  it("strips EXIF data", async () => {
    const input = await makeTestJpgWithExif();
    const inputMeta = await sharp(input).metadata();
    expect(inputMeta.exif).toBeDefined();

    const [out] = await removeImageMetadata({ inputPaths: [input], outputDir: workDir, options: {} });
    const outputMeta = await sharp(out).metadata();
    expect(outputMeta.exif).toBeUndefined();
  });
});

describe("changeImageDpi", () => {
  it("sets the requested pixel density", async () => {
    const input = await makeTestJpgWithExif();
    const [out] = await changeImageDpi({ inputPaths: [input], outputDir: workDir, options: { dpi: 300 } });
    const meta = await sharp(out).metadata();
    expect(meta.density).toBe(300);
  });
});

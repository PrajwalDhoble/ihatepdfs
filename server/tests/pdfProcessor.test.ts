import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { mergePdfs, splitPdf, compressPdf } from "../src/processors/pdfProcessor.js";

let workDir: string;

async function makeTestPdf(pageCount: number): Promise<string> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([200, 200]);
  const bytes = await doc.save();
  const filePath = path.join(workDir, `test-${Math.random().toString(36).slice(2)}.pdf`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "repairmypdf-test-"));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe("mergePdfs", () => {
  it("combines pages from multiple PDFs in upload order", async () => {
    const pdfA = await makeTestPdf(2);
    const pdfB = await makeTestPdf(3);

    const [outputPath] = await mergePdfs({
      inputPaths: [pdfA, pdfB],
      outputDir: workDir,
      options: {},
    });

    const merged = await PDFDocument.load(await fs.readFile(outputPath));
    expect(merged.getPageCount()).toBe(5);
  });

  it("rejects a single file", async () => {
    const pdfA = await makeTestPdf(2);
    await expect(mergePdfs({ inputPaths: [pdfA], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("splitPdf", () => {
  it("splits into the requested page ranges", async () => {
    const pdf = await makeTestPdf(10);
    const [outputPath] = await splitPdf({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { ranges: "1-3" },
    });

    // Single range produces a plain PDF, not a zip.
    expect(outputPath.endsWith(".pdf")).toBe(true);
    const result = await PDFDocument.load(await fs.readFile(outputPath));
    expect(result.getPageCount()).toBe(3);
  });

  it("zips multiple ranges into one download", async () => {
    const pdf = await makeTestPdf(10);
    const [outputPath] = await splitPdf({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { ranges: "1-2,4-5" },
    });
    expect(outputPath.endsWith(".zip")).toBe(true);
  });

  it("rejects an out-of-bounds range", async () => {
    const pdf = await makeTestPdf(3);
    await expect(
      splitPdf({ inputPaths: [pdf], outputDir: workDir, options: { ranges: "1-99" } })
    ).rejects.toThrow();
  });
});

describe("compressPdf", () => {
  it("produces a valid, readable PDF", async () => {
    const pdf = await makeTestPdf(5);
    const [outputPath] = await compressPdf({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { quality: "small" },
    });

    const result = await PDFDocument.load(await fs.readFile(outputPath));
    expect(result.getPageCount()).toBe(5);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  rotatePdf,
  deletePdfPages,
  extractPdfPages,
  rearrangePdfPages,
  cropPdf,
  addWatermark,
  addPageNumbers,
  editPdfMetadata,
  flattenPdf,
  stampPdf,
  repairPdf,
} from "../src/processors/pdfProcessor.js";
import { extractPdfText, comparePdfs } from "../src/processors/pdfTextProcessor.js";

let workDir: string;

async function makeTestPdf(pageCount: number): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`Page ${i + 1} content`, { x: 10, y: 100, size: 12, font });
  }
  const bytes = await doc.save();
  const filePath = path.join(workDir, `test-${Math.random().toString(36).slice(2)}.pdf`);
  await fs.writeFile(filePath, bytes);
  return filePath;
}

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "repairmypdf-pageops-test-"));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe("rotatePdf", () => {
  it("rotates all pages by the requested angle", async () => {
    const pdf = await makeTestPdf(2);
    const [out] = await rotatePdf({ inputPaths: [pdf], outputDir: workDir, options: { degrees: 90 } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPage(0).getRotation().angle).toBe(90);
  });
});

describe("deletePdfPages / extractPdfPages", () => {
  it("deletes the requested pages", async () => {
    const pdf = await makeTestPdf(5);
    const [out] = await deletePdfPages({ inputPaths: [pdf], outputDir: workDir, options: { pages: "2,4" } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(3);
  });

  it("extracts the requested pages", async () => {
    const pdf = await makeTestPdf(5);
    const [out] = await extractPdfPages({ inputPaths: [pdf], outputDir: workDir, options: { pages: "1,3" } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(2);
  });

  it("rejects deleting every page", async () => {
    const pdf = await makeTestPdf(2);
    await expect(
      deletePdfPages({ inputPaths: [pdf], outputDir: workDir, options: { pages: "1-2" } })
    ).rejects.toThrow();
  });
});

describe("rearrangePdfPages", () => {
  it("reorders pages according to the requested permutation", async () => {
    const pdf = await makeTestPdf(3);
    const [out] = await rearrangePdfPages({ inputPaths: [pdf], outputDir: workDir, options: { order: "3,1,2" } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(3);
  });

  it("rejects an incomplete permutation", async () => {
    const pdf = await makeTestPdf(3);
    await expect(
      rearrangePdfPages({ inputPaths: [pdf], outputDir: workDir, options: { order: "1,2" } })
    ).rejects.toThrow();
  });
});

describe("cropPdf", () => {
  it("shrinks the crop box by the requested margin", async () => {
    const pdf = await makeTestPdf(1);
    const [out] = await cropPdf({ inputPaths: [pdf], outputDir: workDir, options: { marginPercent: 10 } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    const box = doc.getPage(0).getCropBox();
    expect(box.width).toBeLessThan(200);
    expect(box.height).toBeLessThan(200);
  });
});

describe("addWatermark / addPageNumbers / stampPdf", () => {
  it("adds a watermark without corrupting the document", async () => {
    const pdf = await makeTestPdf(2);
    const [out] = await addWatermark({ inputPaths: [pdf], outputDir: workDir, options: { text: "DRAFT" } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(2);
  });

  it("requires watermark text", async () => {
    const pdf = await makeTestPdf(1);
    await expect(addWatermark({ inputPaths: [pdf], outputDir: workDir, options: {} })).rejects.toThrow();
  });

  it("adds page numbers to every page", async () => {
    const pdf = await makeTestPdf(3);
    const [out] = await addPageNumbers({ inputPaths: [pdf], outputDir: workDir, options: {} });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(3);
  });

  it("stamps signature text onto the last page", async () => {
    const pdf = await makeTestPdf(2);
    const [out] = await stampPdf({ inputPaths: [pdf], outputDir: workDir, options: { text: "Jane Doe" } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(2);
  });
});

describe("editPdfMetadata", () => {
  it("updates the document title and author", async () => {
    const pdf = await makeTestPdf(1);
    const [out] = await editPdfMetadata({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { title: "My Report", author: "Test Author" },
    });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getTitle()).toBe("My Report");
    expect(doc.getAuthor()).toBe("Test Author");
  });
});

describe("flattenPdf", () => {
  it("succeeds even on a document with no form fields", async () => {
    const pdf = await makeTestPdf(1);
    const [out] = await flattenPdf({ inputPaths: [pdf], outputDir: workDir, options: {} });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(1);
  });
});

describe("repairPdf", () => {
  it("re-serializes a well-formed PDF successfully", async () => {
    const pdf = await makeTestPdf(2);
    const [out] = await repairPdf({ inputPaths: [pdf], outputDir: workDir, options: {} });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(2);
  });

  it("throws a clear error on an unrecoverable file", async () => {
    const badPath = path.join(workDir, "bad.pdf");
    await fs.writeFile(badPath, "not a pdf at all");
    await expect(repairPdf({ inputPaths: [badPath], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("extractPdfText / comparePdfs", () => {
  it("extracts text content from a PDF", async () => {
    const pdf = await makeTestPdf(1);
    const [out] = await extractPdfText({ inputPaths: [pdf], outputDir: workDir, options: {} });
    const text = await fs.readFile(out, "utf-8");
    expect(text).toContain("Page 1 content");
  });

  it("produces a diff report between two PDFs", async () => {
    const pdfA = await makeTestPdf(1);
    const pdfB = await makeTestPdf(2);
    const [out] = await comparePdfs({ inputPaths: [pdfA, pdfB], outputDir: workDir, options: {} });
    const report = await fs.readFile(out, "utf-8");
    expect(report).toContain("Comparison of");
  });

  it("rejects comparing anything other than exactly two files", async () => {
    const pdfA = await makeTestPdf(1);
    await expect(comparePdfs({ inputPaths: [pdfA], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

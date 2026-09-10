import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resizePdf, annotatePdf } from "../src/processors/pdfProcessor.js";
import { inspectPdfForm, fillPdfForm } from "../src/processors/pdfFormProcessor.js";
import { isCloudConvertConfigured } from "../src/processors/cloudConvertClient.js";

let workDir: string;

async function makeTestPdf(pageCount: number, size: [number, number] = [200, 200]): Promise<string> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage(size);
  const filePath = path.join(workDir, `test-${Math.random().toString(36).slice(2)}.pdf`);
  await fs.writeFile(filePath, await doc.save());
  return filePath;
}

async function makeFormPdf(): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 300]);
  const form = doc.getForm();
  const field = form.createTextField("name");
  field.addToPage(page, { x: 50, y: 200, width: 150, height: 20 });
  const filePath = path.join(workDir, "form.pdf");
  await fs.writeFile(filePath, await doc.save());
  return filePath;
}

beforeEach(async () => {
  workDir = await fs.mkdtemp(path.join(os.tmpdir(), "repairmypdf-extra-test-"));
});

afterEach(async () => {
  await fs.rm(workDir, { recursive: true, force: true });
});

describe("resizePdf", () => {
  it("resizes pages to explicit target dimensions", async () => {
    const pdf = await makeTestPdf(2, [200, 200]);
    const [out] = await resizePdf({ inputPaths: [pdf], outputDir: workDir, options: { width: 400, height: 400 } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBe(400);
    expect(height).toBe(400);
  });

  it("scales pages by a percentage", async () => {
    const pdf = await makeTestPdf(1, [200, 200]);
    const [out] = await resizePdf({ inputPaths: [pdf], outputDir: workDir, options: { scalePercent: 50 } });
    const doc = await PDFDocument.load(await fs.readFile(out));
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBe(100);
    expect(height).toBe(100);
  });

  it("requires at least one sizing option", async () => {
    const pdf = await makeTestPdf(1);
    await expect(resizePdf({ inputPaths: [pdf], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("annotatePdf", () => {
  it("adds a note to the specified page", async () => {
    const pdf = await makeTestPdf(3);
    const [out] = await annotatePdf({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { text: "Review this", page: 2, x: 30, y: 100 },
    });
    const doc = await PDFDocument.load(await fs.readFile(out));
    expect(doc.getPageCount()).toBe(3);
  });

  it("rejects an out-of-range page number", async () => {
    const pdf = await makeTestPdf(2);
    await expect(
      annotatePdf({ inputPaths: [pdf], outputDir: workDir, options: { text: "note", page: 9 } })
    ).rejects.toThrow();
  });

  it("requires note text", async () => {
    const pdf = await makeTestPdf(1);
    await expect(annotatePdf({ inputPaths: [pdf], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("PDF form inspection and filling", () => {
  it("detects a text field", async () => {
    const pdf = await makeFormPdf();
    const fields = await inspectPdfForm(pdf);
    expect(fields).toEqual([{ name: "name", type: "text" }]);
  });

  it("returns an empty array for a PDF with no form", async () => {
    const pdf = await makeTestPdf(1);
    const fields = await inspectPdfForm(pdf);
    expect(fields).toEqual([]);
  });

  it("fills a detected text field", async () => {
    const pdf = await makeFormPdf();
    const [out] = await fillPdfForm({
      inputPaths: [pdf],
      outputDir: workDir,
      options: { values: { name: "Jane Doe" } },
    });
    const doc = await PDFDocument.load(await fs.readFile(out));
    const field = doc.getForm().getTextField("name");
    expect(field.getText()).toBe("Jane Doe");
  });

  it("rejects when no values are provided", async () => {
    const pdf = await makeFormPdf();
    await expect(fillPdfForm({ inputPaths: [pdf], outputDir: workDir, options: {} })).rejects.toThrow();
  });
});

describe("CloudConvert configuration guard", () => {
  it("reports not configured when the API key is the placeholder", () => {
    // In the default .env.example state (or when unset in test env), this
    // must be false — proving the "fail with a clear message" path is live
    // rather than silently attempting a call with an invalid key.
    const key = process.env.CLOUDCONVERT_API_KEY ?? "";
    if (!key || key.startsWith("REPLACE_WITH")) {
      expect(isCloudConvertConfigured()).toBe(false);
    } else {
      // A real key is configured in this environment — nothing to assert.
      expect(true).toBe(true);
    }
  });
});

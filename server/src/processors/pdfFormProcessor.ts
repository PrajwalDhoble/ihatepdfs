import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";
import { ProcessorInput } from "./index.js";
import { AppError } from "../middleware/errorHandler.js";

export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "radio" | "unsupported";
  options?: string[]; // for dropdown/radio
}

/** Reads a PDF's AcroForm fields without modifying it — powers the Fill PDF tool's two-step UI. */
export async function inspectPdfForm(filePath: string): Promise<FormFieldInfo[]> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(await fs.readFile(filePath));
  } catch {
    throw new AppError("The PDF appears to be corrupted.", "CORRUPT_PDF", 400);
  }

  let fields;
  try {
    fields = doc.getForm().getFields();
  } catch {
    return []; // no AcroForm present — a valid outcome, not an error
  }

  return fields.map((field) => {
    const name = field.getName();
    if (field instanceof PDFTextField) return { name, type: "text" as const };
    if (field instanceof PDFCheckBox) return { name, type: "checkbox" as const };
    if (field instanceof PDFDropdown) return { name, type: "dropdown" as const, options: field.getOptions() };
    if (field instanceof PDFRadioGroup) return { name, type: "radio" as const, options: field.getOptions() };
    return { name, type: "unsupported" as const };
  });
}

interface FillOptions {
  values?: Record<string, string | boolean>;
}

export async function fillPdfForm({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  const opts = options as FillOptions;
  const values = opts.values ?? {};

  if (Object.keys(values).length === 0) {
    throw new AppError("No field values were provided.", "MISSING_OPTIONS", 400);
  }

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(await fs.readFile(inputPaths[0]));
  } catch {
    throw new AppError("The PDF appears to be corrupted.", "CORRUPT_PDF", 400);
  }

  const form = doc.getForm();
  const fieldsByName = new Map(form.getFields().map((f) => [f.getName(), f]));

  for (const [fieldName, value] of Object.entries(values)) {
    const field = fieldsByName.get(fieldName);
    if (!field) continue; // silently skip unknown fields rather than failing the whole job

    if (field instanceof PDFTextField) {
      field.setText(String(value));
    } else if (field instanceof PDFCheckBox) {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown) {
      field.select(String(value));
    } else if (field instanceof PDFRadioGroup) {
      field.select(String(value));
    }
  }

  const outputPath = path.join(outputDir, "filled.pdf");
  await fs.writeFile(outputPath, await doc.save());
  return [outputPath];
}

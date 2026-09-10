import { OptionField } from "./DynamicOptionsForm";

export const TOOL_FIELD_SPECS: Record<string, OptionField[]> = {
  "split-pdf": [
    { key: "ranges", type: "text", label: "Page ranges (e.g. 1-3,5-7,10)", placeholder: "1-3,5-7" },
  ],
  "resize-pdf": [
    { key: "width", type: "number", label: "Target width in points (optional, e.g. 612 for US Letter)", min: 1 },
    { key: "height", type: "number", label: "Target height in points (optional, e.g. 792 for US Letter)", min: 1 },
    { key: "scalePercent", type: "number", label: "Or scale by percentage instead (e.g. 50 for half size)", min: 1, max: 400 },
  ],
  "protect-pdf": [
    { key: "password", type: "password", label: "Password to protect this PDF with" },
  ],
  "unlock-pdf": [
    { key: "password", type: "password", label: "This PDF's current password" },
  ],
  "annotate-pdf": [
    { key: "text", type: "text", label: "Note text", placeholder: "Please review this section" },
    { key: "page", type: "number", label: "Page number", min: 1 },
    { key: "x", type: "number", label: "X position in points from left (optional, default 20)", min: 0 },
    { key: "y", type: "number", label: "Y position in points from bottom (optional, default near top)", min: 0 },
  ],
  "resize-image": [
    { key: "width", type: "number", label: "Width (px)", min: 1 },
    { key: "height", type: "number", label: "Height (px)", min: 1 },
  ],
  "rotate-pdf": [
    { key: "degrees", type: "select", label: "Rotate by", choices: [
      { value: "90", label: "90°" },
      { value: "180", label: "180°" },
      { value: "270", label: "270°" },
    ] },
    { key: "pages", type: "text", label: "Pages to rotate (optional, e.g. 1,3-5 — leave blank for all)", placeholder: "all pages" },
  ],
  "delete-pdf-pages": [
    { key: "pages", type: "text", label: "Pages to delete (e.g. 2,4)", placeholder: "2,4" },
  ],
  "extract-pdf-pages": [
    { key: "pages", type: "text", label: "Pages to extract (e.g. 1,3,5-7)", placeholder: "1,3,5-7" },
  ],
  "rearrange-pdf-pages": [
    { key: "order", type: "text", label: "New page order (e.g. 3,1,2 — every page listed once)", placeholder: "3,1,2" },
  ],
  "crop-pdf": [
    { key: "marginPercent", type: "range", label: "Crop margin per edge (%)", min: 1, max: 40 },
  ],
  "add-watermark": [
    { key: "text", type: "text", label: "Watermark text", placeholder: "CONFIDENTIAL" },
  ],
  "add-page-numbers": [
    { key: "position", type: "select", label: "Position", choices: [
      { value: "bottom-center", label: "Bottom center" },
      { value: "bottom-left", label: "Bottom left" },
      { value: "bottom-right", label: "Bottom right" },
    ] },
    { key: "startAt", type: "number", label: "Start numbering at", min: 1 },
  ],
  "edit-pdf-metadata": [
    { key: "title", type: "text", label: "Title" },
    { key: "author", type: "text", label: "Author" },
    { key: "subject", type: "text", label: "Subject" },
    { key: "keywords", type: "text", label: "Keywords (comma-separated)" },
  ],
  "sign-pdf": [
    { key: "text", type: "text", label: "Signature text", placeholder: "Jane Doe" },
    { key: "position", type: "select", label: "Position", choices: [
      { value: "bottom-right", label: "Bottom right" },
      { value: "bottom-left", label: "Bottom left" },
      { value: "bottom-center", label: "Bottom center" },
    ] },
  ],
  "crop-image": [
    { key: "left", type: "number", label: "Left offset (px)", min: 0 },
    { key: "top", type: "number", label: "Top offset (px)", min: 0 },
    { key: "width", type: "number", label: "Crop width (px)", min: 1 },
    { key: "height", type: "number", label: "Crop height (px)", min: 1 },
  ],
  "rotate-image": [
    { key: "degrees", type: "select", label: "Rotate by", choices: [
      { value: "90", label: "90°" },
      { value: "180", label: "180°" },
      { value: "270", label: "270°" },
    ] },
  ],
  "flip-image": [
    { key: "direction", type: "select", label: "Direction", choices: [
      { value: "horizontal", label: "Horizontal" },
      { value: "vertical", label: "Vertical" },
    ] },
  ],
  "image-dpi-changer": [
    { key: "dpi", type: "select", label: "DPI", choices: [
      { value: "72", label: "72 (screen)" },
      { value: "150", label: "150" },
      { value: "300", label: "300 (print)" },
      { value: "600", label: "600" },
    ] },
  ],
};

/** Coerces string values from <select> elements into the numeric types processors expect. */
export function coerceOptions(slug: string, raw: Record<string, unknown>): Record<string, unknown> {
  const numericKeysBySlug: Record<string, string[]> = {
    "rotate-pdf": ["degrees"],
    "rotate-image": ["degrees"],
    "image-dpi-changer": ["dpi"],
  };
  const numericKeys = numericKeysBySlug[slug] ?? [];
  const result: Record<string, unknown> = { ...raw };
  for (const key of numericKeys) {
    if (result[key] !== undefined) result[key] = Number(result[key]);
  }
  return result;
}

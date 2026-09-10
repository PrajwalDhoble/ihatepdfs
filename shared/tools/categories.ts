import { ToolCategoryInfo } from "./types";

export const CATEGORIES: ToolCategoryInfo[] = [
  { id: "pdf", name: "PDF Tools", slug: "pdf-tools", description: "Compress, merge, split, convert and edit PDF files." },
  { id: "image", name: "Image Tools", slug: "image-tools", description: "Compress, resize, crop and convert images." },
  { id: "document", name: "Document Tools", slug: "document-tools", description: "Work with Word, Excel and PowerPoint files." },
  { id: "converter", name: "File Converter", slug: "file-converter", description: "Convert files between formats." },
  { id: "text", name: "Text Tools", slug: "text-tools", description: "Count, clean and transform text." },
  { id: "data", name: "Data Tools", slug: "data-tools", description: "Work with CSV, JSON and other data formats." },
  { id: "business", name: "Business Tools", slug: "business-tools", description: "Utilities for everyday business tasks." },
  { id: "security", name: "Security Tools", slug: "security-tools", description: "Protect, unlock and secure your files." },
  { id: "time", name: "Time Tools", slug: "time-tools", description: "Date, time and scheduling utilities." },
  { id: "developer", name: "Developer Tools", slug: "developer-tools", description: "Utilities for developers." },
];

export function getCategory(id: string): ToolCategoryInfo | undefined {
  return CATEGORIES.find((c) => c.id === id || c.slug === id);
}

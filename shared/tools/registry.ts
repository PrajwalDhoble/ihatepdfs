import { Tool, ToolCategory, ExecutionMode } from "./types";

/**
 * Helper to reduce boilerplate when defining a tool. Every field can still
 * be overridden per-tool. `status` defaults to "coming-soon" so a tool is
 * never accidentally presented as working before its processor exists.
 */
function defineTool(input: {
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  aliases?: string[];
  keywords?: string[];
  inputFormats?: string[];
  outputFormats?: string[];
  executionMode?: ExecutionMode;
  maxFileSizeMB?: number;
  maxFiles?: number;
  status?: "active" | "coming-soon";
  seoTitle?: string;
  seoDescription?: string;
  faq?: { q: string; a: string }[];
  relatedTools?: string[];
}): Tool {
  return {
    id: input.slug,
    name: input.name,
    slug: input.slug,
    category: input.category,
    status: input.status ?? "coming-soon",
    executionMode: input.executionMode ?? "server",
    description: input.description,
    aliases: input.aliases ?? [],
    keywords: input.keywords ?? [input.name.toLowerCase()],
    inputFormats: input.inputFormats ?? [],
    outputFormats: input.outputFormats ?? [],
    limits: {
      maxFileSizeMB: input.maxFileSizeMB ?? 50,
      maxFiles: input.maxFiles ?? 1,
    },
    seo: {
      title: input.seoTitle ?? `${input.name} Online | RepairMyPDF`,
      description: input.seoDescription ?? input.description,
      h1: input.name,
      canonical: `/${input.slug}`,
    },
    faq: input.faq ?? [],
    relatedTools: input.relatedTools ?? [],
  };
}

export const TOOLS: Tool[] = [
  // ---------------- PDF TOOLS ----------------
  defineTool({
    name: "Compress PDF",
    slug: "compress-pdf",
    category: "pdf",
    status: "active",
    description: "Reduce PDF file size online while preserving quality.",
    aliases: ["reduce pdf size", "shrink pdf", "make pdf smaller", "pdf compressor"],
    keywords: ["compress pdf", "reduce pdf size", "shrink pdf online", "pdf compressor"],
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    maxFileSizeMB: 50,
    seoTitle: "Compress PDF Online — Reduce PDF File Size | RepairMyPDF",
    seoDescription: "Compress PDF files online for free. Reduce file size for email and upload while keeping quality intact.",
    faq: [
      { q: "Will compressing reduce quality?", a: "RepairMyPDF balances file size and visual quality; you can choose a preset that favors quality or file size." },
      { q: "Is there a file size limit?", a: "Free compression currently supports files up to 50MB." },
    ],
    relatedTools: ["merge-pdf", "split-pdf", "pdf-to-jpg", "repair-pdf"],
  }),
  defineTool({
    name: "Merge PDF",
    slug: "merge-pdf",
    category: "pdf",
    status: "active",
    description: "Combine multiple PDF files into a single document.",
    aliases: ["combine pdf files", "join pdf", "merge pdf files"],
    keywords: ["merge pdf", "combine pdf", "join pdf files"],
    inputFormats: ["pdf"],
    outputFormats: ["pdf"],
    maxFiles: 20,
    seoTitle: "Merge PDF Online — Combine Multiple PDFs | RepairMyPDF",
    relatedTools: ["compress-pdf", "split-pdf", "rearrange-pdf-pages"],
  }),
  defineTool({
    name: "Split PDF",
    slug: "split-pdf",
    category: "pdf",
    status: "active",
    description: "Split a PDF into separate files by page range.",
    aliases: ["split pdf pages", "separate pdf pages"],
    keywords: ["split pdf", "extract pdf pages", "separate pdf"],
    inputFormats: ["pdf"],
    outputFormats: ["pdf", "zip"],
    relatedTools: ["merge-pdf", "extract-pdf-pages", "delete-pdf-pages"],
  }),
  defineTool({
    name: "PDF to JPG",
    slug: "pdf-to-jpg",
    category: "pdf",
    status: "active",
    description: "Convert PDF pages into JPG images. Requires a CloudConvert API key configured on the server.",
    aliases: ["pdf to image", "convert pdf to jpg"],
    keywords: ["pdf to jpg", "pdf to image converter"],
    inputFormats: ["pdf"],
    outputFormats: ["jpg", "zip"],
    relatedTools: ["jpg-to-pdf", "pdf-to-png", "compress-image"],
  }),
  defineTool({
    name: "JPG to PDF",
    slug: "jpg-to-pdf",
    category: "pdf",
    status: "active",
    description: "Convert JPG or PNG images into a PDF document.",
    aliases: ["image to pdf", "photo to pdf", "convert jpg to pdf"],
    keywords: ["jpg to pdf", "image to pdf converter"],
    inputFormats: ["jpg", "jpeg", "png"],
    outputFormats: ["pdf"],
    maxFiles: 50,
    relatedTools: ["pdf-to-jpg", "png-to-pdf", "compress-pdf"],
  }),
  defineTool({ name: "PDF to PNG", slug: "pdf-to-png", category: "pdf", status: "active", description: "Convert PDF pages into PNG images. Requires a CloudConvert API key configured on the server.", inputFormats: ["pdf"], outputFormats: ["png", "zip"], relatedTools: ["png-to-pdf", "pdf-to-jpg"] }),
  defineTool({ name: "PNG to PDF", slug: "png-to-pdf", category: "pdf", status: "active", description: "Convert PNG images into a PDF document.", inputFormats: ["png"], outputFormats: ["pdf"], maxFiles: 50, relatedTools: ["pdf-to-png", "jpg-to-pdf"] }),
  defineTool({ name: "PDF to Word", slug: "pdf-to-word", category: "pdf", status: "active", description: "Convert a PDF into an editable Word document. Requires a CloudConvert API key configured on the server.", inputFormats: ["pdf"], outputFormats: ["docx"], relatedTools: ["word-to-pdf", "pdf-to-excel"] }),
  defineTool({ name: "Word to PDF", slug: "word-to-pdf", category: "pdf", status: "active", description: "Convert a Word document into PDF. Requires a CloudConvert API key configured on the server.", inputFormats: ["docx", "doc"], outputFormats: ["pdf"], relatedTools: ["pdf-to-word"] }),
  defineTool({ name: "PDF to Excel", slug: "pdf-to-excel", category: "pdf", status: "active", description: "Convert PDF tables into an Excel spreadsheet. Requires a CloudConvert API key configured on the server.", inputFormats: ["pdf"], outputFormats: ["xlsx"], relatedTools: ["excel-to-pdf", "pdf-to-word"] }),
  defineTool({ name: "Excel to PDF", slug: "excel-to-pdf", category: "pdf", status: "active", description: "Convert an Excel spreadsheet into PDF. Requires a CloudConvert API key configured on the server.", inputFormats: ["xlsx", "xls"], outputFormats: ["pdf"], relatedTools: ["pdf-to-excel"] }),
  defineTool({ name: "PDF to PowerPoint", slug: "pdf-to-powerpoint", category: "pdf", status: "active", description: "Convert a PDF into an editable PowerPoint presentation. Requires a CloudConvert API key configured on the server.", inputFormats: ["pdf"], outputFormats: ["pptx"], relatedTools: ["powerpoint-to-pdf"] }),
  defineTool({ name: "PowerPoint to PDF", slug: "powerpoint-to-pdf", category: "pdf", status: "active", description: "Convert a PowerPoint presentation into PDF. Requires a CloudConvert API key configured on the server.", inputFormats: ["pptx", "ppt"], outputFormats: ["pdf"], relatedTools: ["pdf-to-powerpoint"] }),
  defineTool({ name: "Rotate PDF", slug: "rotate-pdf", category: "pdf", status: "active", description: "Rotate pages within a PDF document.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["crop-pdf", "compress-pdf"] }),
  defineTool({ name: "Delete PDF Pages", slug: "delete-pdf-pages", category: "pdf", status: "active", description: "Remove unwanted pages from a PDF.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["extract-pdf-pages", "split-pdf"] }),
  defineTool({ name: "Extract PDF Pages", slug: "extract-pdf-pages", category: "pdf", status: "active", description: "Extract specific pages from a PDF into a new file.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["split-pdf", "delete-pdf-pages"] }),
  defineTool({ name: "Rearrange PDF Pages", slug: "rearrange-pdf-pages", category: "pdf", status: "active", description: "Reorder pages within a PDF document.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["merge-pdf"] }),
  defineTool({ name: "Crop PDF", slug: "crop-pdf", category: "pdf", status: "active", description: "Crop the visible area of PDF pages by a percentage margin.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["rotate-pdf", "compress-pdf"] }),
  defineTool({ name: "Resize PDF", slug: "resize-pdf", category: "pdf", status: "active", description: "Change the page size of a PDF document, scaling content to fit.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["crop-pdf", "compress-pdf"] }),
  defineTool({ name: "Add Watermark", slug: "add-watermark", category: "pdf", status: "active", description: "Add a repeating text watermark to every page of a PDF.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["add-page-numbers", "compress-pdf"] }),
  defineTool({ name: "Add Page Numbers", slug: "add-page-numbers", category: "pdf", status: "active", description: "Insert page numbers into a PDF document.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["add-watermark"] }),
  defineTool({ name: "Protect PDF", slug: "protect-pdf", category: "security", status: "active", description: "Add a password to encrypt a PDF file. Requires qpdf installed on the server.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["unlock-pdf"] }),
  defineTool({ name: "Unlock PDF", slug: "unlock-pdf", category: "security", status: "active", description: "Remove a known password from a PDF file. Requires qpdf installed on the server.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["protect-pdf"] }),
  defineTool({ name: "Edit PDF Metadata", slug: "edit-pdf-metadata", category: "pdf", status: "active", description: "Edit a PDF's title, author, subject and keywords.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["compress-pdf"] }),
  defineTool({ name: "OCR PDF", slug: "ocr-pdf", category: "pdf", status: "active", description: "Extract text from scanned/image-only PDFs using OCR. Requires a CloudConvert API key configured on the server.", inputFormats: ["pdf"], outputFormats: ["txt"], relatedTools: ["extract-pdf-text"] }),
  defineTool({ name: "Extract PDF Text", slug: "extract-pdf-text", category: "pdf", status: "active", description: "Extract plain text content from a PDF.", inputFormats: ["pdf"], outputFormats: ["txt"], relatedTools: ["ocr-pdf"] }),
  defineTool({ name: "Compare PDFs", slug: "compare-pdfs", category: "pdf", status: "active", description: "Compare the text content of two PDFs and get a line-by-line diff report.", inputFormats: ["pdf"], outputFormats: ["txt"], maxFiles: 2, relatedTools: ["merge-pdf"] }),
  defineTool({ name: "Repair PDF", slug: "repair-pdf", category: "pdf", status: "active", description: "Attempt to repair a damaged or corrupted PDF file.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["compress-pdf"] }),
  defineTool({ name: "Sign PDF", slug: "sign-pdf", category: "pdf", status: "active", description: "Stamp a text signature onto the last page of a PDF. Not a cryptographic digital signature.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["add-watermark"] }),
  defineTool({ name: "Fill PDF", slug: "fill-pdf", category: "pdf", status: "active", description: "Fill out a PDF form's fields online.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["sign-pdf"] }),
  defineTool({ name: "Annotate PDF", slug: "annotate-pdf", category: "pdf", status: "active", description: "Add a visible note to a specific page and position in a PDF.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["fill-pdf"] }),
  defineTool({ name: "Flatten PDF", slug: "flatten-pdf", category: "pdf", status: "active", description: "Flatten PDF form fields into the page so they're no longer editable.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["fill-pdf"] }),
  defineTool({ name: "Add Header and Footer", slug: "add-header-footer", category: "pdf", status: "active", description: "Add repeating header and footer text to every page of a PDF.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["add-page-numbers", "add-watermark"] }),
  defineTool({ name: "Redact PDF", slug: "redact-pdf", category: "security", status: "active", description: "Cover a region of a PDF page with a solid black box to visually redact it.", inputFormats: ["pdf"], outputFormats: ["pdf"], relatedTools: ["protect-pdf", "flatten-pdf"] }),
  defineTool({ name: "Text to PDF", slug: "text-to-pdf", category: "converter", status: "active", description: "Create a new PDF from plain text, with automatic pagination and line wrapping.", inputFormats: [], outputFormats: ["pdf"], executionMode: "client", maxFiles: 0, relatedTools: ["extract-pdf-text", "word-counter"] }),
  defineTool({ name: "PDF Workflow Builder", slug: "pdf-workflow", category: "pdf", status: "active", description: "Chain multiple PDF edits — rotate, crop, watermark, header/footer, page numbers, redact and more — and run them all in one pass.", inputFormats: ["pdf"], outputFormats: ["pdf"], executionMode: "client", relatedTools: ["merge-pdf", "compress-pdf"] }),

  // ---------------- IMAGE TOOLS ----------------
  defineTool({
    name: "Compress Image",
    slug: "compress-image",
    category: "image",
    status: "active",
    description: "Compress JPG, PNG and WebP images to a target size or quality.",
    aliases: ["reduce image size", "make image smaller", "shrink photo"],
    keywords: ["compress image", "reduce image size", "image compressor online"],
    inputFormats: ["jpg", "jpeg", "png", "webp"],
    outputFormats: ["jpg", "jpeg", "png", "webp"],
    executionMode: "server",
    maxFiles: 20,
    seoTitle: "Compress Image Online — Reduce JPG, PNG & WebP Size | RepairMyPDF",
    relatedTools: ["resize-image", "jpg-to-png", "png-to-jpg"],
  }),
  defineTool({ name: "Compress JPG", slug: "compress-jpg", category: "image", status: "active", description: "Compress JPG images to reduce file size.", inputFormats: ["jpg", "jpeg"], outputFormats: ["jpg"], executionMode: "server", maxFiles: 20, relatedTools: ["compress-image", "compress-png"] }),
  defineTool({ name: "Compress PNG", slug: "compress-png", category: "image", status: "active", description: "Compress PNG images to reduce file size.", inputFormats: ["png"], outputFormats: ["png"], executionMode: "server", maxFiles: 20, relatedTools: ["compress-image", "compress-jpg"] }),
  defineTool({ name: "Compress WebP", slug: "compress-webp", category: "image", status: "active", description: "Compress WebP images to reduce file size.", inputFormats: ["webp"], outputFormats: ["webp"], executionMode: "server", maxFiles: 20, relatedTools: ["compress-image"] }),
  defineTool({ name: "Resize Image", slug: "resize-image", category: "image", status: "active", description: "Resize an image to exact dimensions.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: ["jpg", "png", "webp"], executionMode: "server", relatedTools: ["crop-image", "compress-image"] }),
  defineTool({ name: "Crop Image", slug: "crop-image", category: "image", status: "active", description: "Crop an image to an exact pixel area.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: ["jpg", "png", "webp"], executionMode: "server", relatedTools: ["resize-image"] }),
  defineTool({ name: "Rotate Image", slug: "rotate-image", category: "image", status: "active", description: "Rotate an image by any angle.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: ["jpg", "png", "webp"], executionMode: "server", relatedTools: ["flip-image"] }),
  defineTool({ name: "Flip Image", slug: "flip-image", category: "image", status: "active", description: "Flip an image horizontally or vertically.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: ["jpg", "png", "webp"], executionMode: "server", relatedTools: ["rotate-image"] }),
  defineTool({ name: "JPG to PNG", slug: "jpg-to-png", category: "image", status: "active", description: "Convert JPG images into PNG format.", inputFormats: ["jpg", "jpeg"], outputFormats: ["png"], executionMode: "server", maxFiles: 20, relatedTools: ["png-to-jpg"] }),
  defineTool({ name: "PNG to JPG", slug: "png-to-jpg", category: "image", status: "active", description: "Convert PNG images into JPG format.", inputFormats: ["png"], outputFormats: ["jpg"], executionMode: "server", maxFiles: 20, relatedTools: ["jpg-to-png"] }),
  defineTool({ name: "JPG to WebP", slug: "jpg-to-webp", category: "image", status: "active", description: "Convert JPG images into WebP format.", inputFormats: ["jpg", "jpeg"], outputFormats: ["webp"], executionMode: "server", maxFiles: 20, relatedTools: ["webp-to-jpg"] }),
  defineTool({ name: "PNG to WebP", slug: "png-to-webp", category: "image", status: "active", description: "Convert PNG images into WebP format.", inputFormats: ["png"], outputFormats: ["webp"], executionMode: "server", maxFiles: 20, relatedTools: ["webp-to-png"] }),
  defineTool({ name: "WebP to JPG", slug: "webp-to-jpg", category: "image", status: "active", description: "Convert WebP images into JPG format.", inputFormats: ["webp"], outputFormats: ["jpg"], executionMode: "server", maxFiles: 20, relatedTools: ["jpg-to-webp"] }),
  defineTool({ name: "WebP to PNG", slug: "webp-to-png", category: "image", status: "active", description: "Convert WebP images into PNG format.", inputFormats: ["webp"], outputFormats: ["png"], executionMode: "server", maxFiles: 20, relatedTools: ["png-to-webp"] }),
  defineTool({ name: "Image Metadata Remover", slug: "image-metadata-remover", category: "image", status: "active", description: "Remove EXIF and other metadata from images for privacy.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: ["jpg", "png", "webp"], executionMode: "server", relatedTools: ["compress-image"] }),
  defineTool({ name: "Image DPI Changer", slug: "image-dpi-changer", category: "image", status: "active", description: "Change the DPI metadata of an image for printing.", inputFormats: ["jpg", "jpeg", "png"], outputFormats: ["jpg", "png"], executionMode: "server", relatedTools: ["resize-image"] }),
  defineTool({ name: "Image Dimensions", slug: "image-dimensions", category: "image", status: "active", description: "Check the exact pixel dimensions of an image.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: [], executionMode: "client", maxFiles: 1, relatedTools: ["resize-image"] }),
  defineTool({ name: "Image Format Detector", slug: "image-format-detector", category: "image", status: "active", description: "Detect the true format of an image file from its content.", inputFormats: ["jpg", "jpeg", "png", "webp"], outputFormats: [], executionMode: "client", maxFiles: 1, relatedTools: ["image-dimensions"] }),

  // ---------------- TEXT / DATA / BUSINESS ----------------
  defineTool({ name: "Word Counter", slug: "word-counter", category: "text", status: "active", description: "Count words, characters, sentences and paragraphs in your text.", aliases: ["count words", "character counter"], keywords: ["word counter", "character count"], inputFormats: [], outputFormats: [], executionMode: "client", maxFiles: 0, relatedTools: [] }),
];

export function getAllTools(): Tool[] {
  return TOOLS;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

/** Matches free-text search input against tool names, aliases and keywords. */
export function searchTools(query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TOOLS.filter((t) => {
    const haystack = [t.name, ...t.aliases, ...t.keywords].join(" ").toLowerCase();
    return haystack.includes(q) || q.split(" ").every((word) => haystack.includes(word));
  }).slice(0, 8);
}

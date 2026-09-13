export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  relatedTools: string[];
  content: string[]; // paragraphs
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-compress-a-pdf-without-losing-quality",
    title: "How to Compress a PDF Without Losing Quality",
    description: "A practical guide to shrinking PDF file size for email and upload limits while keeping text and images sharp.",
    date: "2026-01-15",
    category: "PDF",
    relatedTools: ["compress-pdf", "repair-pdf"],
    content: [
      "Large PDFs are one of the most common file headaches — a scanned contract, a design proof, or a report full of photos can easily balloon past the size limits set by email providers or web forms. The good news is that most PDFs can be compressed significantly without any visible loss in quality, as long as you understand where the size is actually coming from.",
      "In most PDFs, the bulk of the file size comes from embedded images rather than the text itself. Text is stored as vector instructions and font references, which take up very little space. Images, especially high-resolution scans or uncompressed photos, are usually the real culprit. That's why a good PDF compressor focuses on re-encoding and downsampling images rather than touching the text layer at all.",
      "When you compress a PDF, you're usually choosing between a few tradeoffs: how much you shrink image resolution, how aggressively images are re-compressed, and whether metadata like author info and thumbnails gets stripped out. A 'Balanced' setting typically cuts file size by 40–70% with no noticeable visual difference, while a 'Small File' setting pushes harder and can be useful when you just need something under a strict limit, like a 5MB email attachment cap.",
      "One thing to watch for: compressing a PDF repeatedly, over and over through different tools, will eventually degrade image quality noticeably, the same way saving a JPEG multiple times does. It's best to always compress from the original, uncompressed source file rather than re-compressing an already-compressed one.",
      "If your PDF still won't open correctly, or looks corrupted after a scan or export, that's a different problem than size — see our note on fixing damaged PDFs below.",
    ],
  },
  {
    slug: "merge-pdf-files-in-the-right-order",
    title: "Merging PDF Files: How to Get the Page Order Right",
    description: "Tips for combining multiple PDFs into one document without shuffling pages by accident.",
    date: "2026-01-22",
    category: "PDF",
    relatedTools: ["merge-pdf", "rearrange-pdf-pages"],
    content: [
      "Merging PDFs sounds simple until you have six files and need them combined in a very specific order — say, a cover letter, then a resume, then three reference letters, then a certificate. The most common mistake is uploading files in whatever order your file picker happens to sort them (often alphabetical), which rarely matches the order you actually want.",
      "The reliable approach is to add files one at a time, in the exact order you want them to appear in the final document, rather than selecting all of them at once and hoping the tool sorts them correctly. Most merge tools combine files in upload order, so if you drag in file A, then B, then C, the merged PDF will have A's pages first, followed by B's, followed by C's.",
      "If you've already merged files and the order came out wrong, you don't need to start over. A page-rearranging tool lets you reorder pages within a single PDF after the fact, which is often faster than re-uploading everything in the right sequence.",
      "It's also worth double-checking each source file before merging — if one of your PDFs already has pages in the wrong order internally, merging won't fix that; you'll want to fix the source file first, or rearrange the final merged result once everything is combined.",
    ],
  },
  {
    slug: "why-your-pdf-wont-open-and-how-to-fix-it",
    title: "Why Your PDF Won't Open (And How to Fix It)",
    description: "Common causes of corrupted PDFs and what repairing a PDF can and can't fix.",
    date: "2026-01-29",
    category: "PDF",
    relatedTools: ["repair-pdf", "extract-pdf-text"],
    content: [
      "A PDF that suddenly won't open, or opens with garbled content, missing pages, or a blank white screen, is usually the result of a truncated download, an interrupted file transfer, or a scanning/export process that got cut off partway through. The underlying file structure — its cross-reference table, which tells a PDF reader where each object lives inside the file — can end up incomplete or pointing to the wrong locations.",
      "Repairing a PDF works by reading through the file as permissively as possible, ignoring minor structural inconsistencies, and then rebuilding a clean, correctly structured version from what could be recovered. This fixes a meaningful class of problems: bad cross-reference tables, stray or duplicated objects, and files that technically violate the PDF spec but are still mostly intact.",
      "What repair can't do is recover data that's genuinely missing — if the file was truncated halfway through being written, the second half of the document simply isn't there to recover. In that case, repair will typically salvage whatever pages made it into the file before the cutoff, rather than magically producing the missing pages.",
      "If a PDF won't open and you specifically need the text content rather than the visual document, it's sometimes faster to run a text extraction pass first — even a badly damaged PDF will often still yield readable text, since text extraction doesn't depend on the same rendering structure that a full repair needs to reconstruct.",
    ],
  },
  {
    slug: "reduce-image-size-for-web-without-losing-quality",
    title: "How to Reduce Image File Size for the Web Without Losing Quality",
    description: "A guide to choosing the right compression settings for JPG, PNG and WebP images.",
    date: "2026-02-05",
    category: "Image",
    relatedTools: ["compress-image", "resize-image"],
    content: [
      "Every image format handles compression differently, and picking the wrong one for the job is the most common reason people end up with images that are either needlessly large or visibly degraded. JPEG uses lossy compression that's very effective for photos with lots of color gradients, but it introduces visible artifacts around sharp edges and text. PNG is lossless, which makes it ideal for screenshots, logos, and images with flat colors or transparency, but it produces much larger files for photographic content. WebP generally beats both for web use, offering better compression than JPEG at equivalent quality.",
      "The single biggest lever for reducing file size isn't quality percentage — it's resolution. An image that's 4000 pixels wide but only ever displayed at 800 pixels wide is carrying three-quarters of its data for nothing. Resizing to the actual display size first, then compressing, almost always produces a smaller and better-looking result than compressing an oversized image harder.",
      "When a specific file size target matters — say, you need an image under 200KB for a form upload — a smart compressor won't just apply one quality setting and hope. It will try a reasonable quality first, measure the result, and adjust quality (and if needed, dimensions) iteratively until it lands close to the target, rather than guessing once and either overshooting or undershooting badly.",
      "Metadata is another easy win: photos straight from a phone or camera often carry EXIF data — camera settings, GPS location, timestamps — that serves no purpose once the image is on a website, and stripping it shaves off a small but genuinely free amount of size, with the added benefit of not leaking location data.",
    ],
  },
  {
    slug: "jpg-vs-png-vs-webp-which-format-should-you-use",
    title: "JPG vs PNG vs WebP: Which Image Format Should You Use?",
    description: "A quick decision guide for choosing the right image format based on what you're actually saving.",
    date: "2026-02-12",
    category: "Image",
    relatedTools: ["jpg-to-png", "png-to-jpg", "jpg-to-webp"],
    content: [
      "If the image is a photograph — anything with continuous color gradients like skin tones, skies, or textured surfaces — JPEG is usually the right call. Its lossy compression is specifically tuned for exactly this kind of content, and the file size savings over PNG can be dramatic, often 80–90% smaller at a quality level most people can't visually distinguish from the original.",
      "If the image needs a transparent background, has large areas of flat, uniform color, or contains sharp text and line art (think logos, icons, or diagrams), PNG is the better choice. JPEG's compression algorithm creates visible blotchy artifacts around hard edges and text, which is very noticeable on this kind of content even at high quality settings.",
      "WebP is worth considering as a default for most web use today: it supports both lossy and lossless compression modes, handles transparency like PNG, and generally produces smaller files than either JPEG or PNG at equivalent visual quality. The main reason to avoid it is compatibility with older software that doesn't support it yet, though this is increasingly rare.",
      "For anything that needs to go into a printed document or a PDF, JPEG or PNG remain the safer bet, since WebP support in office software and PDF viewers is still inconsistent.",
    ],
  },
  {
    slug: "convert-pdf-to-word-what-actually-happens",
    title: "Converting PDF to Word: What Actually Happens to Your Formatting",
    description: "Why PDF-to-Word conversion sometimes reflows text or shifts layout, and how to get better results.",
    date: "2026-02-19",
    category: "Document",
    relatedTools: ["pdf-to-word", "word-to-pdf"],
    content: [
      "PDF is fundamentally a fixed-layout format — every character, line, and image has an exact position on the page, and that's intentional; it's why a PDF looks identical no matter what device or software opens it. Word documents, by contrast, are flow-based: text reflows depending on margins, font substitutions, and page size. Converting from one to the other means translating between two fundamentally different ways of describing a document, which is where most conversion quirks come from.",
      "Simple, single-column documents with standard fonts convert most reliably, since there's little ambiguity about how the content should flow. Documents with complex multi-column layouts, text wrapped tightly around images, or tables with merged cells are the hardest case, because the converter has to infer the original structure from what is, at the PDF level, really just a collection of positioned text and image objects with no explicit 'this is a table' markup.",
      "Scanned PDFs — where the 'text' is actually just a picture of text — can't be converted to editable Word text directly at all; they need to go through OCR (optical character recognition) first to extract actual text content, and even then, the recognized text will need proofreading, since OCR isn't perfect, especially on lower-quality scans or unusual fonts.",
      "If a PDF-to-Word conversion comes out visually close but not editable in the way you expected, it's often faster to accept minor reflow differences and re-apply formatting for the specific sections you need to edit, rather than expecting a pixel-perfect editable replica.",
    ],
  },
  {
    slug: "protect-a-pdf-with-a-password-what-it-does-and-doesnt-do",
    title: "Password-Protecting a PDF: What It Actually Protects You From",
    description: "Understanding PDF encryption, and the difference between a user password and an owner password.",
    date: "2026-02-26",
    category: "Security",
    relatedTools: ["protect-pdf", "unlock-pdf"],
    content: [
      "When you add a password to a PDF, you're applying real encryption to the file's contents — typically AES-256 today — meaning the document genuinely cannot be opened without the correct password, not just hidden behind a UI prompt. This is a meaningfully different (and stronger) guarantee than, say, a password on a spreadsheet's 'protected' sheet, which often just hides data rather than encrypting it.",
      "PDF encryption actually supports two separate passwords with different purposes: a user password, which is required just to open and view the document at all, and an owner password, which controls permissions like printing, copying text, or editing, while still allowing the document to be opened. Many tools that 'add a password' set both to the same value for simplicity, but they can be set independently if you want, for example, anyone to be able to read a document but not print or edit it.",
      "It's worth being realistic about what password protection is for. It's genuinely effective against someone stumbling across the file or opening an email attachment they weren't meant to see. It is not a substitute for proper access control on a server, and a sufficiently motivated attacker with enough computing time can eventually brute-force a weak password — so a short, guessable password provides much less real protection than the fact that 'the file is encrypted' might suggest.",
      "If you're the one who added the password and later forget it, there's generally no legitimate way to recover the original password from a well-encrypted PDF — that's the entire point of encryption working correctly. Keep a note of any password you set somewhere safe.",
    ],
  },
  {
    slug: "extract-text-from-a-scanned-pdf",
    title: "How to Extract Text from a Scanned PDF",
    description: "The difference between text extraction and OCR, and when you need each one.",
    date: "2026-03-05",
    category: "PDF",
    relatedTools: ["extract-pdf-text", "ocr-pdf"],
    content: [
      "Not all PDFs contain 'text' in the same sense. A PDF exported directly from Word, Google Docs, or a web page contains an actual text layer — every character is stored as character data, which is why you can select and copy it, and why a text-extraction tool can pull it out instantly and accurately. A scanned PDF, on the other hand, is really just a sequence of images, one per page, that happen to look like a document. There's no text data in the file at all — just pixels arranged to resemble letters.",
      "This distinction is exactly why 'extract text' and OCR are two different tools rather than one. Text extraction reads an existing text layer, which is fast and essentially perfectly accurate, since it's just reading data that's already there. OCR (optical character recognition) has to analyze the image, identify shapes that look like characters, and guess what each one is — which is inherently slower and introduces the possibility of misreads, especially with unusual fonts, low scan quality, or handwriting.",
      "A quick way to tell which situation you're in: try selecting text in the PDF with your cursor in a normal PDF viewer. If you can select and highlight individual words, it has a real text layer and plain extraction will work perfectly. If clicking and dragging just selects the whole page like an image, it's a scan, and you'll need OCR instead.",
      "For OCR results, always proofread the output, particularly for numbers, proper nouns, and anything in a table — these are the areas where character recognition most commonly makes mistakes, since there's less surrounding context for the algorithm to use to guess a likely correct word.",
    ],
  },
  {
    slug: "invoice-generator-what-small-businesses-actually-need",
    title: "What a Simple Invoice Actually Needs to Include",
    description: "The essential fields for a professional, legally usable invoice, without unnecessary complexity.",
    date: "2026-03-12",
    category: "Business",
    relatedTools: ["invoice-generator"],
    content: [
      "A basic invoice needs surprisingly few things to be both professional and functional: a unique invoice number, your business details, your client's details, a clear breakdown of what's being charged for, and a total. Beyond that, most of what appears on elaborate invoice templates is optional polish rather than a strict requirement.",
      "The invoice number matters more than it might seem — it's how you and your client both reference this specific transaction later, whether for a payment dispute, a tax record, or simply matching a payment to the right invoice. A simple sequential system (INV-001, INV-002, and so on) is entirely sufficient; there's no need for anything more elaborate unless your accounting software requires a specific format.",
      "For the line items themselves, clarity beats brevity. 'Consulting services' tells a client much less than 'Website redesign consultation — 3 hours', and specific descriptions reduce the chance of payment disputes or follow-up questions later. Include quantity and unit price separately rather than just a lump total, so the math is transparent and easy to verify.",
      "Depending on your location, you may be legally required to include additional information like a tax ID or specific tax breakdown — that's worth checking with a local accountant if you're invoicing regularly, since requirements vary significantly by country and business type.",
    ],
  },
  {
    slug: "json-vs-csv-when-to-use-which",
    title: "JSON vs CSV: Choosing the Right Format for Your Data",
    description: "A practical comparison for developers deciding how to store or exchange structured data.",
    date: "2026-03-19",
    category: "Developer",
    relatedTools: ["csv-to-json", "json-to-csv", "json-formatter"],
    content: [
      "CSV is the simplest possible way to represent tabular data — rows and columns, comma-separated, readable by essentially every spreadsheet program and data tool in existence. Its strength is universal compatibility and human readability at a glance. Its weakness is that it can only really represent flat, table-shaped data; there's no clean way to express nested structures, arrays within a field, or optional fields that some rows have and others don't.",
      "JSON handles exactly the cases CSV struggles with: nested objects, arrays, optional fields, and mixed data types within the same structure. This makes it the natural choice for anything coming from or going to an API, configuration files, or data with a genuinely hierarchical shape — a user object with an array of addresses, for instance, has no clean flat representation in CSV without either duplicating rows or inventing a delimiter-within-a-delimiter convention.",
      "A common real-world task is converting between the two: exporting JSON from an API into CSV so someone can open it in a spreadsheet, or converting a CSV export into JSON to feed into an application. The conversion is straightforward for flat data — each CSV row becomes a JSON object with column headers as keys — but nested JSON has to be flattened somehow to fit into CSV's row-and-column shape, which is where you have to make a judgment call about which structure to preserve and which to simplify.",
      "For quick one-off conversions or checking that a data export looks right, doing it in a browser-based tool is often faster than writing a script, especially when you just need to eyeball the result once rather than build a repeatable pipeline.",
    ],
  },
  {
    slug: "gdpr-and-image-metadata-what-exif-data-reveals",
    title: "What EXIF Metadata in Your Photos Actually Reveals",
    description: "Why stripping image metadata matters for privacy, not just file size.",
    date: "2026-03-26",
    category: "Image",
    relatedTools: ["image-metadata-remover"],
    content: [
      "Most photos taken on a phone or digital camera carry a surprising amount of hidden data embedded directly in the file, called EXIF metadata. This commonly includes the exact date and time the photo was taken, the camera or phone model, and — if location services were enabled — the precise GPS coordinates of where the photo was taken, often accurate to within a few meters.",
      "This becomes a real privacy consideration the moment a photo leaves your own device. Uploading a photo to most social media platforms typically strips this automatically, but sending a photo directly via email, messaging apps, or uploading it to a website that doesn't sanitize uploads can pass that GPS and timestamp data along with it, often without either the sender or recipient realizing it's there.",
      "This isn't hypothetical: there have been well-documented cases of people inadvertently revealing their home address or daily routine simply by sharing photos that still carried embedded location data, particularly from people who didn't realize the information was in the file at all since it's invisible when you just look at the image itself.",
      "Stripping metadata before sharing a photo publicly — for a marketplace listing, a public social account, or a website — is a quick, one-way action with no real downside; you lose nothing about the photo's visual content, only the invisible data trailing along with it.",
    ],
  },
  {
    slug: "pdf-forms-fillable-vs-flat",
    title: "Fillable PDF Forms vs Flat PDFs: What's the Difference?",
    description: "Understanding AcroForm fields and why some PDFs let you type directly into them while others don't.",
    date: "2026-04-02",
    category: "PDF",
    relatedTools: ["fill-pdf", "flatten-pdf"],
    content: [
      "Some PDFs let you click directly into a field and type — a name, a date, a checkbox — while others require printing the page out to fill in by hand. The difference comes down to whether the PDF was built with actual form fields (technically called AcroForm fields) or whether it's just a flat image or static layout of a form, with lines and boxes that are purely visual rather than interactive.",
      "A fillable PDF has each input defined as a distinct field object with a name, a type (text, checkbox, dropdown, radio button), and a position on the page. This is what allows a PDF reader — or a tool designed to read these fields — to detect exactly which fields exist and let you fill each one individually, rather than needing you to click at some estimated pixel position and hope your text lines up with the printed line.",
      "Once a form has been filled out, there's often a good reason to flatten it: flattening converts the filled-in field values into permanent page content, the same as any other text on the page, which means the form can no longer be accidentally edited, and it will display identically in every PDF viewer, since it no longer depends on that viewer correctly rendering interactive form fields.",
      "If you need to convert an old paper form (or a scanned image of one) into something people can fill out digitally, that generally requires rebuilding it with proper field definitions from scratch — there's no automatic way to infer 'this line is meant to be a name field' from a scanned image alone.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

import type { FormatId } from "./formats";

export type ToolStatus = "ready" | "development" | "planned";

export type CategoryId = "images" | "pdf" | "documents" | "spreadsheets" | "text";

export type Category = {
  id: CategoryId;
  name: string;
  short: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "images",
    name: "Images",
    short: "Images",
    description: "Convert, compress and resize photos and graphics without leaving your browser.",
  },
  {
    id: "pdf",
    name: "PDF Tools",
    short: "PDF",
    description: "Merge, split, compress and convert PDF documents on your own device.",
  },
  {
    id: "documents",
    name: "Office Documents",
    short: "Documents",
    description: "Move between Word, PowerPoint and PDF while keeping layouts intact.",
  },
  {
    id: "spreadsheets",
    name: "Spreadsheets",
    short: "Spreadsheets",
    description: "Turn workbooks into clean CSV, and CSV into shareable sheets.",
  },
  {
    id: "text",
    name: "Text & Data",
    short: "Text & Data",
    description: "Reshape CSV, JSON, Markdown and HTML with instant, private engines.",
  },
];

/** Which in-browser engine powers a ready tool. */
export type EngineKind =
  | { type: "image"; output: "png" | "jpg" | "webp" | "auto"; mode?: "convert" | "compress" | "resize" }
  | { type: "text"; transform: "csv-to-json" | "json-to-csv" | "json-format" | "md-to-html" | "html-to-text" };

export type Tool = {
  id: string;
  name: string;
  category: CategoryId;
  from: FormatId[];
  to: FormatId;
  summary: string;
  description: string;
  status: ToolStatus;
  /** Roadmap phase that delivers this engine */
  phase: 1 | 2 | 3;
  engineName: string;
  keywords: string[];
  multiple?: boolean;
  engine?: EngineKind;
  /** Option names shown for tools still in development */
  plannedOptions?: string[];
};

export const TOOLS: Tool[] = [
  // ——— Images (ready) ———
  {
    id: "png-to-jpg",
    name: "PNG to JPG",
    category: "images",
    from: ["png"],
    to: "jpg",
    summary: "Smaller photos with adjustable quality.",
    description:
      "Convert PNG images to JPG. Transparent areas are filled with your chosen background colour, and quality can be tuned to balance size and detail.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["png", "jpg", "jpeg", "photo", "image", "convert"],
    multiple: true,
    engine: { type: "image", output: "jpg" },
  },
  {
    id: "jpg-to-png",
    name: "JPG to PNG",
    category: "images",
    from: ["jpg"],
    to: "png",
    summary: "Lossless copies for editing and design.",
    description: "Convert JPG photos to lossless PNG — ideal before editing, annotating or placing into design tools.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["jpg", "jpeg", "png", "lossless", "image"],
    multiple: true,
    engine: { type: "image", output: "png" },
  },
  {
    id: "image-to-webp",
    name: "Image to WebP",
    category: "images",
    from: ["png", "jpg"],
    to: "webp",
    summary: "Modern web format, up to 30% smaller.",
    description: "Convert PNG or JPG images to WebP for faster websites. Keeps transparency and lets you control quality.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["webp", "web", "png", "jpg", "optimize", "website"],
    multiple: true,
    engine: { type: "image", output: "webp" },
  },
  {
    id: "webp-to-png",
    name: "WebP to PNG",
    category: "images",
    from: ["webp"],
    to: "png",
    summary: "Open WebP files in any app.",
    description: "Convert WebP images to PNG so they open in older apps, office suites and image editors.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["webp", "png", "image"],
    multiple: true,
    engine: { type: "image", output: "png" },
  },
  {
    id: "svg-to-png",
    name: "SVG to PNG",
    category: "images",
    from: ["svg"],
    to: "png",
    summary: "Rasterise vectors at any resolution.",
    description: "Render SVG artwork to a crisp PNG. Choose the output width for app icons, slides or social posts.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["svg", "vector", "png", "icon", "logo", "rasterize"],
    multiple: true,
    engine: { type: "image", output: "png", mode: "resize" },
  },
  {
    id: "compress-image",
    name: "Compress Image",
    category: "images",
    from: ["png", "jpg", "webp"],
    to: "img",
    summary: "Reduce file size, keep the look.",
    description:
      "Shrink PNG, JPG and WebP images for email and the web. Forma re-encodes each image and shows exactly how much space you saved.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["compress", "reduce", "shrink", "smaller", "optimize", "size", "image", "photo"],
    multiple: true,
    engine: { type: "image", output: "auto", mode: "compress" },
  },
  {
    id: "resize-image",
    name: "Resize Image",
    category: "images",
    from: ["png", "jpg", "webp"],
    to: "img",
    summary: "Scale to an exact width.",
    description: "Resize images to a specific width while keeping proportions. Great for avatars, listings and thumbnails.",
    status: "ready",
    phase: 1,
    engineName: "Canvas raster engine",
    keywords: ["resize", "scale", "dimensions", "width", "thumbnail", "image"],
    multiple: true,
    engine: { type: "image", output: "auto", mode: "resize" },
  },
  {
    id: "heic-to-jpg",
    name: "HEIC to JPG",
    category: "images",
    from: ["heic"],
    to: "jpg",
    summary: "iPhone photos to universal JPG.",
    description: "Convert iPhone and iPad HEIC photos to JPG so they open everywhere.",
    status: "development",
    phase: 2,
    engineName: "libheif WebAssembly decoder",
    keywords: ["heic", "heif", "iphone", "apple", "jpg", "photo"],
    multiple: true,
    plannedOptions: ["Output quality", "Keep EXIF metadata", "Batch conversion"],
  },

  // ——— PDF (phase 2) ———
  {
    id: "merge-pdf",
    name: "Merge PDF",
    category: "pdf",
    from: ["pdf"],
    to: "pdf",
    summary: "Combine several PDFs into one.",
    description: "Drag PDFs into order and combine them into a single document.",
    status: "development",
    phase: 2,
    engineName: "pdf-lib (WebAssembly)",
    keywords: ["merge", "combine", "join", "pdf"],
    multiple: true,
    plannedOptions: ["Drag to reorder files", "Page thumbnails", "Bookmarks per file"],
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    category: "pdf",
    from: ["pdf"],
    to: "pdf",
    summary: "Extract pages or ranges.",
    description: "Pull out selected pages or split a document into several smaller PDFs.",
    status: "development",
    phase: 2,
    engineName: "pdf-lib (WebAssembly)",
    keywords: ["split", "extract", "pages", "separate", "pdf"],
    plannedOptions: ["Page ranges (e.g. 1–3, 8)", "Split every N pages", "Extract single pages"],
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    category: "pdf",
    from: ["pdf"],
    to: "pdf",
    summary: "Make PDFs easier to share.",
    description: "Reduce the size of image-heavy PDFs for email and uploads.",
    status: "development",
    phase: 2,
    engineName: "pdf-lib + image re-encoder",
    keywords: ["compress", "reduce", "shrink", "smaller", "pdf"],
    plannedOptions: ["Compression level", "Image resolution (DPI)", "Remove metadata"],
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    category: "pdf",
    from: ["pdf"],
    to: "pdf",
    summary: "Fix sideways pages.",
    description: "Rotate all pages, or just the ones scanned upside down.",
    status: "development",
    phase: 2,
    engineName: "pdf-lib (WebAssembly)",
    keywords: ["rotate", "turn", "orientation", "pdf"],
    plannedOptions: ["Rotate 90° / 180°", "Per-page rotation"],
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    category: "pdf",
    from: ["pdf"],
    to: "jpg",
    summary: "Each page as an image.",
    description: "Render every PDF page as a high-quality JPG image.",
    status: "development",
    phase: 2,
    engineName: "PDF.js renderer",
    keywords: ["pdf", "jpg", "image", "pages", "export"],
    plannedOptions: ["Resolution (DPI)", "Page range", "Image quality"],
  },
  {
    id: "jpg-to-pdf",
    name: "Images to PDF",
    category: "pdf",
    from: ["jpg", "png"],
    to: "pdf",
    summary: "Photos and scans into one PDF.",
    description: "Combine photos, receipts and scans into a single tidy PDF.",
    status: "development",
    phase: 2,
    engineName: "pdf-lib (WebAssembly)",
    keywords: ["jpg", "png", "image", "photo", "scan", "pdf", "combine"],
    multiple: true,
    plannedOptions: ["Page size (A4, Letter)", "Margins", "Fit or fill"],
  },

  // ——— Office documents (phase 3) ———
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    category: "documents",
    from: ["docx"],
    to: "pdf",
    summary: "Share documents that look the same everywhere.",
    description: "Convert Word documents to PDF while preserving fonts, headings and tables.",
    status: "planned",
    phase: 3,
    engineName: "Local DOCX layout engine",
    keywords: ["word", "doc", "docx", "pdf", "microsoft", "office"],
    plannedOptions: ["Page size", "Embed fonts", "Include comments"],
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    category: "documents",
    from: ["pdf"],
    to: "docx",
    summary: "Make PDFs editable again.",
    description: "Turn PDF text and layout into an editable Word document.",
    status: "planned",
    phase: 3,
    engineName: "PDF.js text extraction + DOCX writer",
    keywords: ["pdf", "word", "docx", "edit", "editable"],
    plannedOptions: ["Keep layout / text only", "Page range"],
  },
  {
    id: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    category: "documents",
    from: ["pptx"],
    to: "pdf",
    summary: "Slides as a portable handout.",
    description: "Convert presentations to PDF for printing and sharing.",
    status: "planned",
    phase: 3,
    engineName: "Local PPTX renderer",
    keywords: ["powerpoint", "ppt", "pptx", "slides", "presentation", "pdf"],
    plannedOptions: ["Slides per page", "Include speaker notes"],
  },
  {
    id: "word-to-html",
    name: "Word to HTML",
    category: "documents",
    from: ["docx"],
    to: "html",
    summary: "Clean, semantic web markup.",
    description: "Convert Word documents into clean HTML for websites and CMS editors.",
    status: "planned",
    phase: 3,
    engineName: "Mammoth.js (open source)",
    keywords: ["word", "docx", "html", "web", "cms"],
    plannedOptions: ["Inline images", "Strip styles"],
  },

  // ——— Spreadsheets (phase 3) ———
  {
    id: "excel-to-csv",
    name: "Excel to CSV",
    category: "spreadsheets",
    from: ["xlsx"],
    to: "csv",
    summary: "Export any sheet as CSV.",
    description: "Export worksheets from Excel workbooks as plain CSV files.",
    status: "planned",
    phase: 3,
    engineName: "SheetJS Community Edition",
    keywords: ["excel", "xlsx", "xls", "csv", "spreadsheet", "sheet"],
    plannedOptions: ["Choose worksheet", "Delimiter", "Encoding"],
  },
  {
    id: "csv-to-excel",
    name: "CSV to Excel",
    category: "spreadsheets",
    from: ["csv"],
    to: "xlsx",
    summary: "Shareable workbooks from raw data.",
    description: "Turn CSV files into formatted Excel workbooks with typed columns.",
    status: "planned",
    phase: 3,
    engineName: "SheetJS Community Edition",
    keywords: ["csv", "excel", "xlsx", "spreadsheet", "workbook"],
    plannedOptions: ["Header row", "Column types", "Freeze first row"],
  },
  {
    id: "excel-to-pdf",
    name: "Excel to PDF",
    category: "spreadsheets",
    from: ["xlsx"],
    to: "pdf",
    summary: "Print-ready tables.",
    description: "Convert spreadsheets into paginated, print-ready PDFs.",
    status: "planned",
    phase: 3,
    engineName: "SheetJS + PDF writer",
    keywords: ["excel", "xlsx", "pdf", "print", "spreadsheet"],
    plannedOptions: ["Fit to page width", "Orientation", "Gridlines"],
  },

  // ——— Text & Data (ready) ———
  {
    id: "csv-to-json",
    name: "CSV to JSON",
    category: "text",
    from: ["csv"],
    to: "json",
    summary: "Rows into structured objects.",
    description: "Convert CSV rows into an array of JSON objects using the header row as keys. Handles quoted fields and commas inside values.",
    status: "ready",
    phase: 1,
    engineName: "Forma data engine",
    keywords: ["csv", "json", "data", "table", "api", "convert"],
    engine: { type: "text", transform: "csv-to-json" },
  },
  {
    id: "json-to-csv",
    name: "JSON to CSV",
    category: "text",
    from: ["json"],
    to: "csv",
    summary: "Objects into spreadsheet rows.",
    description: "Convert a JSON array into CSV that opens in Excel, Numbers or Google Sheets. Nested objects are flattened into dotted columns.",
    status: "ready",
    phase: 1,
    engineName: "Forma data engine",
    keywords: ["json", "csv", "excel", "spreadsheet", "data", "export"],
    engine: { type: "text", transform: "json-to-csv" },
  },
  {
    id: "json-formatter",
    name: "Format JSON",
    category: "text",
    from: ["json"],
    to: "json",
    summary: "Validate and pretty-print.",
    description: "Validate JSON and reformat it with clean indentation — or minify it for production.",
    status: "ready",
    phase: 1,
    engineName: "Forma data engine",
    keywords: ["json", "format", "pretty", "beautify", "minify", "validate", "lint"],
    engine: { type: "text", transform: "json-format" },
  },
  {
    id: "markdown-to-html",
    name: "Markdown to HTML",
    category: "text",
    from: ["md"],
    to: "html",
    summary: "Notes into web-ready markup.",
    description: "Convert Markdown into clean HTML, with GitHub-style tables, lists and code blocks.",
    status: "ready",
    phase: 1,
    engineName: "marked (open source)",
    keywords: ["markdown", "md", "html", "notes", "readme", "web"],
    engine: { type: "text", transform: "md-to-html" },
  },
  {
    id: "html-to-text",
    name: "HTML to Text",
    category: "text",
    from: ["html"],
    to: "txt",
    summary: "Strip markup, keep the words.",
    description: "Extract readable plain text from HTML pages and emails, keeping paragraphs and line breaks.",
    status: "ready",
    phase: 1,
    engineName: "Browser DOM parser",
    keywords: ["html", "text", "txt", "strip", "plain", "email", "web"],
    engine: { type: "text", transform: "html-to-text" },
  },
];

export const STATUS_META: Record<ToolStatus, { label: string; long: string }> = {
  ready: { label: "Ready", long: "Runs on this device" },
  development: { label: "In development", long: "Engine in development" },
  planned: { label: "Planned", long: "Planned for a later release" },
};

export function getTool(id: string) {
  return TOOLS.find((t) => t.id === id);
}

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

export function toolsInCategory(id: CategoryId) {
  return TOOLS.filter((t) => t.category === id);
}

const ALIASES: Record<string, string[]> = {
  word: ["docx"],
  doc: ["docx"],
  excel: ["xlsx"],
  xls: ["xlsx"],
  powerpoint: ["pptx"],
  ppt: ["pptx"],
  jpeg: ["jpg"],
  photo: ["jpg", "heic"],
  iphone: ["heic"],
  markdown: ["md"],
  text: ["txt"],
};

/** Rank tools for a free-text query such as "png", "word to pdf" or "compress". */
export function searchTools(query: string, tools: Tool[] = TOOLS): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  const terms = q.split(/\s+|→|->/).filter((t) => t && t !== "to" && t !== "into");
  if (terms.length === 0) return tools;

  const scored = tools
    .map((tool) => {
      const name = tool.name.toLowerCase();
      const formats = [...tool.from, tool.to];
      let score = 0;
      for (const term of terms) {
        const expanded = [term, ...(ALIASES[term] ?? [])];
        let hit = 0;
        for (const t of expanded) {
          if (formats.includes(t as FormatId)) hit = Math.max(hit, 6);
          if (name.split(/\s+/).some((w) => w.startsWith(t))) hit = Math.max(hit, 5);
          if (tool.keywords.some((k) => k.startsWith(t))) hit = Math.max(hit, 3);
          if (tool.summary.toLowerCase().includes(t)) hit = Math.max(hit, 1);
        }
        if (hit === 0) return { tool, score: 0 };
        score += hit;
      }
      // Respect direction: "pdf to word" should prefer PDF → DOCX
      if (terms.length >= 2) {
        const first = ALIASES[terms[0]]?.[0] ?? terms[0];
        const last = ALIASES[terms[terms.length - 1]]?.[0] ?? terms[terms.length - 1];
        if (tool.from.includes(first as FormatId) && tool.to === last) score += 4;
      }
      if (tool.status === "ready") score += 0.5;
      return { tool, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.tool);
}

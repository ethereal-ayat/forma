export type FormatId =
  | "pdf"
  | "docx"
  | "pptx"
  | "xlsx"
  | "csv"
  | "json"
  | "png"
  | "jpg"
  | "webp"
  | "svg"
  | "heic"
  | "html"
  | "md"
  | "txt"
  | "img";

export type FormatMeta = {
  id: FormatId;
  label: string;
  name: string;
  /** CSS variable holding this format's hue */
  color: string;
  mime: string[];
  extensions: string[];
};

export const FORMATS: Record<FormatId, FormatMeta> = {
  pdf: { id: "pdf", label: "PDF", name: "PDF document", color: "var(--fmt-pdf)", mime: ["application/pdf"], extensions: ["pdf"] },
  docx: {
    id: "docx",
    label: "DOCX",
    name: "Word document",
    color: "var(--fmt-docx)",
    mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
    extensions: ["docx", "doc"],
  },
  pptx: {
    id: "pptx",
    label: "PPTX",
    name: "PowerPoint presentation",
    color: "var(--fmt-pptx)",
    mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    extensions: ["pptx", "ppt"],
  },
  xlsx: {
    id: "xlsx",
    label: "XLSX",
    name: "Excel workbook",
    color: "var(--fmt-xlsx)",
    mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"],
    extensions: ["xlsx", "xls"],
  },
  csv: { id: "csv", label: "CSV", name: "Comma-separated values", color: "var(--fmt-csv)", mime: ["text/csv"], extensions: ["csv", "tsv"] },
  json: { id: "json", label: "JSON", name: "JSON data", color: "var(--fmt-json)", mime: ["application/json"], extensions: ["json"] },
  png: { id: "png", label: "PNG", name: "PNG image", color: "var(--fmt-png)", mime: ["image/png"], extensions: ["png"] },
  jpg: { id: "jpg", label: "JPG", name: "JPEG image", color: "var(--fmt-jpg)", mime: ["image/jpeg"], extensions: ["jpg", "jpeg"] },
  webp: { id: "webp", label: "WEBP", name: "WebP image", color: "var(--fmt-webp)", mime: ["image/webp"], extensions: ["webp"] },
  svg: { id: "svg", label: "SVG", name: "SVG vector", color: "var(--fmt-svg)", mime: ["image/svg+xml"], extensions: ["svg"] },
  heic: { id: "heic", label: "HEIC", name: "HEIC photo", color: "var(--fmt-heic)", mime: ["image/heic", "image/heif"], extensions: ["heic", "heif"] },
  html: { id: "html", label: "HTML", name: "Web page", color: "var(--fmt-html)", mime: ["text/html"], extensions: ["html", "htm"] },
  md: { id: "md", label: "MD", name: "Markdown", color: "var(--fmt-md)", mime: ["text/markdown"], extensions: ["md", "markdown"] },
  txt: { id: "txt", label: "TXT", name: "Plain text", color: "var(--fmt-txt)", mime: ["text/plain"], extensions: ["txt"] },
  img: {
    id: "img",
    label: "IMG",
    name: "Image",
    color: "var(--fmt-img)",
    mime: ["image/png", "image/jpeg", "image/webp"],
    extensions: ["png", "jpg", "jpeg", "webp"],
  },
};

export function acceptAttr(formats: FormatId[]) {
  const parts = new Set<string>();
  for (const f of formats) {
    for (const m of FORMATS[f].mime) parts.add(m);
    for (const e of FORMATS[f].extensions) parts.add(`.${e}`);
  }
  return Array.from(parts).join(",");
}

export function fileExtension(name: string) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

/** Guess the Forma format for a file, by extension first then MIME type. */
export function detectFormat(file: { name: string; type: string }): FormatId | null {
  const ext = fileExtension(file.name);
  for (const f of Object.values(FORMATS)) {
    if (f.id === "img") continue;
    if (f.extensions.includes(ext)) return f.id;
  }
  for (const f of Object.values(FORMATS)) {
    if (f.id === "img") continue;
    if (f.mime.includes(file.type)) return f.id;
  }
  return null;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[u]}`;
}

/** Build the download name: original base name + optional suffix + new extension. */
export function outputFileName(original: string, ext: string, suffix = "") {
  const i = original.lastIndexOf(".");
  const base = (i > 0 ? original.slice(0, i) : original) || "file";
  const clean = suffix.trim().replace(/[\\/:*?"<>|]/g, "");
  return `${base}${clean}.${ext}`;
}

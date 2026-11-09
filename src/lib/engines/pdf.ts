/**
 * Browser PDF engine built on pdf-lib (pure JavaScript). Files never leave the device.
 * pdf-lib is loaded on demand so it stays out of the first page load.
 */

export type PdfSource = { name: string; bytes: Uint8Array };
export type PdfOutput = { bytes: Uint8Array; pages: number };

export type PageSize = "image" | "a4" | "letter";
export type Margin = "none" | "small" | "large";
export type ImagesToPdfOptions = { pageSize: PageSize; margin: Margin };

/** A problem with one specific input file; `index` is its position in the list. */
export class PdfInputError extends Error {
  constructor(
    public fileName: string,
    public index: number,
    message: string,
  ) {
    super(message);
    this.name = "PdfInputError";
  }
}

const MSG = {
  notPdf: "This file isn't a readable PDF. It may be damaged or have the wrong extension.",
  encrypted: "This PDF is password-protected or encrypted. Remove the protection in the app that created it, then try again.",
  damaged: "This PDF is damaged and couldn't be read.",
  noPages: "This PDF has no readable pages. It may be damaged.",
  badPages: "Some pages in this PDF are damaged and couldn't be copied.",
  notImage: "This isn't a valid JPG or PNG image.",
  badImage: "This image is damaged or uses an encoding that can't be placed in a PDF.",
};

const loadLib = () => import("pdf-lib");

function hasPdfHeader(bytes: Uint8Array) {
  const head = bytes.subarray(0, 1024);
  for (let i = 0; i + 4 < head.length; i++) {
    if (head[i] === 0x25 && head[i + 1] === 0x50 && head[i + 2] === 0x44 && head[i + 3] === 0x46 && head[i + 4] === 0x2d) return true;
  }
  return false;
}

async function openPdf(lib: Awaited<ReturnType<typeof loadLib>>, src: PdfSource, index: number) {
  if (!hasPdfHeader(src.bytes)) throw new PdfInputError(src.name, index, MSG.notPdf);
  let doc;
  try {
    doc = await lib.PDFDocument.load(src.bytes, { updateMetadata: false });
  } catch (e) {
    const encrypted = e instanceof lib.EncryptedPDFError || /encrypt/i.test((e as Error)?.message ?? "");
    throw new PdfInputError(src.name, index, encrypted ? MSG.encrypted : MSG.damaged);
  }
  let count = 0;
  try {
    count = doc.getPageCount();
  } catch {
    throw new PdfInputError(src.name, index, MSG.damaged);
  }
  if (count === 0) throw new PdfInputError(src.name, index, MSG.noPages);
  return doc;
}

/** Validate a PDF and return its page count. Throws PdfInputError with a readable message. */
export async function inspectPdf(src: PdfSource): Promise<{ pages: number }> {
  const lib = await loadLib();
  const doc = await openPdf(lib, src, 0);
  return { pages: doc.getPageCount() };
}

/** Combine PDFs in the given order. */
export async function mergePdfs(sources: PdfSource[], onProgress?: (index: number) => void): Promise<PdfOutput> {
  if (sources.length === 0) throw new Error("Add at least one PDF.");
  const lib = await loadLib();
  const out = await lib.PDFDocument.create();
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]!;
    onProgress?.(i);
    const doc = await openPdf(lib, src, i);
    let pages;
    try {
      pages = await out.copyPages(doc, doc.getPageIndices());
    } catch {
      throw new PdfInputError(src.name, i, MSG.badPages);
    }
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save();
  return { bytes, pages: out.getPageCount() };
}

export function detectImageKind(bytes: Uint8Array): "jpg" | "png" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (png.every((b, i) => bytes[i] === b)) return "png";
  return null;
}

/** Read the EXIF orientation tag (1–8) from a JPEG; 1 when absent. */
export function jpegOrientation(b: Uint8Array): number {
  if (b[0] !== 0xff || b[1] !== 0xd8) return 1;
  let i = 2;
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) return 1;
    const marker = b[i + 1]!;
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return 1;
    const len = (b[i + 2]! << 8) | b[i + 3]!;
    const isExif = marker === 0xe1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66 && b[i + 8] === 0 && b[i + 9] === 0;
    if (isExif) {
      const t = i + 10;
      const le = b[t] === 0x49;
      const r16 = (o: number) => (le ? b[o]! | (b[o + 1]! << 8) : (b[o]! << 8) | b[o + 1]!);
      const r32 = (o: number) =>
        (le ? b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24) : (b[o]! << 24) | (b[o + 1]! << 16) | (b[o + 2]! << 8) | b[o + 3]!) >>> 0;
      const ifd = t + r32(t + 4);
      if (ifd + 2 > b.length) return 1;
      const n = r16(ifd);
      for (let k = 0; k < n; k++) {
        const e = ifd + 2 + k * 12;
        if (e + 12 > b.length) break;
        if (r16(e) === 0x0112) {
          const v = r16(e + 8);
          return v >= 1 && v <= 8 ? v : 1;
        }
      }
      return 1;
    }
    i += 2 + len;
  }
  return 1;
}

const PAPER: Record<Exclude<PageSize, "image">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const MARGIN_PT: Record<Margin, number> = { none: 0, small: 18, large: 36 };
/** Screen pixels to PDF points (96 dpi → 72 dpi). */
const PX_TO_PT = 0.75;

export type PageLayout = { pageW: number; pageH: number; x: number; y: number; w: number; h: number };

/** Fit an image of the given displayed size onto a page without cropping, keeping its proportions. */
export function layoutImagePage(imgW: number, imgH: number, opts: ImagesToPdfOptions): PageLayout {
  const m = MARGIN_PT[opts.margin];
  const natW = imgW * PX_TO_PT;
  const natH = imgH * PX_TO_PT;
  if (opts.pageSize === "image") {
    return { pageW: natW + 2 * m, pageH: natH + 2 * m, x: m, y: m, w: natW, h: natH };
  }
  const [a, b] = PAPER[opts.pageSize];
  const landscape = imgW > imgH;
  const pageW = landscape ? b : a;
  const pageH = landscape ? a : b;
  const scale = Math.min((pageW - 2 * m) / natW, (pageH - 2 * m) / natH);
  const w = natW * scale;
  const h = natH * scale;
  return { pageW, pageH, x: (pageW - w) / 2, y: (pageH - h) / 2, w, h };
}

/** One image per page, in the given order. */
export async function imagesToPdf(sources: PdfSource[], opts: ImagesToPdfOptions, onProgress?: (index: number) => void): Promise<PdfOutput> {
  if (sources.length === 0) throw new Error("Add at least one image.");
  const lib = await loadLib();
  const out = await lib.PDFDocument.create();
  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]!;
    onProgress?.(i);
    const kind = detectImageKind(src.bytes);
    if (!kind) throw new PdfInputError(src.name, i, MSG.notImage);
    let img;
    try {
      img = kind === "jpg" ? await out.embedJpg(src.bytes) : await out.embedPng(src.bytes);
    } catch {
      throw new PdfInputError(src.name, i, MSG.badImage);
    }
    const orientation = kind === "jpg" ? jpegOrientation(src.bytes) : 1;
    const sideways = orientation === 6 || orientation === 8;
    const dispW = sideways ? img.height : img.width;
    const dispH = sideways ? img.width : img.height;
    const L = layoutImagePage(dispW, dispH, opts);
    const page = out.addPage([L.pageW, L.pageH]);
    if (orientation === 3) {
      page.drawImage(img, { x: L.x + L.w, y: L.y + L.h, width: L.w, height: L.h, rotate: lib.degrees(180) });
    } else if (orientation === 6) {
      page.drawImage(img, { x: L.x, y: L.y + L.h, width: L.h, height: L.w, rotate: lib.degrees(-90) });
    } else if (orientation === 8) {
      page.drawImage(img, { x: L.x + L.w, y: L.y, width: L.h, height: L.w, rotate: lib.degrees(90) });
    } else {
      page.drawImage(img, { x: L.x, y: L.y, width: L.w, height: L.h });
    }
  }
  const bytes = await out.save();
  return { bytes, pages: out.getPageCount() };
}

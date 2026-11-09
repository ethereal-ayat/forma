import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName, degrees } from "pdf-lib";
import { parsePageSelection, PdfInputError, rotatePdf, splitPdf } from "@/lib/engines/pdf";

async function source() {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= 5; i++) {
    const page = doc.addPage([100 * i, 600]);
    page.drawText(`Page ${i}`);
  }
  doc.getPage(0).setRotation(degrees(270));
  return { name: "sample.pdf", bytes: await doc.save() };
}

describe("PDF page selections", () => {
  it("preserves entered order, accepts en dashes, and removes duplicates", () => {
    expect(parsePageSelection("5, 1–3, 2", 5)).toEqual([4, 0, 1, 2]);
  });
  it.each(["", "0", "6", "3-1", "1,", "1,,2", "-1", "1.5", "1e2", "1-99999999999999999999", "all"])(
    "rejects invalid selection %s",
    (selection) => {
      expect(() => parsePageSelection(selection, 5)).toThrow();
    },
  );
});

describe("Split PDF", () => {
  it("extracts the selected pages in order and preserves content and rotation", async () => {
    const [out] = await splitPdf(await source(), { mode: "extract", selection: "5, 1-2" });
    const doc = await PDFDocument.load(out!.bytes);
    expect(out!.pages).toBe(3);
    expect(doc.getPages().map((p) => p.getWidth())).toEqual([500, 100, 200]);
    expect(doc.getPage(1).getRotation().angle).toBe(270);
    expect(doc.getPages().every((p) => p.node.Contents() !== undefined)).toBe(true);
  });
  it("splits every N pages, including a shorter final document", async () => {
    const results = await splitPdf(await source(), { mode: "every", every: 2 });
    expect(results.map((r) => r.pages)).toEqual([2, 2, 1]);
    expect(results.map((r) => [r.firstPage, r.lastPage])).toEqual([
      [1, 2],
      [3, 4],
      [5, 5],
    ]);
    const widths = await Promise.all(
      results.map(async (r) =>
        (await PDFDocument.load(r.bytes)).getPages().map((p) => p.getWidth()),
      ),
    );
    expect(widths).toEqual([[100, 200], [300, 400], [500]]);
  });
  it("can save every page separately", async () => {
    expect(
      (await splitPdf(await source(), { mode: "every", every: 1 })).map((r) => r.pages),
    ).toEqual([1, 1, 1, 1, 1]);
  });
  it.each([0, -1, 1.5, 6, NaN])("rejects invalid group size %s", async (every) => {
    await expect(splitPdf(await source(), { mode: "every", every })).rejects.toThrow();
  });
});

describe("Rotate PDF", () => {
  it("rotates only selected pages relative to their existing rotation", async () => {
    const src = await source();
    const out = await rotatePdf(src, 90, "1,3");
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 0, 90, 0, 0]);
    expect(doc.getPages().map((p) => p.getWidth())).toEqual([100, 200, 300, 400, 500]);
    expect((await PDFDocument.load(src.bytes)).getPage(0).getRotation().angle).toBe(270);
  });
  it.each([90, 180, 270])("rotates all pages by %s degrees", async (angle) => {
    const out = await rotatePdf(await source(), angle);
    expect(out.pages).toBe(5);
    expect(
      (await PDFDocument.load(out.bytes)).getPages().map((p) => p.getRotation().angle),
    ).toEqual([(270 + angle) % 360, angle, angle, angle, angle]);
  });
  it("rejects unsupported angles and empty selected ranges", async () => {
    await expect(rotatePdf(await source(), 45)).rejects.toThrow();
    await expect(rotatePdf(await source(), 90, "")).rejects.toThrow();
  });
});

describe("PDF input protection", () => {
  it("rejects damaged and encrypted inputs in both tools", async () => {
    const locked = await PDFDocument.create();
    locked.addPage();
    locked.context.trailerInfo.Encrypt = locked.context.obj({
      Filter: PDFName.of("Standard"),
      V: 1,
      R: 2,
      P: -4,
    });
    for (const bytes of [new TextEncoder().encode("not a PDF"), await locked.save()]) {
      const src = { name: "bad.pdf", bytes };
      await expect(splitPdf(src, { mode: "extract", selection: "1" })).rejects.toBeInstanceOf(
        PdfInputError,
      );
      await expect(rotatePdf(src, 90)).rejects.toBeInstanceOf(PdfInputError);
    }
  });
});

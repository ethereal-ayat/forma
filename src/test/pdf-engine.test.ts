// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import { imagesToPdf, jpegOrientation, layoutImagePage, mergePdfs, PdfInputError } from "@/lib/engines/pdf";

const b64 = (s: string) => new Uint8Array(Buffer.from(s, "base64"));
// 30×20 PNG, 40×20 JPG, and a 40×20 JPG tagged EXIF orientation 6 (displays as 20×40).
const PNG = b64("iVBORw0KGgoAAAANSUhEUgAAAB4AAAAUCAYAAACaq43EAAAAJklEQVR4nO3NMQEAMAwDoKzK63yVkQcM8H6yKZhGKhaLxWKxWNxx6OMBp50ioW8AAAAASUVORK5CYII=");
const JPG = b64("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAUACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDxyiiiv3E8wKKKKACiiigAooooAKKKKACiiigD/9k=");
const JPG6 = b64("/9j/4AAQSkZJRgABAQAAAQABAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAAAAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAUACgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCpRRRXwh+aBRRRQAUUUUAFFFFABRRRQAUUUUAf/9k=");

/** A PDF whose pages are all `size`×`size` points, so pages identify their source file. */
async function makePdf(pages: number, size: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([size, size]);
  return doc.save();
}

async function pageWidths(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => Math.round(p.getWidth()));
}

describe("Merge PDF", () => {
  it("keeps every page, in the displayed file order", async () => {
    const a = { name: "a.pdf", bytes: await makePdf(2, 100) };
    const b = { name: "b.pdf", bytes: await makePdf(3, 200) };
    const ab = await mergePdfs([a, b]);
    expect(ab.pages).toBe(5);
    expect(await pageWidths(ab.bytes)).toEqual([100, 100, 200, 200, 200]);
    const ba = await mergePdfs([b, a]);
    expect(await pageWidths(ba.bytes)).toEqual([200, 200, 200, 100, 100]);
  });

  it("refuses password-protected PDFs and names the file", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.context.trailerInfo.Encrypt = doc.context.obj({ Filter: PDFName.of("Standard"), V: 1, R: 2, P: -4 });
    const locked = { name: "locked.pdf", bytes: await doc.save() };
    const ok = { name: "ok.pdf", bytes: await makePdf(1, 100) };
    const err = await mergePdfs([ok, locked]).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PdfInputError);
    expect((err as PdfInputError).fileName).toBe("locked.pdf");
    expect((err as PdfInputError).index).toBe(1);
    expect((err as PdfInputError).message).toMatch(/password/i);
  });

  it("refuses damaged PDFs instead of producing output", async () => {
    const junk = { name: "junk.pdf", bytes: new TextEncoder().encode("not a pdf at all") };
    const ok = { name: "ok.pdf", bytes: await makePdf(1, 100) };
    await expect(mergePdfs([ok, junk])).rejects.toBeInstanceOf(PdfInputError);
    const truncated = { name: "cut.pdf", bytes: (await makePdf(2, 100)).slice(0, 40) };
    await expect(mergePdfs([ok, truncated])).rejects.toBeInstanceOf(PdfInputError);
  });
});

describe("Images to PDF", () => {
  it("puts one JPG and one PNG on two pages, in order, at their own proportions", async () => {
    const out = await imagesToPdf(
      [
        { name: "photo.jpg", bytes: JPG },
        { name: "shot.png", bytes: PNG },
      ],
      { pageSize: "image", margin: "none" },
    );
    expect(out.pages).toBe(2);
    const doc = await PDFDocument.load(out.bytes);
    const sizes = doc.getPages().map((p) => [p.getWidth(), p.getHeight()]);
    expect(sizes).toEqual([
      [30, 15],
      [22.5, 15],
    ]);
  });

  it("fits images inside A4 without cropping and keeps the aspect ratio", () => {
    const L = layoutImagePage(4000, 1000, { pageSize: "a4", margin: "small" });
    expect(L.pageW).toBeCloseTo(841.89); // landscape image → landscape page
    expect(L.w / L.h).toBeCloseTo(4);
    expect(L.x).toBeGreaterThanOrEqual(18 - 1e-6);
    expect(L.x + L.w).toBeLessThanOrEqual(L.pageW - 18 + 1e-6);
    expect(L.y + L.h).toBeLessThanOrEqual(L.pageH - 18 + 1e-6);
  });

  it("follows the camera's rotation tag so phone photos aren't sideways", async () => {
    expect(jpegOrientation(JPG6)).toBe(6);
    expect(jpegOrientation(JPG)).toBe(1);
    const out = await imagesToPdf([{ name: "phone.jpg", bytes: JPG6 }], { pageSize: "image", margin: "none" });
    const page = (await PDFDocument.load(out.bytes)).getPage(0);
    expect([page.getWidth(), page.getHeight()]).toEqual([15, 30]);
  });

  it("rejects files that are not JPG or PNG", async () => {
    const err = await imagesToPdf([{ name: "fake.png", bytes: new Uint8Array([1, 2, 3, 4]) }], { pageSize: "a4", margin: "none" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PdfInputError);
    expect((err as PdfInputError).fileName).toBe("fake.png");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PDFDocument } from "pdf-lib";
import { PdfPageWorkspace } from "@/components/forma/workspaces/PdfPageWorkspace";
import { getTool } from "@/lib/tools";
import { downloadBlob } from "@/lib/download";

vi.mock("@/lib/download", () => ({ downloadBlob: vi.fn() }));
vi.mock("@/lib/settings", () => ({ useSettings: () => ({ settings: { filenameSuffix: "" } }) }));
vi.mock("@/components/forma/ToolDetails", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/forma/ToolDetails")>()),
  PrivacyNote: () => null,
  ToolDetails: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function upload(container: HTMLElement) {
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);
  doc.addPage([200, 200]);
  const bytes = await doc.save();
  const file = new File([bytes as BlobPart], "example.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => bytes.buffer });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByText("example.pdf");
}

describe("PDF page workspace", () => {
  it("extracts, downloads, invalidates old results, and rejects invalid ranges", async () => {
    const { container } = render(<PdfPageWorkspace tool={getTool("split-pdf")!} />);
    await upload(container);
    fireEvent.change(screen.getByLabelText("Pages"), { target: { value: "2" } });
    // The mode selector and action share a label; the action is last in DOM order.
    fireEvent.click(screen.getAllByRole("button", { name: "Extract pages" }).at(-1)!);
    const download = await screen.findByRole("button", { name: "Save example-extracted.pdf" });
    fireEvent.click(download);
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "example-extracted.pdf");
    fireEvent.change(screen.getByLabelText("Pages"), { target: { value: "9" } });
    expect(
      screen.queryByRole("button", { name: "Save example-extracted.pdf" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose pages from 1 to 2");
    expect(screen.getAllByRole("button", { name: "Extract pages" }).at(-1)).toBeDisabled();
  });

  it("creates separate downloads and clears them on start over", async () => {
    const { container } = render(<PdfPageWorkspace tool={getTool("split-pdf")!} />);
    await upload(container);
    fireEvent.click(screen.getByRole("button", { name: "Every N pages" }));
    fireEvent.click(screen.getByRole("button", { name: "Split PDF" }));
    await screen.findByRole("button", { name: "Save example-part-1.pdf" });
    expect(screen.getByRole("button", { name: "Save example-part-2.pdf" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.queryByText("2 PDFs ready")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a PDF to begin" })).toBeDisabled();
  });

  it("rotates and clears the download when its angle changes", async () => {
    const { container } = render(<PdfPageWorkspace tool={getTool("rotate-pdf")!} />);
    await upload(container);
    fireEvent.click(screen.getByRole("button", { name: "Rotate PDF" }));
    await screen.findByRole("button", { name: "Save example-rotated.pdf" });
    fireEvent.click(screen.getByRole("button", { name: "180°" }));
    expect(
      screen.queryByRole("button", { name: "Save example-rotated.pdf" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selected" }));
    expect(screen.getByLabelText("Pages")).toHaveValue("1-2");
  });
});

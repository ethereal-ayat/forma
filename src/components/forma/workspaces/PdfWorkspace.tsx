import { useEffect, useRef, useState, type DragEvent } from "react";
import { ArrowDown, ArrowUp, Check, Download, GripVertical, Loader2, Plus, RotateCcw, Trash2, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { readImageSize } from "@/lib/engines/image";
import { detectImageKind, imagesToPdf, inspectPdf, mergePdfs, PdfInputError, type Margin, type PageSize } from "@/lib/engines/pdf";
import { detectFormat, formatBytes, FORMATS, outputFileName, type FormatId } from "@/lib/formats";
import { downloadBlob } from "@/lib/download";
import { useSettings } from "@/lib/settings";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { DropZone } from "../DropZone";
import { FileIcon } from "../FileIcon";
import { Panel, PrivacyNote, ToolDetails } from "../ToolDetails";
import { Field, Segmented } from "./ImageWorkspace";

type Item = {
  id: string;
  file: File;
  preview?: string | undefined;
  info: string | null;
  checking: boolean;
  problem?: string | undefined;
};

type Result = { blob: Blob; pages: number; name: string; signature: string };

const DRAG_TYPE = "application/x-forma-item";

export function PdfWorkspace({ tool }: { tool: Tool }) {
  const engine = tool.engine?.type === "pdf" ? tool.engine : null;
  const merge = engine?.op === "merge";
  const { settings } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState<Margin>("small");
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const urls = useRef(new Set<string>());

  // Anything that changes the output (files, their order, page settings) invalidates the last result.
  const signature = items.map((i) => i.id).join("|") + (merge ? "" : `#${pageSize}#${margin}`);
  useEffect(() => {
    setResult((r) => (r && r.signature !== signature ? null : r));
    setError(null);
  }, [signature]);

  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      set.clear();
    };
  }, []);

  if (!engine) return null;

  const patch = (id: string, p: Partial<Item>) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const check = async (it: Item) => {
    try {
      const bytes = new Uint8Array(await it.file.arrayBuffer());
      if (merge) {
        const { pages } = await inspectPdf({ name: it.file.name, bytes });
        patch(it.id, { checking: false, info: `${pages} ${pages === 1 ? "page" : "pages"}` });
      } else {
        const dims = detectImageKind(bytes) ? await readImageSize(it.file) : null;
        if (!dims) patch(it.id, { checking: false, problem: "This isn't a readable JPG or PNG image." });
        else patch(it.id, { checking: false, info: `${dims.width}×${dims.height}` });
      }
    } catch (e) {
      patch(it.id, { checking: false, problem: e instanceof PdfInputError ? e.message : "This file couldn't be read." });
    }
  };

  const addFiles = (files: File[]) => {
    const allowed = files.filter((f) => {
      const fmt = detectFormat(f);
      return fmt && tool.from.includes(fmt as FormatId);
    });
    const rejected = files.length - allowed.length;
    if (rejected > 0) {
      toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped`, {
        description: `${tool.name} accepts ${tool.from.map((f) => FORMATS[f].label).join(", ")} only.`,
      });
    }
    const next: Item[] = allowed.map((file) => {
      let preview: string | undefined;
      if (!merge) {
        preview = URL.createObjectURL(file);
        urls.current.add(preview);
      }
      return { id: crypto.randomUUID(), file, preview, info: null, checking: true };
    });
    setItems((l) => [...l, ...next]);
    next.forEach((it) => void check(it));
  };

  const releasePreview = (it: Item) => {
    if (!it.preview) return;
    URL.revokeObjectURL(it.preview);
    urls.current.delete(it.preview);
  };

  const remove = (id: string) =>
    setItems((l) => {
      const it = l.find((i) => i.id === id);
      if (it) releasePreview(it);
      return l.filter((i) => i.id !== id);
    });

  const clear = () => {
    items.forEach(releasePreview);
    setItems([]);
  };

  const move = (from: number, to: number) =>
    setItems((l) => {
      if (to < 0 || to >= l.length || from === to) return l;
      const next = [...l];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it!);
      return next;
    });

  const onDragOver = (e: DragEvent, overId: string) => {
    if (!dragId || !e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    if (overId === dragId) return;
    move(
      items.findIndex((i) => i.id === dragId),
      items.findIndex((i) => i.id === overId),
    );
  };

  const checking = items.some((i) => i.checking);
  const problems = items.filter((i) => i.problem).length;
  const minFiles = merge ? 2 : 1;
  const unit = merge ? "PDF" : "image";

  const blocker = busy
    ? null
    : items.length === 0
      ? "Add files to begin"
      : items.length < minFiles
        ? `Add at least ${minFiles} PDFs`
        : checking
          ? "Checking files…"
          : problems
            ? `Remove ${problems === 1 ? "the file" : `${problems} files`} with a problem`
            : null;

  const run = async () => {
    if (blocker) return;
    const runSignature = signature;
    const list = items;
    setBusy(true);
    setResult(null);
    setError(null);
    setCurrent(0);
    try {
      const sources = await Promise.all(list.map(async (i) => ({ name: i.file.name, bytes: new Uint8Array(await i.file.arrayBuffer()) })));
      const out = merge ? await mergePdfs(sources, setCurrent) : await imagesToPdf(sources, { pageSize, margin }, setCurrent);
      const base = list.length === 1 ? list[0]!.file.name : merge ? "merged.pdf" : "images.pdf";
      setResult({
        blob: new Blob([out.bytes as BlobPart], { type: "application/pdf" }),
        pages: out.pages,
        name: outputFileName(base, "pdf", settings.filenameSuffix),
        signature: runSignature,
      });
      toast.success("PDF ready", { description: `${out.pages} ${out.pages === 1 ? "page" : "pages"} — save it to your device.` });
    } catch (e) {
      if (e instanceof PdfInputError) {
        const it = list[e.index];
        if (it) patch(it.id, { problem: e.message });
        setError(`“${e.fileName}”: ${e.message}`);
      } else {
        setError("Something went wrong while building the PDF, so nothing was created. Try again, or remove the most recent file.");
      }
    } finally {
      setBusy(false);
      setCurrent(null);
    }
  };

  const label = busy
    ? `${merge ? "Adding" : "Placing"} ${unit} ${(current ?? 0) + 1} of ${items.length}…`
    : (blocker ?? (merge ? `Merge ${items.length} PDFs` : `Create PDF from ${items.length} ${items.length === 1 ? "image" : "images"}`));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {items.length === 0 ? (
          <Panel>
            <DropZone formats={tool.from} multiple onFiles={addFiles} />
          </Panel>
        ) : (
          <Panel
            title={`${items.length} ${items.length === 1 ? "file" : "files"} · combined top to bottom`}
            action={
              <button onClick={clear} disabled={busy} className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
                <RotateCcw className="size-3.5" /> Start over
              </button>
            }
          >
            <ol className="-my-1 divide-y divide-border">
              {items.map((it, idx) => (
                <li
                  key={it.id}
                  draggable={!busy}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, it.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(it.id);
                  }}
                  onDragOver={(e) => onDragOver(e, it.id)}
                  onDrop={(e) => {
                    if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault();
                  }}
                  onDragEnd={() => setDragId(null)}
                  className={cn("animate-rise flex items-center gap-2.5 py-3 transition-opacity", dragId === it.id && "opacity-50")}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <GripVertical className="hidden size-4 shrink-0 cursor-grab text-muted-foreground/60 sm:block" aria-hidden />
                  <span className="w-5 shrink-0 text-center font-mono text-[12px] text-muted-foreground tabular">{idx + 1}</span>
                  <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--hairline)]">
                    {it.preview ? <img src={it.preview} alt="" className="size-full object-contain" /> : <FileIcon format="pdf" size="sm" />}
                    {(it.checking || (busy && current === idx)) && (
                      <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                        <Loader2 className="size-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-card-foreground">{it.file.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11.5px] text-muted-foreground tabular">
                      <span>{formatBytes(it.file.size)}</span>
                      {it.info && <span>{it.info}</span>}
                      {it.checking && <span>checking…</span>}
                    </p>
                    {it.problem && (
                      <p className="mt-1 flex items-start gap-1 text-[12px] text-destructive">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {it.problem}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button onClick={() => move(idx, idx - 1)} disabled={busy || idx === 0} aria-label={`Move ${it.file.name} up`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-subtle hover:text-foreground disabled:opacity-30">
                      <ArrowUp className="size-4" />
                    </button>
                    <button onClick={() => move(idx, idx + 1)} disabled={busy || idx === items.length - 1} aria-label={`Move ${it.file.name} down`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-subtle hover:text-foreground disabled:opacity-30">
                      <ArrowDown className="size-4" />
                    </button>
                    <button onClick={() => remove(it.id)} disabled={busy} aria-label={`Remove ${it.file.name}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-subtle hover:text-destructive disabled:opacity-40">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <DropZone formats={tool.from} multiple compact onFiles={addFiles} disabled={busy} className="mt-3" />
          </Panel>
        )}

        {busy && (
          <div className="h-1 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={(current ?? 0) + 1}>
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(((current ?? 0) + 1) / Math.max(items.length, 1)) * 100}%` }} />
          </div>
        )}

        {error && (
          <div role="alert" className="animate-rise flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-[13px] text-destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">No PDF was created</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-rise flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card sm:flex-row sm:items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ready-soft text-ready">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-card-foreground">{result.name}</p>
              <p className="font-mono text-[12px] text-muted-foreground tabular">
                {result.pages} {result.pages === 1 ? "page" : "pages"} · {formatBytes(result.blob.size)}
              </p>
            </div>
            <button
              onClick={() => downloadBlob(result.blob, result.name)}
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="size-4" /> Save PDF
            </button>
          </div>
        )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-10 lg:self-start">
        <Panel title="Options">
          <div className="space-y-5">
            {!merge && (
              <>
                <Field label="Page size">
                  <Segmented<PageSize>
                    value={pageSize}
                    onChange={setPageSize}
                    options={[
                      { value: "a4", label: "A4" },
                      { value: "letter", label: "Letter" },
                      { value: "image", label: "Image size" },
                    ]}
                  />
                </Field>
                <Field label="Margins">
                  <Segmented<Margin>
                    value={margin}
                    onChange={setMargin}
                    options={[
                      { value: "none", label: "None" },
                      { value: "small", label: "Small" },
                      { value: "large", label: "Large" },
                    ]}
                  />
                </Field>
              </>
            )}
            <Field label="Output">
              <div className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2 shadow-[inset_0_0_0_1px_var(--hairline)]">
                <FileIcon format="pdf" size="xs" />
                <span className="text-[13px] font-medium text-card-foreground">One {FORMATS.pdf.name}</span>
              </div>
            </Field>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              {merge
                ? "Pages are combined in the order shown. Drag files, or use the arrows, to change it."
                : "Each image gets its own page, scaled to fit without cropping. Pages turn sideways for wide images."}
            </p>
            <button
              onClick={() => void run()}
              disabled={busy || !!blocker}
              className="relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.18)] transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy && <span className="animate-sheen absolute inset-0" />}
              {busy ? <Loader2 className="size-4 animate-spin" /> : items.length ? <Wand2 className="size-4" /> : <Plus className="size-4" />}
              {label}
            </button>
          </div>
        </Panel>
        <PrivacyNote />
        <ToolDetails tool={tool} />
      </aside>
    </div>
  );
}

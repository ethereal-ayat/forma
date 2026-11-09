import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Check, Download, Loader2, Plus, RotateCcw, Trash2, TriangleAlert, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { convertImage, outputForFile, readImageSize, type ImageOutput } from "@/lib/engines/image";
import { detectFormat, formatBytes, FORMATS, outputFileName, type FormatId } from "@/lib/formats";
import { downloadBlob } from "@/lib/download";
import { useSettings } from "@/lib/settings";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { DropZone } from "../DropZone";
import { FileIcon } from "../FileIcon";
import { Panel, PrivacyNote, ToolDetails } from "../ToolDetails";

type Item = {
  id: string;
  file: File;
  preview: string;
  dims: { width: number; height: number } | null;
  state: "queued" | "working" | "done" | "error";
  result?: { blob: Blob; width: number; height: number; output: ImageOutput };
  error?: string | undefined;
};

type OutputChoice = ImageOutput | "keep";

const SWATCHES = [
  { value: "#ffffff", label: "White" },
  { value: "#000000", label: "Black" },
  { value: "#f4f1ea", label: "Paper" },
];

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-lg bg-subtle p-0.5 shadow-[inset_0_0_0_1px_var(--hairline)]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-all duration-200",
            value === o.value && "bg-card text-foreground shadow-card",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-medium text-card-foreground">{label}</span>
        {hint && <span className="font-mono text-[12px] text-muted-foreground tabular">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function ImageWorkspace({ tool }: { tool: Tool }) {
  const engine = tool.engine?.type === "image" ? tool.engine : null;
  const { settings } = useSettings();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [quality, setQuality] = useState(settings.imageQuality);
  const [background, setBackground] = useState(settings.jpgBackground);
  const isSvg = tool.from.includes("svg");
  const [width, setWidth] = useState(isSvg ? 1024 : 1200);
  const [choice, setChoice] = useState<OutputChoice>(engine?.mode === "compress" ? "keep" : "keep");
  const urls = useRef(new Set<string>());

  useEffect(() => setQuality(settings.imageQuality), [settings.imageQuality]);
  useEffect(() => setBackground(settings.jpgBackground), [settings.jpgBackground]);

  useEffect(() => {
    const set = urls.current;
    return () => {
      set.forEach((u) => URL.revokeObjectURL(u));
      set.clear();
    };
  }, []);

  if (!engine) return null;
  const fixedOutput = engine.output === "auto" ? null : engine.output;
  const showResize = engine.mode === "resize";

  const outputFor = (file: File): ImageOutput => {
    if (fixedOutput) return fixedOutput;
    return choice === "keep" ? outputForFile(file) : choice;
  };

  const anyLossy = items.length === 0 ? fixedOutput !== "png" : items.some((i) => outputFor(i.file) !== "png");
  const anyJpg = fixedOutput === "jpg" || choice === "jpg" || (choice === "keep" && items.some((i) => i.file.type === "image/jpeg"));

  const addFiles = async (files: File[]) => {
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
    const next: Item[] = await Promise.all(
      allowed.map(async (file) => {
        const preview = URL.createObjectURL(file);
        urls.current.add(preview);
        return { id: crypto.randomUUID(), file, preview, dims: await readImageSize(file), state: "queued" as const };
      }),
    );
    setItems((list) => (tool.multiple ? [...list, ...next] : next.slice(0, 1)));
  };

  const remove = (id: string) => {
    setItems((list) => {
      const it = list.find((i) => i.id === id);
      if (it) {
        URL.revokeObjectURL(it.preview);
        urls.current.delete(it.preview);
      }
      return list.filter((i) => i.id !== id);
    });
  };

  const clear = () => {
    items.forEach((i) => {
      URL.revokeObjectURL(i.preview);
      urls.current.delete(i.preview);
    });
    setItems([]);
  };

  const convertAll = async () => {
    setBusy(true);
    let ok = 0;
    for (const it of items) {
      setItems((l) => l.map((x) => (x.id === it.id ? { ...x, state: "working", error: undefined } : x)));
      try {
        const output = outputFor(it.file);
        const res = await convertImage(it.file, {
          output,
          quality: quality / 100,
          width: showResize ? Math.min(width, 8192) : undefined,
          background,
        });
        ok++;
        setItems((l) => l.map((x) => (x.id === it.id ? { ...x, state: "done", result: { ...res, output } } : x)));
      } catch (e) {
        setItems((l) => l.map((x) => (x.id === it.id ? { ...x, state: "error", error: (e as Error).message } : x)));
      }
    }
    setBusy(false);
    if (ok) toast.success(`${ok} image${ok > 1 ? "s" : ""} converted`, { description: "Ready to save to your device." });
  };

  const save = (it: Item) => {
    if (!it.result) return;
    downloadBlob(it.result.blob, outputFileName(it.file.name, it.result.output, settings.filenameSuffix));
  };

  const done = items.filter((i) => i.state === "done");
  const totals = useMemo(() => {
    const before = done.reduce((s, i) => s + i.file.size, 0);
    const after = done.reduce((s, i) => s + (i.result?.blob.size ?? 0), 0);
    return { before, after };
  }, [done]);

  const outputLabel = fixedOutput ? FORMATS[fixedOutput].label : choice === "keep" ? "original format" : FORMATS[choice].label;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        {items.length === 0 ? (
          <Panel>
            <DropZone formats={tool.from} multiple={tool.multiple} onFiles={addFiles} />
          </Panel>
        ) : (
          <Panel
            title={`${items.length} ${items.length === 1 ? "file" : "files"}`}
            action={
              <button onClick={clear} disabled={busy} className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50">
                <RotateCcw className="size-3.5" /> Start over
              </button>
            }
          >
            <ul className="-my-1 divide-y divide-border">
              {items.map((it, idx) => {
                const r = it.result;
                const delta = r ? (r.blob.size - it.file.size) / it.file.size : 0;
                return (
                  <li key={it.id} className="animate-rise flex items-center gap-3 py-3" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--hairline)]">
                      <img src={it.preview} alt="" className="size-full object-cover" />
                      {it.state === "working" && (
                        <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                          <Loader2 className="size-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-card-foreground">{it.file.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[11.5px] text-muted-foreground tabular">
                        <span>{formatBytes(it.file.size)}</span>
                        {it.dims && <span>{it.dims.width}×{it.dims.height}</span>}
                        {r && (
                          <>
                            <span className="text-muted-foreground/60">→</span>
                            <span className="text-foreground">{formatBytes(r.blob.size)}</span>
                            <span>{r.width}×{r.height}</span>
                            <span className={cn(delta <= 0 ? "text-ready" : "text-dev")}>
                              {delta <= 0 ? "−" : "+"}
                              {Math.abs(Math.round(delta * 100))}%
                            </span>
                          </>
                        )}
                      </p>
                      {it.state === "error" && (
                        <p className="mt-1 flex items-center gap-1 text-[12px] text-destructive">
                          <TriangleAlert className="size-3.5" /> {it.error}
                        </p>
                      )}
                      {r && delta > 0 && engine.mode === "compress" && (
                        <p className="mt-1 text-[12px] text-dev">Already well optimised — try WebP for a smaller file.</p>
                      )}
                    </div>
                    {r ? (
                      <button
                        onClick={() => save(it)}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <Download className="size-3.5" /> <span className="hidden sm:inline">Save</span> <span className="uppercase">{r.output}</span>
                      </button>
                    ) : (
                      <button onClick={() => remove(it.id)} disabled={busy} aria-label={`Remove ${it.file.name}`} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-subtle hover:text-destructive disabled:opacity-40">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
            {tool.multiple && <DropZone formats={tool.from} multiple compact onFiles={addFiles} disabled={busy} className="mt-3" />}
          </Panel>
        )}

        {done.length > 0 && (
          <div className="animate-rise flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card sm:flex-row sm:items-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ready-soft text-ready">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-card-foreground">
                {done.length} of {items.length} converted
              </p>
              <p className="font-mono text-[12px] text-muted-foreground tabular">
                {formatBytes(totals.before)} → {formatBytes(totals.after)}
                {totals.before > 0 && totals.after < totals.before && ` · saved ${Math.round((1 - totals.after / totals.before) * 100)}%`}
              </p>
            </div>
            {done.length > 1 && (
              <button
                onClick={() => done.forEach((it, i) => setTimeout(() => save(it), i * 250))}
                className="flex h-9 items-center justify-center gap-2 rounded-lg bg-secondary px-3.5 text-[13px] font-medium text-secondary-foreground shadow-[inset_0_0_0_1px_var(--hairline)] hover:bg-muted"
              >
                <ArrowDown className="size-4" /> Save all
              </button>
            )}
          </div>
        )}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-10 lg:self-start">
        <Panel title="Options">
          <div className="space-y-5">
            {!fixedOutput && (
              <Field label="Output format">
                <Segmented<OutputChoice>
                  value={choice}
                  onChange={setChoice}
                  options={[
                    { value: "keep", label: "Original" },
                    { value: "jpg", label: "JPG" },
                    { value: "png", label: "PNG" },
                    { value: "webp", label: "WebP" },
                  ]}
                />
              </Field>
            )}
            {fixedOutput && (
              <Field label="Output format">
                <div className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2 shadow-[inset_0_0_0_1px_var(--hairline)]">
                  <FileIcon format={fixedOutput} size="xs" />
                  <span className="text-[13px] font-medium text-card-foreground">{FORMATS[fixedOutput].name}</span>
                </div>
              </Field>
            )}

            {showResize && (
              <Field label="Width" hint={`${width} px`}>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={16}
                    max={8192}
                    value={width}
                    onChange={(e) => setWidth(Math.max(16, Math.min(8192, Number(e.target.value) || 16)))}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-[13px] tabular outline-none focus:border-ring"
                  />
                  <span className="text-[12px] text-muted-foreground">px</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(isSvg ? [512, 1024, 2048, 4096] : [640, 1080, 1600, 2400]).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWidth(w)}
                      className={cn(
                        "rounded-md px-2 py-1 font-mono text-[11.5px] tabular transition-colors",
                        width === w ? "bg-accent text-accent-foreground" : "bg-subtle text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] text-muted-foreground">Height adjusts automatically to keep proportions.</p>
              </Field>
            )}

            {anyLossy && (
              <Field label="Quality" hint={`${quality}%`}>
                <Slider value={[quality]} min={40} max={100} step={1} onValueChange={(v) => setQuality(v[0] ?? quality)} />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Smaller file</span>
                  <span>Better detail</span>
                </div>
              </Field>
            )}

            {anyJpg && (
              <Field label="Background for transparent areas">
                <div className="flex gap-2">
                  {SWATCHES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setBackground(s.value)}
                      aria-label={s.label}
                      title={s.label}
                      className={cn(
                        "size-7 rounded-full shadow-[inset_0_0_0_1px_var(--hairline)] ring-offset-2 ring-offset-card transition-shadow",
                        background === s.value && "ring-2 ring-primary",
                      )}
                      style={{ backgroundColor: s.value }}
                    />
                  ))}
                </div>
              </Field>
            )}

            <button
              onClick={convertAll}
              disabled={busy || items.length === 0}
              className="relative flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.18)] transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy && <span className="animate-sheen absolute inset-0" />}
              {busy ? <Loader2 className="size-4 animate-spin" /> : items.length ? <Wand2 className="size-4" /> : <Plus className="size-4" />}
              {busy ? "Converting…" : items.length ? `Convert ${items.length > 1 ? `${items.length} files` : "file"} to ${outputLabel}` : "Add files to begin"}
            </button>
          </div>
        </Panel>
        <PrivacyNote />
        <ToolDetails tool={tool} />
      </aside>
    </div>
  );
}

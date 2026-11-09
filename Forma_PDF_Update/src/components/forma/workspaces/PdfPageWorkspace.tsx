import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, RotateCcw, TriangleAlert, Wand2 } from "lucide-react";
import {
  inspectPdf,
  parsePageSelection,
  rotatePdf,
  splitPdf,
  type PdfSource,
} from "@/lib/engines/pdf";
import { downloadBlob } from "@/lib/download";
import { formatBytes, outputFileName } from "@/lib/formats";
import { useSettings } from "@/lib/settings";
import type { Tool } from "@/lib/tools";
import { DropZone } from "../DropZone";
import { FileIcon } from "../FileIcon";
import { Panel, PrivacyNote, ToolDetails } from "../ToolDetails";
import { Field, Segmented } from "./ImageWorkspace";

type Input = { source: PdfSource; pages: number; size: number };
type Result = { blob: Blob; name: string; pages: number };
const inputClass =
  "h-10 w-full rounded-lg border border-input bg-surface px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function PdfPageWorkspace({ tool }: { tool: Tool }) {
  const rotate = tool.engine?.type === "pdf" && tool.engine.op === "rotate";
  const { settings } = useSettings();
  const [input, setInput] = useState<Input | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"extract" | "every">("extract");
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [selection, setSelection] = useState("");
  const [every, setEvery] = useState("1");
  const [angle, setAngle] = useState<"90" | "180" | "270">("90");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const revision = useRef(0);
  useEffect(
    () => () => {
      revision.current++;
    },
    [],
  );

  const invalidate = () => {
    revision.current++;
    setResults([]);
    setError(null);
  };

  const addFiles = async (files: File[]) => {
    const file = files[0];
    if (!file || busy) return;
    invalidate();
    const token = revision.current;
    setInput(null);
    setLoading(true);
    try {
      const source = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
      const { pages } = await inspectPdf(source);
      if (token !== revision.current) return;
      setInput({ source, pages, size: file.size });
      setSelection(pages === 1 ? "1" : `1-${pages}`);
    } catch (e) {
      if (token === revision.current)
        setError(e instanceof Error ? e.message : "This PDF couldn't be read.");
    } finally {
      if (token === revision.current) setLoading(false);
    }
  };

  let validation: string | null = null;
  if (input) {
    try {
      if ((rotate && scope === "selected") || (!rotate && mode === "extract"))
        parsePageSelection(selection, input.pages);
      if (
        !rotate &&
        mode === "every" &&
        (!/^\d+$/.test(every) ||
          !Number.isSafeInteger(Number(every)) ||
          Number(every) < 1 ||
          Number(every) > input.pages)
      ) {
        throw new Error(`Choose a whole number from 1 to ${input.pages}.`);
      }
    } catch (e) {
      validation = (e as Error).message;
    }
  }

  const run = async () => {
    if (!input || loading || busy || validation) return;
    const token = revision.current;
    setBusy(true);
    setResults([]);
    setError(null);
    setProgress(0);
    try {
      const outputs = rotate
        ? [await rotatePdf(input.source, Number(angle), scope === "all" ? undefined : selection)]
        : await splitPdf(
            input.source,
            mode === "extract" ? { mode, selection } : { mode, every: Number(every) },
            (done, total) => {
              if (token === revision.current) setProgress(Math.round((done / total) * 100));
            },
          );
      if (token !== revision.current) return;
      const stem = input.source.name.replace(/\.pdf$/i, "");
      setResults(
        outputs.map((out, index) => ({
          blob: new Blob([out.bytes as BlobPart], { type: "application/pdf" }),
          pages: out.pages,
          name: outputFileName(
            `${stem}-${rotate ? "rotated" : mode === "extract" ? "extracted" : `part-${index + 1}`}.pdf`,
            "pdf",
            settings.filenameSuffix,
          ),
        })),
      );
      setProgress(100);
    } catch (e) {
      if (token === revision.current)
        setError(
          e instanceof Error ? e.message : "The PDF couldn't be processed. Try another file.",
        );
    } finally {
      if (token === revision.current) setBusy(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Panel
          title={input ? "Your PDF" : "Upload PDF"}
          action={
            input && (
              <button
                disabled={busy}
                onClick={() => {
                  invalidate();
                  setInput(null);
                }}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" /> Start over
              </button>
            )
          }
        >
          {input ? (
            <div className="flex items-center gap-3">
              <FileIcon format="pdf" size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium">{input.source.name}</p>
                <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {input.pages} {input.pages === 1 ? "page" : "pages"} · {formatBytes(input.size)}
                </p>
              </div>
            </div>
          ) : (
            <DropZone
              formats={["pdf"]}
              onFiles={(files) => void addFiles(files)}
              disabled={loading || busy}
            />
          )}
          {loading && (
            <p
              role="status"
              className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground"
            >
              <Loader2 className="size-4 animate-spin" /> Checking PDF…
            </p>
          )}
        </Panel>
        {busy && (
          <p role="status" className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />{" "}
            {rotate ? "Rotating pages…" : `Creating PDFs… ${progress}%`}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-[13px] text-destructive"
          >
            <TriangleAlert className="size-4 shrink-0" />
            <div>
              <p className="font-semibold">No PDF was created</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}
        {results.length > 0 && (
          <Panel title={`${results.length} ${results.length === 1 ? "PDF ready" : "PDFs ready"}`}>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.name}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3"
                >
                  <Check className="size-4 text-ready" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{result.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {result.pages} {result.pages === 1 ? "page" : "pages"} ·{" "}
                      {formatBytes(result.blob.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => downloadBlob(result.blob, result.name)}
                    aria-label={`Save ${result.name}`}
                    className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground"
                  >
                    <Download className="size-4" /> Save PDF
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
      <aside className="space-y-5 lg:sticky lg:top-10 lg:self-start">
        <Panel title="Options">
          <fieldset disabled={busy || loading} className="space-y-5 disabled:opacity-60">
            {rotate ? (
              <>
                <Field label="Rotate clockwise">
                  <Segmented
                    value={angle}
                    onChange={(value: typeof angle) => {
                      invalidate();
                      setAngle(value);
                    }}
                    options={[
                      { value: "90", label: "90°" },
                      { value: "180", label: "180°" },
                      { value: "270", label: "270°" },
                    ]}
                  />
                </Field>
                <Field label="Apply to">
                  <Segmented
                    value={scope}
                    onChange={(value: typeof scope) => {
                      invalidate();
                      setScope(value);
                    }}
                    options={[
                      { value: "all", label: "All pages" },
                      { value: "selected", label: "Selected" },
                    ]}
                  />
                </Field>
              </>
            ) : (
              <Field label="Split mode">
                <Segmented
                  value={mode}
                  onChange={(value: typeof mode) => {
                    invalidate();
                    setMode(value);
                  }}
                  options={[
                    { value: "extract", label: "Extract pages" },
                    { value: "every", label: "Every N pages" },
                  ]}
                />
              </Field>
            )}
            {((rotate && scope === "selected") || (!rotate && mode === "extract")) && (
              <Field label="Pages">
                <input
                  aria-label="Pages"
                  aria-describedby="page-help"
                  value={selection}
                  onChange={(e) => {
                    invalidate();
                    setSelection(e.target.value);
                  }}
                  placeholder="1-3, 5"
                  className={inputClass}
                />
                <p id="page-help" className="mt-2 text-[12px] text-muted-foreground">
                  Use page numbers and ranges, like 1-3, 5.{" "}
                  {rotate
                    ? "Other pages stay unchanged."
                    : "Creates one PDF in the order entered; repeated pages are included once."}
                </p>
              </Field>
            )}
            {!rotate && mode === "every" && (
              <Field label="Pages per file">
                <input
                  aria-label="Pages per file"
                  type="number"
                  min="1"
                  max={input?.pages}
                  step="1"
                  value={every}
                  onChange={(e) => {
                    invalidate();
                    setEvery(e.target.value);
                  }}
                  className={inputClass}
                />
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Use 1 to save each page separately. The last PDF may contain fewer pages. Save
                  each result individually.
                </p>
              </Field>
            )}
            {validation && (
              <p role="alert" className="text-[12px] text-destructive">
                {validation}
              </p>
            )}
            <button
              onClick={() => void run()}
              disabled={!input || busy || loading || !!validation}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13.5px] font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {busy
                ? "Processing…"
                : !input
                  ? "Add a PDF to begin"
                  : rotate
                    ? "Rotate PDF"
                    : mode === "extract"
                      ? "Extract pages"
                      : "Split PDF"}
            </button>
          </fieldset>
        </Panel>
        <PrivacyNote />
        <ToolDetails tool={tool} />
      </aside>
    </div>
  );
}

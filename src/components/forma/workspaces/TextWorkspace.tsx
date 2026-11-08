import { useMemo, useRef, useState } from "react";
import { Copy, Download, FileUp, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { runTextTransform, TEXT_OUTPUT, type TextOptions } from "@/lib/engines/text";
import { acceptAttr, outputFileName } from "@/lib/formats";
import { downloadBlob } from "@/lib/download";
import { useSettings } from "@/lib/settings";
import type { Tool } from "@/lib/tools";
import { Panel, PrivacyNote, ToolDetails } from "../ToolDetails";

const SAMPLES: Record<string, string> = {
  "csv-to-json": 'id,name,team,active\n1,Ana Silva,Design,true\n2,"Lee, Jordan",Engineering,false\n3,Priya Nair,Product,true',
  "json-to-csv": '[{"id":1,"name":"Ana Silva","team":{"name":"Design","floor":3}},{"id":2,"name":"Jordan Lee","team":{"name":"Engineering","floor":4}}]',
  "json-format": '{"project":"Forma","version":"0.1","engines":["image","data"],"offline":true}',
  "md-to-html": "# Release notes\n\nForma **0.1** ships with:\n\n- Image conversion\n- CSV ↔ JSON\n\n| Engine | Status |\n| --- | --- |\n| Images | Ready |",
  "html-to-text": "<h1>Welcome</h1><p>Your files stay <strong>on your device</strong>.</p><ul><li>No uploads</li><li>No accounts</li></ul>",
};

export function TextWorkspace({ tool }: { tool: Tool }) {
  const engine = tool.engine?.type === "text" ? tool.engine : null;
  const { settings } = useSettings();
  const [input, setInput] = useState("");
  const [name, setName] = useState("forma-output");
  const [opts, setOpts] = useState<TextOptions>({ indent: 2, typed: true, delimiter: ",", fullDocument: false });
  const fileRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    if (!engine || !input.trim()) return { output: "", error: "" };
    try {
      return { output: runTextTransform(engine.transform, input, opts, name), error: "" };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [engine, input, opts, name]);

  if (!engine) return null;
  const out = TEXT_OUTPUT[engine.transform];

  const load = async (file: File | undefined) => {
    if (!file) return;
    setInput(await file.text());
    setName(file.name);
  };

  const area = "h-72 w-full resize-y rounded-xl border border-input bg-surface p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:border-ring";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Input"
          action={
            <div className="flex gap-3 text-[12.5px] font-medium">
              <button onClick={() => setInput(SAMPLES[engine.transform] ?? "")} className="text-muted-foreground hover:text-foreground">Sample</button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-primary"><FileUp className="size-3.5" /> Open file</button>
            </div>
          }
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void load(e.dataTransfer.files[0]);
            }}
            placeholder="Paste content here, or drop a file"
            className={area}
          />
          <input ref={fileRef} type="file" className="sr-only" accept={acceptAttr(tool.from)} onChange={(e) => void load(e.target.files?.[0])} />
        </Panel>
        <Panel
          title="Output"
          action={
            <div className="flex gap-3 text-[12.5px] font-medium">
              <button disabled={!result.output} onClick={() => { void navigator.clipboard.writeText(result.output); toast.success("Copied"); }} className="flex items-center gap-1 text-muted-foreground hover:text-foreground disabled:opacity-40"><Copy className="size-3.5" /> Copy</button>
              <button disabled={!result.output} onClick={() => downloadBlob(new Blob([result.output], { type: out.mime }), outputFileName(name, out.ext, settings.filenameSuffix))} className="flex items-center gap-1 text-primary disabled:opacity-40"><Download className="size-3.5" /> Save</button>
            </div>
          }
        >
          {result.error ? (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" /> {result.error}</p>
          ) : (
            <textarea readOnly value={result.output} placeholder="Converted result appears here instantly" className={area} />
          )}
        </Panel>
      </div>
      <aside className="space-y-5">
        <Panel title="Options">
          <div className="space-y-3 text-[13px]">
            {(engine.transform === "csv-to-json" || engine.transform === "json-format") && (
              <label className="flex items-center justify-between">
                Indentation
                <select value={String(opts.indent)} onChange={(e) => setOpts({ ...opts, indent: e.target.value === "minify" ? "minify" : Number(e.target.value) })} className="rounded-md border border-input bg-background px-2 py-1">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  {engine.transform === "json-format" && <option value="minify">Minify</option>}
                </select>
              </label>
            )}
            {engine.transform === "csv-to-json" && (
              <label className="flex items-center justify-between">
                Detect numbers and true/false
                <input type="checkbox" checked={opts.typed ?? true} onChange={(e) => setOpts({ ...opts, typed: e.target.checked })} />
              </label>
            )}
            {engine.transform === "json-to-csv" && (
              <label className="flex items-center justify-between">
                Separator
                <select value={opts.delimiter} onChange={(e) => setOpts({ ...opts, delimiter: e.target.value })} className="rounded-md border border-input bg-background px-2 py-1">
                  <option value=",">Comma</option>
                  <option value=";">Semicolon</option>
                  <option value={"\t"}>Tab</option>
                </select>
              </label>
            )}
            {engine.transform === "md-to-html" && (
              <label className="flex items-center justify-between">
                Full web page
                <input type="checkbox" checked={opts.fullDocument ?? false} onChange={(e) => setOpts({ ...opts, fullDocument: e.target.checked })} />
              </label>
            )}
            {engine.transform === "html-to-text" && <p className="text-muted-foreground">No options needed — paste HTML and copy the text.</p>}
          </div>
        </Panel>
        <PrivacyNote />
        <ToolDetails tool={tool} />
      </aside>
    </div>
  );
}

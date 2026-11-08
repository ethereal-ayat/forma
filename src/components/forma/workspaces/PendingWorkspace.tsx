import { Link } from "@tanstack/react-router";
import { Check, Hammer, CalendarClock } from "lucide-react";
import { TOOLS, type Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { DropZone } from "../DropZone";
import { Panel, ToolDetails } from "../ToolDetails";
import { FormatPair } from "../FileIcon";

const PHASES = [
  { n: 1, title: "Images & data", note: "Browser-native engines" },
  { n: 2, title: "PDF & HEIC", note: "WebAssembly engines" },
  { n: 3, title: "Office & spreadsheets", note: "Local document parsers" },
];

export function PendingWorkspace({ tool }: { tool: Tool }) {
  const isDev = tool.status === "development";
  const alternatives = TOOLS.filter((t) => t.status === "ready" && (t.category === tool.category || t.from.some((f) => tool.from.includes(f)))).slice(0, 3);
  const fallback = alternatives.length ? alternatives : TOOLS.filter((t) => t.status === "ready").slice(0, 3);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Panel>
          <div className="relative">
            <DropZone formats={tool.from} multiple={tool.multiple} disabled onFiles={() => {}} />
            <div className="absolute inset-0 grid place-items-center p-4">
              <div className="max-w-sm rounded-2xl bg-popover/95 p-5 text-center shadow-window backdrop-blur-xl">
                <span className={cn("mx-auto grid size-10 place-items-center rounded-full", isDev ? "bg-dev-soft text-dev" : "bg-planned-soft text-planned")}>
                  {isDev ? <Hammer className="size-5" /> : <CalendarClock className="size-5" />}
                </span>
                <h2 className="mt-3 text-[15px] font-semibold text-popover-foreground">
                  {isDev ? "This engine is being built" : `Planned for Phase ${tool.phase}`}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Forma doesn't fake conversions. {tool.name} will run on your device with {tool.engineName} once it
                  ships in Phase {tool.phase}. Until then, file intake is switched off.
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {tool.plannedOptions && (
          <Panel title="What you'll be able to adjust">
            <ul className="grid gap-2 sm:grid-cols-2">
              {tool.plannedOptions.map((o) => (
                <li key={o} className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-[13px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)]">
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                  {o}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel title="Ready to use now">
          <ul className="-my-1 divide-y divide-border">
            {fallback.map((t) => (
              <li key={t.id}>
                <Link to="/tools/$toolId" params={{ toolId: t.id }} className="group flex items-center gap-3 py-2.5">
                  <FormatPair from={t.from} to={t.to} size="xs" />
                  <span className="flex-1 text-[13.5px] font-medium text-card-foreground">{t.name}</span>
                  <span className="text-[12px] text-muted-foreground transition-transform group-hover:translate-x-0.5">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <aside className="space-y-5">
        <ToolDetails tool={tool} />
        <Panel title="Roadmap">
          <ol className="relative space-y-4 pl-6">
            <span className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
            {PHASES.map((p) => {
              const done = p.n === 1;
              const current = p.n === tool.phase;
              return (
                <li key={p.n} className="relative">
                  <span
                    className={cn(
                      "absolute -left-6 top-0.5 grid size-[15px] place-items-center rounded-full border-2 bg-card",
                      done ? "border-ready bg-ready text-primary-foreground" : current ? "border-primary" : "border-border",
                    )}
                  >
                    {done && <Check className="size-2.5" strokeWidth={3.5} />}
                  </span>
                  <p className={cn("text-[13px] font-medium", current ? "text-primary" : "text-card-foreground")}>
                    Phase {p.n} · {p.title}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {done ? "Available now" : current ? `${p.note} — includes this tool` : p.note}
                  </p>
                </li>
              );
            })}
          </ol>
        </Panel>
      </aside>
    </div>
  );
}

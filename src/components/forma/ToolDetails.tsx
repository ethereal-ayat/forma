import { Cpu, HardDrive, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FORMATS } from "@/lib/formats";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

export function Panel({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-semibold tracking-[-0.005em] text-card-foreground">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-card-foreground">{children}</dd>
    </div>
  );
}

export function ToolDetails({ tool }: { tool: Tool }) {
  const accepts = tool.from.map((f) => FORMATS[f].label).join(", ");
  const outputs = tool.to === "img" ? "Same as source, or PNG / JPG / WebP" : FORMATS[tool.to].name;
  return (
    <Panel title="Details">
      <dl className="-my-2 divide-y divide-border">
        <Row label="Status">
          <StatusBadge status={tool.status} />
        </Row>
        <Row label="Engine">{tool.engineName}</Row>
        <Row label="Accepts">{accepts}</Row>
        <Row label="Produces">{outputs}</Row>
        <Row label="Batch">{tool.multiple ? "Multiple files" : "One file at a time"}</Row>
        <Row label="Release">Phase {tool.phase}</Row>
      </dl>
    </Panel>
  );
}

export function PrivacyNote() {
  return (
    <div className="rounded-2xl bg-ready-soft p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ready">
        <ShieldCheck className="size-4" /> Processed on this device
      </div>
      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug text-foreground/80">
        <li className="flex gap-2">
          <Cpu className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> Conversion runs in your browser, using your computer.
        </li>
        <li className="flex gap-2">
          <HardDrive className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /> Nothing is uploaded or stored. Closing the tab clears it.
        </li>
      </ul>
      <Link to="/privacy" className="mt-2.5 inline-block text-[12.5px] font-medium text-primary hover:underline">
        How Forma protects your files
      </Link>
    </div>
  );
}

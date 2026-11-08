import { Link } from "@tanstack/react-router";
import type { Tool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { FormatPair } from "./FileIcon";
import { StatusBadge } from "./StatusBadge";

export function ToolCard({ tool, className, style }: { tool: Tool; className?: string; style?: React.CSSProperties }) {
  return (
    <Link
      to="/tools/$toolId"
      params={{ toolId: tool.id }}
      style={style}
      className={cn(
        "group relative flex flex-col rounded-xl bg-card p-4 shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift focus-visible:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <FormatPair from={tool.from} to={tool.to} size="sm" className="transition-transform duration-300 group-hover:translate-x-0.5" />
        <StatusBadge status={tool.status} />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-card-foreground">{tool.name}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{tool.summary}</p>
    </Link>
  );
}

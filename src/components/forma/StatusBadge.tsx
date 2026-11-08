import { STATUS_META, type ToolStatus } from "@/lib/tools";
import { cn } from "@/lib/utils";

const STYLES: Record<ToolStatus, { wrap: string; dot: string }> = {
  ready: { wrap: "bg-ready-soft text-ready", dot: "bg-ready" },
  development: { wrap: "bg-dev-soft text-dev", dot: "bg-dev" },
  planned: { wrap: "bg-planned-soft text-planned", dot: "bg-planned" },
};

export function StatusBadge({ status, className, long = false }: { status: ToolStatus; className?: string; long?: boolean }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        s.wrap,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot, status === "development" && "animate-pulse")} />
      {long ? STATUS_META[status].long : STATUS_META[status].label}
    </span>
  );
}

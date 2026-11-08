import { ArrowRight } from "lucide-react";
import { FORMATS, type FormatId } from "@/lib/formats";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "w-6",
  sm: "w-8",
  md: "w-10",
  lg: "w-14",
  xl: "w-[72px]",
} as const;

type Size = keyof typeof SIZES;

/** A document glyph with a folded corner and a colour-coded extension band. */
export function FileIcon({ format, size = "md", className }: { format: FormatId; size?: Size; className?: string }) {
  const f = FORMATS[format];
  return (
    <svg
      viewBox="0 0 40 48"
      className={cn(SIZES[size], "shrink-0 drop-shadow-[0_1px_1px_oklch(0_0_0/0.08)]", className)}
      role="img"
      aria-label={f.name}
    >
      <path
        d="M6 1.5h20.5L38.5 13.5V42a4.5 4.5 0 0 1-4.5 4.5H6A4.5 4.5 0 0 1 1.5 42V6A4.5 4.5 0 0 1 6 1.5Z"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />
      <path d="M26.5 1.5V9a4.5 4.5 0 0 0 4.5 4.5h7.5" fill="none" stroke="var(--border)" strokeWidth="1.25" />
      <path d="M27.2 2.4V9a3.8 3.8 0 0 0 3.8 3.8h6.6Z" fill={f.color} opacity="0.22" />
      {/* faint content lines */}
      <rect x="7" y="11" width="13" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.18" />
      <rect x="7" y="16" width="22" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.14" />
      <rect x="7" y="21" width="18" height="2" rx="1" fill="var(--muted-foreground)" opacity="0.14" />
      <rect x="4.5" y="28" width="31" height="13" rx="3" fill={f.color} />
      <text
        x="20"
        y="37.4"
        textAnchor="middle"
        fontSize={f.label.length > 3 ? 7.4 : 8.6}
        fontWeight={700}
        letterSpacing="0.04em"
        fontFamily="var(--font-sans)"
        fill="var(--primary-foreground)"
      >
        {f.label}
      </text>
    </svg>
  );
}

/** Stacked source formats → target format. */
export function FormatPair({ from, to, size = "md", className }: { from: FormatId[]; to: FormatId; size?: Size; className?: string }) {
  const arrowSize = size === "lg" || size === "xl" ? "size-5" : "size-3.5";
  return (
    <div className={cn("flex items-center", size === "xl" ? "gap-4" : "gap-2", className)}>
      <div className="flex items-center">
        {from.slice(0, 3).map((f, i) => (
          <FileIcon
            key={f}
            format={f}
            size={size}
            className={cn(i > 0 && "-ml-[38%]", i > 0 && "rotate-[6deg]")}
          />
        ))}
      </div>
      <ArrowRight className={cn(arrowSize, "shrink-0 text-muted-foreground/70")} strokeWidth={2} />
      <FileIcon format={to} size={size} />
    </div>
  );
}

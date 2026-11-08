import { cn } from "@/lib/utils";

/** The Forma mark: a squircle tile holding an "F" built from document strokes. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-grid size-7 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-mark text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.25),0_1px_2px_0_oklch(0_0_0/0.2)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[72%]" fill="currentColor">
        <rect x="6" y="4.5" width="3.4" height="15" rx="1.7" />
        <rect x="6" y="4.5" width="12" height="3.4" rx="1.7" />
        <rect x="6" y="10.6" width="8.4" height="3.2" rx="1.6" opacity="0.78" />
        <circle cx="16.6" cy="17.6" r="1.9" opacity="0.6" />
      </svg>
    </span>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">Forma</span>}
    </span>
  );
}

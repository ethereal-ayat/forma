import { Monitor, Moon, Sun } from "lucide-react";
import { useSettings, type ThemePref } from "@/lib/settings";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { settings, update, hydrated } = useSettings();
  return (
    <div role="radiogroup" aria-label="Appearance" className={cn("inline-flex items-center rounded-lg bg-subtle p-0.5 shadow-[inset_0_0_0_1px_var(--hairline)]", className)}>
      {OPTIONS.map((o) => {
        const active = hydrated && settings.theme === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => update({ theme: o.value })}
            className={cn(
              "grid size-7 place-items-center rounded-md text-muted-foreground transition-all duration-200 hover:text-foreground",
              active && "bg-card text-foreground shadow-card",
            )}
          >
            <o.icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

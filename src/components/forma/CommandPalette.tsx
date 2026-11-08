import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command as CommandPrimitive } from "cmdk";
import { CornerDownLeft, Monitor, Moon, Search, Settings, ShieldCheck, Sun, LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CATEGORIES, searchTools, TOOLS } from "@/lib/tools";
import { useSettings } from "@/lib/settings";
import { FormatPair } from "./FileIcon";
import { StatusBadge } from "./StatusBadge";
import { CATEGORY_ICONS } from "./category-icons";

const PaletteContext = createContext<{ open: () => void }>({ open: () => {} });

export function usePalette() {
  return useContext(PaletteContext);
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { update } = useSettings();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const results = useMemo(() => (query ? searchTools(query) : TOOLS.filter((t) => t.status === "ready")), [query]);
  const open = useCallback(() => setOpen(true), []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const itemCls =
    "flex cursor-pointer select-none items-center gap-3 rounded-lg px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground";
  const groupCls =
    "px-2 pb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground";

  const q = query.toLowerCase();
  const pages = [
    { label: "All tools", icon: LayoutGrid, to: "/" as const, words: "home all tools workspace" },
    { label: "Privacy", icon: ShieldCheck, to: "/privacy" as const, words: "privacy security data" },
    { label: "Settings", icon: Settings, to: "/settings" as const, words: "settings preferences" },
  ].filter((p) => !q || p.words.includes(q) || p.label.toLowerCase().includes(q));
  const cats = CATEGORIES.filter((c) => !q || c.name.toLowerCase().includes(q));
  const themes = [
    { label: "Use light appearance", icon: Sun, value: "light" as const },
    { label: "Use dark appearance", icon: Moon, value: "dark" as const },
    { label: "Match system appearance", icon: Monitor, value: "system" as const },
  ].filter((t) => !q || t.label.toLowerCase().includes(q) || "theme appearance".includes(q));

  return (
    <PaletteContext.Provider value={{ open }}>
      {children}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] max-w-[600px] translate-y-0 gap-0 overflow-hidden rounded-2xl border-0 bg-popover/95 p-0 shadow-window backdrop-blur-2xl sm:rounded-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">Search Forma</DialogTitle>
          <CommandPrimitive shouldFilter={false} loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-[18px] text-muted-foreground" />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder="Search conversions — try “png”, “word to pdf”, “compress”"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
            </div>
            <CommandPrimitive.List className="max-h-[min(440px,60vh)] overflow-y-auto pb-2">
              <CommandPrimitive.Empty className="px-4 py-10 text-center text-sm text-muted-foreground">
                No conversions match “{query}”.
              </CommandPrimitive.Empty>
              {results.length > 0 && (
                <CommandPrimitive.Group heading={query ? "Tools" : "Ready on this device"} className={groupCls}>
                  {results.slice(0, 8).map((t) => (
                    <CommandPrimitive.Item
                      key={t.id}
                      value={t.id}
                      onSelect={() => go(() => navigate({ to: "/tools/$toolId", params: { toolId: t.id } }))}
                      className={itemCls}
                    >
                      <FormatPair from={t.from} to={t.to} size="xs" />
                      <span className="flex-1 truncate font-medium">{t.name}</span>
                      <StatusBadge status={t.status} />
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}
              {cats.length > 0 && (
                <CommandPrimitive.Group heading="Categories" className={groupCls}>
                  {cats.map((c) => {
                    const Icon = CATEGORY_ICONS[c.id];
                    return (
                      <CommandPrimitive.Item
                        key={c.id}
                        value={`cat-${c.id}`}
                        onSelect={() => go(() => navigate({ to: "/categories/$categoryId", params: { categoryId: c.id } }))}
                        className={itemCls}
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="flex-1">{c.name}</span>
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              )}
              {pages.length > 0 && (
                <CommandPrimitive.Group heading="Go to" className={groupCls}>
                  {pages.map((p) => (
                    <CommandPrimitive.Item key={p.to} value={`page-${p.to}`} onSelect={() => go(() => navigate({ to: p.to }))} className={itemCls}>
                      <p.icon className="size-4 text-muted-foreground" />
                      <span className="flex-1">{p.label}</span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}
              {themes.length > 0 && (
                <CommandPrimitive.Group heading="Appearance" className={groupCls}>
                  {themes.map((t) => (
                    <CommandPrimitive.Item key={t.value} value={`theme-${t.value}`} onSelect={() => go(() => update({ theme: t.value }))} className={itemCls}>
                      <t.icon className="size-4 text-muted-foreground" />
                      <span className="flex-1">{t.label}</span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              )}
            </CommandPrimitive.List>
            <div className="flex items-center justify-between border-t border-border bg-surface/60 px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-ready" /> Everything runs on this device
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="size-3" /> to open
              </span>
            </div>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </PaletteContext.Provider>
  );
}

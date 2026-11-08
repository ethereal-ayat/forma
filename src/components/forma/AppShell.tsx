import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Menu, Search, Settings, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIES, TOOLS, toolsInCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "./category-icons";
import { CommandPaletteProvider, usePalette } from "./CommandPalette";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const navItem =
  "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const navActive = "bg-sidebar-accent text-sidebar-accent-foreground [&_svg]:text-primary";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const ready = TOOLS.filter((t) => t.status === "ready").length;
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 pb-4">
      <div className="space-y-0.5">
        <Link to="/" onClick={onNavigate} className={navItem} activeProps={{ className: navActive }} activeOptions={{ exact: true }}>
          <LayoutGrid className="size-4 text-muted-foreground transition-colors" />
          All tools
          <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">{TOOLS.length}</span>
        </Link>
      </div>

      <div>
        <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Categories</p>
        <div className="space-y-0.5">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <Link
                key={c.id}
                to="/categories/$categoryId"
                params={{ categoryId: c.id }}
                onClick={onNavigate}
                className={navItem}
                activeProps={{ className: navActive }}
              >
                <Icon className="size-4 text-muted-foreground transition-colors" />
                {c.short}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular">{toolsInCategory(c.id).length}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Forma</p>
        <div className="space-y-0.5">
          <Link to="/privacy" onClick={onNavigate} className={navItem} activeProps={{ className: navActive }}>
            <ShieldCheck className="size-4 text-muted-foreground transition-colors" />
            Privacy
          </Link>
          <Link to="/settings" onClick={onNavigate} className={navItem} activeProps={{ className: navActive }}>
            <Settings className="size-4 text-muted-foreground transition-colors" />
            Settings
          </Link>
        </div>
      </div>

      <div className="mt-auto rounded-xl bg-card/70 p-3 shadow-card">
        <div className="flex items-center gap-2 text-[12px] font-medium text-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-ready opacity-40" />
            <span className="relative inline-flex size-2 rounded-full bg-ready" />
          </span>
          Offline-capable engines
        </div>
        <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
          {ready} of {TOOLS.length} tools run on this device today. Files are never uploaded.
        </p>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-subtle">
          <div className="h-full rounded-full bg-ready" style={{ width: `${(ready / TOOLS.length) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}

function SearchTrigger({ className }: { className?: string }) {
  const { open } = usePalette();
  return (
    <button
      onClick={open}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-lg bg-subtle px-2.5 text-[13px] text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-colors hover:text-foreground",
        className,
      )}
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search tools</span>
      <kbd className="font-mono text-[10.5px] tracking-wide">⌘K</kbd>
    </button>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open } = usePalette();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-2xl lg:flex">
        <div className="flex h-14 items-center px-5">
          <Link to="/" aria-label="Forma home">
            <Logo />
          </Link>
        </div>
        <div className="px-3 pb-4">
          <SearchTrigger />
        </div>
        <SidebarNav />
        <div className="flex items-center justify-between border-t border-sidebar-border px-4 py-3">
          <span className="text-[11px] text-muted-foreground">v0.1 · Phase 1</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
        <Link to="/" aria-label="Forma home">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={open} aria-label="Search tools" className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground">
            <Search className="size-[18px]" />
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
          >
            <Menu className="size-[18px]" />
          </button>
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-[290px] flex-col gap-0 border-sidebar-border bg-background/95 p-0 backdrop-blur-2xl">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center px-5">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-[11px] text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-[248px]">
        <main key={pathname} className="animate-page-in mx-auto w-full max-w-[1180px] px-4 pb-20 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <Shell>{children}</Shell>
    </CommandPaletteProvider>
  );
}

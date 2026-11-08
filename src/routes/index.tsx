import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { CATEGORIES, getTool, searchTools, TOOLS, toolsInCategory } from "@/lib/tools";
import { useSettings } from "@/lib/settings";
import { ToolCard } from "@/components/forma/ToolCard";
import { FormatPair } from "@/components/forma/FileIcon";
import { StatusBadge } from "@/components/forma/StatusBadge";
import { CATEGORY_ICONS } from "@/components/forma/category-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forma — Convert files privately, on your device" },
      { name: "description", content: "Convert images, data and documents in your browser. No uploads, no accounts, no ads." },
      { property: "og:title", content: "Forma — Convert files privately, on your device" },
      { property: "og:description", content: "Convert images, data and documents in your browser. No uploads, no accounts, no ads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const QUICK = ["png-to-jpg", "compress-image", "csv-to-json", "merge-pdf"];

function Home() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { recent } = useSettings();
  const results = useMemo(() => (q ? searchTools(q).slice(0, 6) : []), [q]);
  const ready = TOOLS.filter((t) => t.status === "ready").length;
  const recentTools = recent.map((id) => getTool(id)).filter((t) => t !== undefined);

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 rounded-3xl bg-canvas px-4 pb-2 pt-6 sm:mx-0 sm:px-0 lg:pt-10">
        <h1 className="max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
          Convert anything.
          <br />
          <span className="text-muted-foreground">Keep everything on your device.</span>
        </h1>
        <div className="relative mt-7 max-w-2xl">
          <div className="flex h-14 items-center gap-3 rounded-2xl bg-card px-4 shadow-lift">
            <Search className="size-5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) navigate({ to: "/tools/$toolId", params: { toolId: results[0].id } });
              }}
              placeholder="What do you want to convert? Try “png”, “word to pdf”"
              aria-label="Search conversions"
              className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          {q && (
            <div className="animate-rise absolute inset-x-0 top-16 z-20 overflow-hidden rounded-2xl bg-popover shadow-window">
              {results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">No conversions match “{q}”.</p>
              ) : (
                results.map((t) => (
                  <Link key={t.id} to="/tools/$toolId" params={{ toolId: t.id }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent">
                    <FormatPair from={t.from} to={t.to} size="xs" />
                    <span className="flex-1 text-sm font-medium">{t.name}</span>
                    <StatusBadge status={t.status} />
                  </Link>
                ))
              )}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((id) => {
              const t = getTool(id)!;
              return (
                <Link key={id} to="/tools/$toolId" params={{ toolId: id }} className="rounded-full bg-subtle px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--hairline)] transition-colors hover:text-foreground">
                  {t.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
          <span>{TOOLS.length} tools</span>
          <span className="text-ready">{ready} ready now</span>
          <span>0 bytes uploaded</span>
        </div>
      </section>

      {recentTools.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Recently used</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentTools.slice(0, 3).map((t) => <ToolCard key={t.id} tool={t} />)}
          </div>
        </section>
      )}

      {CATEGORIES.map((c) => {
        const Icon = CATEGORY_ICONS[c.id];
        const list = toolsInCategory(c.id);
        return (
          <section key={c.id}>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-muted-foreground" />
                <h2 className="text-[15px] font-semibold">{c.name}</h2>
                <span className="font-mono text-[12px] text-muted-foreground">{list.length}</span>
              </div>
              <Link to="/categories/$categoryId" params={{ categoryId: c.id }} className="text-[12.5px] font-medium text-primary hover:underline">View all</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, 6).map((t) => <ToolCard key={t.id} tool={t} />)}
            </div>
          </section>
        );
      })}

      <Link to="/privacy" className="flex items-center gap-4 rounded-2xl bg-ready-soft p-5 transition-opacity hover:opacity-90">
        <ShieldCheck className="size-6 shrink-0 text-ready" />
        <div>
          <p className="text-[14px] font-semibold">Your files never leave this device</p>
          <p className="text-[13px] text-muted-foreground">No uploads, accounts, ads or trackers. See how Forma works →</p>
        </div>
      </Link>
    </div>
  );
}

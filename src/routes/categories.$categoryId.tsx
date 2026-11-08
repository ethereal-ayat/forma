import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCategory, toolsInCategory, type CategoryId } from "@/lib/tools";
import { ToolCard } from "@/components/forma/ToolCard";
import { CATEGORY_HUES, CATEGORY_ICONS } from "@/components/forma/category-icons";

export const Route = createFileRoute("/categories/$categoryId")({
  loader: ({ params }) => {
    const c = getCategory(params.categoryId);
    if (!c) throw notFound();
    return { categoryId: c.id };
  },
  head: ({ loaderData }) => {
    const c = loaderData ? getCategory(loaderData.categoryId) : undefined;
    const title = c ? `${c.name} — Forma` : "Category unavailable — Forma";
    const desc = c?.description ?? "This Forma category could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useLoaderData();
  const c = getCategory(categoryId)!;
  const Icon = CATEGORY_ICONS[c.id as CategoryId];
  const tools = toolsInCategory(c.id);
  const ready = tools.filter((t) => t.status === "ready").length;
  return (
    <div className="space-y-8">
      <header className="flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-card shadow-card" style={{ color: CATEGORY_HUES[c.id] }}>
          <Icon className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{c.name}</h1>
          <p className="mt-1 max-w-xl text-[14px] text-muted-foreground">{c.description}</p>
          <p className="mt-2 font-mono text-[12px] text-muted-foreground">{ready} of {tools.length} ready on this device</p>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t, i) => <ToolCard key={t.id} tool={t} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }} />)}
      </div>
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { getCategory, getTool, toolsInCategory } from "@/lib/tools";
import { useSettings } from "@/lib/settings";
import { FormatPair } from "@/components/forma/FileIcon";
import { StatusBadge } from "@/components/forma/StatusBadge";
import { ToolCard } from "@/components/forma/ToolCard";
import { ImageWorkspace } from "@/components/forma/workspaces/ImageWorkspace";
import { TextWorkspace } from "@/components/forma/workspaces/TextWorkspace";
import { PendingWorkspace } from "@/components/forma/workspaces/PendingWorkspace";
import { PdfWorkspace } from "@/components/forma/workspaces/PdfWorkspace";

export const Route = createFileRoute("/tools/$toolId")({
  loader: ({ params }) => {
    const tool = getTool(params.toolId);
    if (!tool) throw notFound();
    return { toolId: tool.id };
  },
  head: ({ loaderData }) => {
    const tool = loaderData ? getTool(loaderData.toolId) : undefined;
    const title = tool ? `${tool.name} — Forma` : "Tool unavailable — Forma";
    const desc = tool?.description ?? "This Forma tool could not be found.";
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
  component: ToolPage,
});

function ToolPage() {
  const { toolId } = Route.useLoaderData();
  const tool = getTool(toolId)!;
  const category = getCategory(tool.category)!;
  const { pushRecent } = useSettings();
  useEffect(() => pushRecent(tool.id), [tool.id, pushRecent]);
  const related = toolsInCategory(tool.category).filter((t) => t.id !== tool.id).slice(0, 3);

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">All tools</Link>
        <ChevronRight className="size-3.5" />
        <Link to="/categories/$categoryId" params={{ categoryId: category.id }} className="hover:text-foreground">{category.name}</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{tool.name}</span>
      </nav>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <FormatPair from={tool.from} to={tool.to} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{tool.name}</h1>
            <StatusBadge status={tool.status} long />
          </div>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{tool.description}</p>
        </div>
      </header>
      {tool.status !== "ready" ? (
        <PendingWorkspace tool={tool} />
      ) : tool.engine?.type === "image" ? (
        <ImageWorkspace tool={tool} />
      ) : tool.engine?.type === "pdf" ? (
        <PdfWorkspace tool={tool} />
      ) : (
        <TextWorkspace tool={tool} />
      )}
      {related.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">More in {category.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => <ToolCard key={t.id} tool={t} />)}
          </div>
        </section>
      )}
    </div>
  );
}

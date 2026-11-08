import { marked } from "marked";
import { csvToJson, formatJson, jsonToCsv } from "./data";
import type { EngineKind } from "../tools";

type TextTransform = Extract<EngineKind, { type: "text" }>["transform"];

export type TextOptions = {
  indent?: number | "minify";
  typed?: boolean;
  delimiter?: string;
  fullDocument?: boolean;
};

export function markdownToHtml(md: string, fullDocument = false, title = "Document") {
  const body = marked.parse(md, { gfm: true, async: false }) as string;
  if (!fullDocument) return body.trim();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title.replace(/</g, "&lt;")}</title>
<style>body{font:16px/1.6 -apple-system,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px}pre{background:#f4f4f5;padding:12px;border-radius:8px;overflow:auto}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px 10px}</style>
</head>
<body>
${body.trim()}
</body>
</html>`;
}

/** Browser-only: uses DOMParser to read text content while keeping block breaks. */
export function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,noscript,template").forEach((n) => n.remove());
  const blocks = "p,div,section,article,header,footer,li,h1,h2,h3,h4,h5,h6,tr,blockquote,pre";
  doc.querySelectorAll("br").forEach((n) => n.replaceWith("\n"));
  doc.querySelectorAll(blocks).forEach((n) => n.append("\n"));
  doc.querySelectorAll("li").forEach((n) => n.prepend("• "));
  const text = doc.body?.textContent ?? "";
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function runTextTransform(kind: TextTransform, input: string, opts: TextOptions = {}, title?: string) {
  if (!input.trim()) throw new Error("Add a file or paste some content first.");
  switch (kind) {
    case "csv-to-json":
      return csvToJson(input, { typed: opts.typed ?? true, indent: typeof opts.indent === "number" ? opts.indent : 2 });
    case "json-to-csv":
      return jsonToCsv(input, opts.delimiter ?? ",");
    case "json-format":
      return formatJson(input, opts.indent ?? 2);
    case "md-to-html":
      return markdownToHtml(input, opts.fullDocument ?? false, title);
    case "html-to-text":
      return htmlToText(input);
  }
}

export const TEXT_OUTPUT: Record<TextTransform, { ext: string; mime: string }> = {
  "csv-to-json": { ext: "json", mime: "application/json" },
  "json-to-csv": { ext: "csv", mime: "text/csv" },
  "json-format": { ext: "json", mime: "application/json" },
  "md-to-html": { ext: "html", mime: "text/html" },
  "html-to-text": { ext: "txt", mime: "text/plain" },
};

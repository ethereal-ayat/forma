import { Braces, FileStack, FileText, Image, Sheet, type LucideIcon } from "lucide-react";
import type { CategoryId } from "@/lib/tools";

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  images: Image,
  pdf: FileStack,
  documents: FileText,
  spreadsheets: Sheet,
  text: Braces,
};

export const CATEGORY_HUES: Record<CategoryId, string> = {
  images: "var(--fmt-png)",
  pdf: "var(--fmt-pdf)",
  documents: "var(--fmt-docx)",
  spreadsheets: "var(--fmt-xlsx)",
  text: "var(--fmt-json)",
};

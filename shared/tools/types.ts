export type ToolCategory =
  | "pdf"
  | "image"
  | "document"
  | "converter"
  | "text"
  | "data"
  | "business"
  | "security"
  | "time"
  | "developer"
  | "ai";

export type ToolStatus = "active" | "coming-soon";
export type ExecutionMode = "client" | "server";

export interface ToolFAQ {
  q: string;
  a: string;
}

export interface ToolSEO {
  title: string;
  description: string;
  h1: string;
  canonical: string; // e.g. "/compress-pdf"
}

export interface ToolLimits {
  maxFileSizeMB: number;
  maxFiles: number;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  status: ToolStatus;
  executionMode: ExecutionMode;
  description: string;
  aliases: string[];
  keywords: string[];
  inputFormats: string[];
  outputFormats: string[];
  limits: ToolLimits;
  seo: ToolSEO;
  faq: ToolFAQ[];
  relatedTools: string[]; // slugs
}

export interface ToolCategoryInfo {
  id: ToolCategory;
  name: string;
  slug: string;
  description: string;
}

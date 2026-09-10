import { ReactNode } from "react";
import { Tool } from "@shared/tools";
import ActiveFileTool from "./ActiveFileTool";
import WordCounterTool from "./WordCounterTool";
import {
  CompressImageOptions,
  ResizeImageOptions,
  SplitPdfOptions,
  CompressPdfOptions,
} from "./toolOptionFields";

const IMAGE_COMPRESS_SLUGS = ["compress-image", "compress-jpg", "compress-png", "compress-webp"];
const SIMPLE_CONVERTER_SLUGS = [
  "jpg-to-png",
  "png-to-jpg",
  "jpg-to-webp",
  "png-to-webp",
  "webp-to-jpg",
  "webp-to-png",
  "jpg-to-pdf",
  "png-to-pdf",
];

/**
 * Returns the interactive component for a tool whose registry `status` is
 * "active". Every entry here corresponds 1:1 with a processor registered in
 * server/src/processors/register.ts — if a tool is active but has no entry
 * here, it falls back to ActiveFileTool with no extra options, which still
 * calls the real API.
 */
export function renderActiveTool(tool: Tool): ReactNode {
  if (tool.slug === "word-counter") {
    return <WordCounterTool />;
  }

  if (tool.slug === "merge-pdf") {
    return (
      <ActiveFileTool
        tool={tool}
        validateBeforeSubmit={(count) => (count < 2 ? "Upload at least two PDF files to merge." : null)}
      />
    );
  }

  if (tool.slug === "split-pdf") {
    return <ActiveFileTool tool={tool} renderOptions={(o, s) => <SplitPdfOptions options={o} setOptions={s} />} />;
  }

  if (tool.slug === "compress-pdf") {
    return (
      <ActiveFileTool
        tool={tool}
        defaultOptions={{ quality: "balanced" }}
        renderOptions={(o, s) => <CompressPdfOptions options={o} setOptions={s} />}
      />
    );
  }

  if (tool.slug === "resize-image") {
    return <ActiveFileTool tool={tool} renderOptions={(o, s) => <ResizeImageOptions options={o} setOptions={s} />} />;
  }

  if (IMAGE_COMPRESS_SLUGS.includes(tool.slug)) {
    return (
      <ActiveFileTool
        tool={tool}
        defaultOptions={{ quality: 80 }}
        renderOptions={(o, s) => <CompressImageOptions options={o} setOptions={s} />}
      />
    );
  }

  if (SIMPLE_CONVERTER_SLUGS.includes(tool.slug)) {
    return <ActiveFileTool tool={tool} />;
  }

  // Active but not yet given a bespoke UI — still fully functional.
  return <ActiveFileTool tool={tool} />;
}

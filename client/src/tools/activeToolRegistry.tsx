import { ReactNode } from "react";
import { Tool } from "@shared/tools";
import ActiveFileTool from "./ActiveFileTool";
import WordCounterTool from "./WordCounterTool";
import ImageInfoTool from "./ImageInfoTool";
import FillPdfTool from "./FillPdfTool";
import DynamicOptionsForm from "./DynamicOptionsForm";
import { TOOL_FIELD_SPECS, coerceOptions } from "./toolFieldSpecs";
import { CompressImageOptions, CompressPdfOptions } from "./toolOptionFields";

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
const SIMPLE_PDF_TRANSFORM_SLUGS = ["flatten-pdf", "repair-pdf"];
const CLIENT_ONLY_INFO_SLUGS = ["image-dimensions", "image-format-detector"];

const DEFAULT_OPTIONS_BY_SLUG: Record<string, Record<string, unknown>> = {
  "rotate-pdf": { degrees: 90 },
  "crop-pdf": { marginPercent: 5 },
  "add-page-numbers": { position: "bottom-center", startAt: 1 },
  "sign-pdf": { position: "bottom-right" },
  "rotate-image": { degrees: 90 },
  "flip-image": { direction: "horizontal" },
  "image-dpi-changer": { dpi: 300 },
  "compress-pdf": { quality: "balanced" },
};

const MIN_TWO_FILES = (count: number) => (count < 2 ? "Upload at least two PDF files to merge." : null);
const EXACTLY_TWO_FILES = (count: number) => (count !== 2 ? "Upload exactly two PDF files to compare." : null);

/**
 * Returns the interactive component for a tool whose registry `status` is
 * "active". Every entry here corresponds 1:1 with a processor registered in
 * server/src/processors/register.ts. Tools with a field spec in
 * toolFieldSpecs.ts automatically get a generated options form; tools with
 * no options (simple converters) get ActiveFileTool with none.
 */
export function renderActiveTool(tool: Tool): ReactNode {
  if (tool.slug === "word-counter") return <WordCounterTool />;
  if (tool.slug === "fill-pdf") return <FillPdfTool tool={tool} />;
  if (CLIENT_ONLY_INFO_SLUGS.includes(tool.slug)) {
    return <ImageInfoTool mode={tool.slug === "image-dimensions" ? "dimensions" : "format"} />;
  }

  if (tool.slug === "merge-pdf") {
    return <ActiveFileTool tool={tool} validateBeforeSubmit={MIN_TWO_FILES} />;
  }
  if (tool.slug === "compare-pdfs") {
    return <ActiveFileTool tool={tool} validateBeforeSubmit={EXACTLY_TWO_FILES} />;
  }

  if (tool.slug === "compress-pdf") {
    return (
      <ActiveFileTool
        tool={tool}
        defaultOptions={DEFAULT_OPTIONS_BY_SLUG["compress-pdf"]}
        renderOptions={(o, s) => <CompressPdfOptions options={o} setOptions={s} />}
      />
    );
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

  if (SIMPLE_CONVERTER_SLUGS.includes(tool.slug) || SIMPLE_PDF_TRANSFORM_SLUGS.includes(tool.slug)) {
    return <ActiveFileTool tool={tool} />;
  }

  const fields = TOOL_FIELD_SPECS[tool.slug];
  if (fields) {
    return (
      <ActiveFileTool
        tool={tool}
        defaultOptions={DEFAULT_OPTIONS_BY_SLUG[tool.slug]}
        renderOptions={(o, s) => <DynamicOptionsForm fields={fields} options={o} setOptions={s} />}
        transformOptions={(o) => coerceOptions(tool.slug, o)}
      />
    );
  }

  // Active but without a specific options form — still fully functional.
  return <ActiveFileTool tool={tool} />;
}

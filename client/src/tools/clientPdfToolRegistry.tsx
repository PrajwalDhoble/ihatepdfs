import { ReactNode } from "react";
import { Tool } from "@shared/tools";
import ClientPdfTool from "./ClientPdfTool";
import DynamicOptionsForm from "./DynamicOptionsForm";
import { TOOL_FIELD_SPECS, coerceOptions } from "./toolFieldSpecs";
import {
  mergePdfsClient,
  compressPdfClient,
  imagesToPdfClient,
  splitPdfClient,
  rotatePdfClient,
  deletePdfPagesClient,
  extractPdfPagesClient,
  rearrangePdfPagesClient,
  cropPdfClient,
  resizePdfClient,
  addWatermarkClient,
  addPageNumbersClient,
  editPdfMetadataClient,
  flattenPdfClient,
  stampPdfClient,
  repairPdfClient,
  annotatePdfClient,
  addHeaderFooterClient,
  redactPdfClient,
} from "@/lib/clientPdf";
import TextToPdfTool from "./TextToPdfTool";
import WorkflowBuilderTool from "./WorkflowBuilderTool";

/**
 * Every tool listed here processes the file entirely in the browser via
 * pdf-lib — no upload, no server round-trip, no CloudConvert/qpdf
 * dependency. This is intentionally the same set of operations pdf-lib
 * handles server-side (server/src/processors/pdfProcessor.ts); running
 * them client-side instead is strictly a trust/privacy/latency win, not a
 * capability difference.
 */
const CLIENT_PDF_SLUGS = new Set([
  "merge-pdf",
  "split-pdf",
  "compress-pdf",
  "jpg-to-pdf",
  "png-to-pdf",
  "rotate-pdf",
  "delete-pdf-pages",
  "extract-pdf-pages",
  "rearrange-pdf-pages",
  "crop-pdf",
  "resize-pdf",
  "add-watermark",
  "add-page-numbers",
  "edit-pdf-metadata",
  "flatten-pdf",
  "sign-pdf",
  "repair-pdf",
  "annotate-pdf",
  "add-header-footer",
  "redact-pdf",
  "text-to-pdf",
  "pdf-workflow",
]);

export function isClientPdfTool(slug: string): boolean {
  return CLIENT_PDF_SLUGS.has(slug);
}

function nameFor(file: File, suffix: string): string {
  const base = file.name.replace(/\.pdf$/i, "");
  return `${base}-${suffix}.pdf`;
}

export function renderClientPdfTool(tool: Tool): ReactNode {
  switch (tool.slug) {
    case "compress-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          defaultOptions={{ quality: "balanced" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm
              options={o}
              setOptions={s}
              fields={[{ key: "quality", type: "select", label: "Compression level", choices: [
                { value: "best", label: "Best Quality" },
                { value: "balanced", label: "Balanced" },
                { value: "small", label: "Small File" },
              ] }]}
            />
          )}
          run={async (files, options) => [{ blob: await compressPdfClient(files[0], { quality: options.quality as "small" | "balanced" | "best" }), filename: nameFor(files[0], "compressed") }]}
        />
      );

    case "jpg-to-pdf":
    case "png-to-pdf":
      return <ClientPdfTool tool={tool} run={async (files) => [{ blob: await imagesToPdfClient(files), filename: "converted.pdf" }]} />;

    case "merge-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          validateBeforeSubmit={(count) => (count < 2 ? "Upload at least two PDF files to merge." : null)}
          run={async (files) => [{ blob: await mergePdfsClient(files), filename: "merged.pdf" }]}
        />
      );

    case "split-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["split-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => {
            const blobs = await splitPdfClient(files[0], (options.ranges as string) ?? "");
            return blobs.map((blob, i) => ({ blob, filename: `split-${i + 1}.pdf` }));
          }}
        />
      );

    case "rotate-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          defaultOptions={{ degrees: 90 }}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["rotate-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => {
            const opts = coerceOptions("rotate-pdf", options);
            const blob = await rotatePdfClient(files[0], (opts.degrees as 90 | 180 | 270) ?? 90, opts.pages as string | undefined);
            return [{ blob, filename: nameFor(files[0], "rotated") }];
          }}
        />
      );

    case "delete-pdf-pages":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["delete-pdf-pages"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            { blob: await deletePdfPagesClient(files[0], (options.pages as string) ?? ""), filename: nameFor(files[0], "pages-deleted") },
          ]}
        />
      );

    case "extract-pdf-pages":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["extract-pdf-pages"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            { blob: await extractPdfPagesClient(files[0], (options.pages as string) ?? ""), filename: nameFor(files[0], "extracted") },
          ]}
        />
      );

    case "rearrange-pdf-pages":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["rearrange-pdf-pages"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            { blob: await rearrangePdfPagesClient(files[0], (options.order as string) ?? ""), filename: nameFor(files[0], "rearranged") },
          ]}
        />
      );

    case "crop-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          defaultOptions={{ marginPercent: 5 }}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["crop-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            { blob: await cropPdfClient(files[0], (options.marginPercent as number) ?? 5), filename: nameFor(files[0], "cropped") },
          ]}
        />
      );

    case "resize-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["resize-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await resizePdfClient(files[0], {
                width: options.width as number | undefined,
                height: options.height as number | undefined,
                scalePercent: options.scalePercent as number | undefined,
              }),
              filename: nameFor(files[0], "resized"),
            },
          ]}
        />
      );

    case "add-watermark":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["add-watermark"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            { blob: await addWatermarkClient(files[0], (options.text as string) ?? ""), filename: nameFor(files[0], "watermarked") },
          ]}
        />
      );

    case "add-page-numbers":
      return (
        <ClientPdfTool
          tool={tool}
          defaultOptions={{ position: "bottom-center", startAt: 1 }}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["add-page-numbers"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await addPageNumbersClient(
                files[0],
                options.position as "bottom-center" | "bottom-left" | "bottom-right" | undefined,
                options.startAt as number | undefined
              ),
              filename: nameFor(files[0], "numbered"),
            },
          ]}
        />
      );

    case "edit-pdf-metadata":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["edit-pdf-metadata"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await editPdfMetadataClient(files[0], {
                title: options.title as string | undefined,
                author: options.author as string | undefined,
                subject: options.subject as string | undefined,
                keywords: options.keywords as string | undefined,
              }),
              filename: nameFor(files[0], "metadata-updated"),
            },
          ]}
        />
      );

    case "flatten-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          run={async (files) => [{ blob: await flattenPdfClient(files[0]), filename: nameFor(files[0], "flattened") }]}
        />
      );

    case "sign-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          defaultOptions={{ position: "bottom-right" }}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["sign-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await stampPdfClient(
                files[0],
                (options.text as string) ?? "",
                options.position as "bottom-right" | "bottom-left" | "bottom-center" | undefined
              ),
              filename: nameFor(files[0], "signed"),
            },
          ]}
        />
      );

    case "repair-pdf":
      return (
        <ClientPdfTool tool={tool} run={async (files) => [{ blob: await repairPdfClient(files[0]), filename: nameFor(files[0], "repaired") }]} />
      );

    case "annotate-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["annotate-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await annotatePdfClient(files[0], {
                text: (options.text as string) ?? "",
                page: options.page as number | undefined,
                x: options.x as number | undefined,
                y: options.y as number | undefined,
              }),
              filename: nameFor(files[0], "annotated"),
            },
          ]}
        />
      );

    case "add-header-footer":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["add-header-footer"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await addHeaderFooterClient(files[0], {
                headerText: options.headerText as string | undefined,
                footerText: options.footerText as string | undefined,
              }),
              filename: nameFor(files[0], "header-footer"),
            },
          ]}
        />
      );

    case "redact-pdf":
      return (
        <ClientPdfTool
          tool={tool}
          renderOptions={(o, s) => <DynamicOptionsForm fields={TOOL_FIELD_SPECS["redact-pdf"]} options={o} setOptions={s} />}
          run={async (files, options) => [
            {
              blob: await redactPdfClient(files[0], {
                page: options.page as number | undefined,
                x: options.x as number | undefined,
                y: options.y as number | undefined,
                width: options.width as number | undefined,
                height: options.height as number | undefined,
              }),
              filename: nameFor(files[0], "redacted"),
            },
          ]}
        />
      );

    case "text-to-pdf":
      return <TextToPdfTool tool={tool} />;

    case "pdf-workflow":
      return <WorkflowBuilderTool tool={tool} />;

    default:
      return null;
  }
}

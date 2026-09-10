import { useState, ReactNode } from "react";
import { Tool } from "@shared/tools";
import UploadZone from "@/components/UploadZone";
import Button from "@/components/Button";
import { useFileUpload } from "@/hooks/useFileUpload";
import { downloadBlob } from "@/utils/downloadBlob";
import { ClientPdfError } from "@/lib/clientPdf";

interface ClientPdfToolProps {
  tool: Tool;
  /** Runs the operation locally and returns one or more output blobs + filenames. */
  run: (files: File[], options: Record<string, unknown>) => Promise<{ blob: Blob; filename: string }[]>;
  renderOptions?: (options: Record<string, unknown>, setOptions: (o: Record<string, unknown>) => void) => ReactNode;
  defaultOptions?: Record<string, unknown>;
  validateBeforeSubmit?: (fileCount: number) => string | null;
}

/**
 * Mirrors ActiveFileTool's shape but never calls the API — everything runs
 * synchronously in the browser via pdf-lib. No upload, no job polling, no
 * server round-trip. Powers the "Processed locally — never uploaded" tools.
 */
export default function ClientPdfTool({ tool, run, renderOptions, defaultOptions, validateBeforeSubmit }: ClientPdfToolProps) {
  const { files, addFiles, removeFile, clearFiles, hasValidFiles, globalError } = useFileUpload({
    acceptFormats: tool.inputFormats,
    maxFileSizeMB: tool.limits.maxFileSizeMB,
    maxFiles: tool.limits.maxFiles,
  });
  const [options, setOptions] = useState<Record<string, unknown>>(defaultOptions ?? {});
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultCount, setResultCount] = useState(0);

  async function handleRun() {
    setErrorMessage(null);
    const validFiles = files.filter((f) => f.status === "pending").map((f) => f.file);
    if (validFiles.length === 0) {
      setErrorMessage("Please upload a file first.");
      return;
    }
    if (validateBeforeSubmit) {
      const validationError = validateBeforeSubmit(validFiles.length);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    setStatus("processing");
    try {
      const results = await run(validFiles, options);
      results.forEach((r) => downloadBlob(r.blob, r.filename));
      setResultCount(results.length);
      setStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof ClientPdfError ? err.message : "Something went wrong processing this file locally.");
      setStatus("error");
    }
  }

  function handleReset() {
    clearFiles();
    setStatus("idle");
    setErrorMessage(null);
  }

  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-accent)",
          background: "#e6f9f2",
          padding: "4px 10px",
          borderRadius: 999,
          marginBottom: "var(--space-3)",
        }}
      >
        🔒 Processed locally in your browser — this file is never uploaded
      </div>

      <UploadZone
        files={files}
        acceptFormats={tool.inputFormats}
        maxFiles={tool.limits.maxFiles}
        globalError={globalError}
        onFilesAdded={addFiles}
        onRemove={removeFile}
        onClear={clearFiles}
      />

      {renderOptions && hasValidFiles && <div style={{ marginTop: "var(--space-4)" }}>{renderOptions(options, setOptions)}</div>}

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button onClick={handleRun} disabled={!hasValidFiles || status === "processing"}>
          {status === "processing" ? "Processing…" : tool.name}
        </Button>
      </div>

      {status === "done" && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
            {resultCount > 1 ? `${resultCount} files downloaded.` : "Download started."}
          </p>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Process another file
          </Button>
        </div>
      )}

      {errorMessage && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

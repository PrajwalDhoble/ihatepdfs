import { useState, ReactNode } from "react";
import { Tool } from "@shared/tools";
import UploadZone from "@/components/UploadZone";
import Button from "@/components/Button";
import { useFileUpload } from "@/hooks/useFileUpload";
import { createJob, getJobStatus, getJobDownloadUrl, ApiError, JobResponse } from "@/services/api";

interface ActiveFileToolProps {
  tool: Tool;
  /** Renders any tool-specific option controls above the Run button. */
  renderOptions?: (options: Record<string, unknown>, setOptions: (o: Record<string, unknown>) => void) => ReactNode;
  defaultOptions?: Record<string, unknown>;
  /** Optional client-side check before submitting, e.g. "need at least 2 files". */
  validateBeforeSubmit?: (fileCount: number) => string | null;
  /** Optional transform applied to options right before they're sent to the API (e.g. string -> number coercion). */
  transformOptions?: (options: Record<string, unknown>) => Record<string, unknown>;
}

type RunState = "idle" | "processing" | "done" | "error";

export default function ActiveFileTool({
  tool,
  renderOptions,
  defaultOptions,
  validateBeforeSubmit,
  transformOptions,
}: ActiveFileToolProps) {
  const { files, addFiles, removeFile, clearFiles, hasValidFiles, globalError } = useFileUpload({
    acceptFormats: tool.inputFormats,
    maxFileSizeMB: tool.limits.maxFileSizeMB,
    maxFiles: tool.limits.maxFiles,
  });
  const [options, setOptions] = useState<Record<string, unknown>>(defaultOptions ?? {});
  const [runState, setRunState] = useState<RunState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function pollUntilDone(id: string): Promise<JobResponse> {
    const start = Date.now();
    const timeoutMs = 60_000;
    // The server currently runs jobs synchronously and returns "done" or
    // throws immediately, but polling here means slower future processors
    // (server-side queues) work without any client changes.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const status = await getJobStatus(id);
      if (status.status === "done" || status.status === "failed") return status;
      if (Date.now() - start > timeoutMs) {
        throw new ApiError("Processing is taking longer than expected. Please try again.", "TIMEOUT", 408);
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

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

    setRunState("processing");
    try {
      const finalOptions = transformOptions ? transformOptions(options) : options;
      const created = await createJob(tool.slug, validFiles, finalOptions);
      setJobId(created.jobId);

      const finalStatus = created.status === "done" || created.status === "failed" ? created : await pollUntilDone(created.jobId);

      if (finalStatus.status === "failed") {
        throw new ApiError(finalStatus.error ?? "Processing failed. Please try again.", "PROCESSING_FAILED", 500);
      }

      setRunState("done");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Processing failed. Please try again.";
      setErrorMessage(message);
      setRunState("error");
    }
  }

  function handleReset() {
    clearFiles();
    setRunState("idle");
    setErrorMessage(null);
    setJobId(null);
  }

  if (runState === "done" && jobId) {
    return (
      <div>
        <div
          role="status"
          style={{
            padding: "var(--space-5)",
            background: "var(--color-primary-light)",
            border: "1px solid var(--color-primary)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Your file is ready</div>
          <a href={getJobDownloadUrl(jobId)}>
            <Button>Download result</Button>
          </a>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} style={{ marginTop: 12 }}>
          Process another file
        </Button>
      </div>
    );
  }

  return (
    <div>
      <UploadZone
        files={files}
        acceptFormats={tool.inputFormats}
        maxFiles={tool.limits.maxFiles}
        globalError={globalError}
        onFilesAdded={addFiles}
        onRemove={removeFile}
        onClear={clearFiles}
      />

      {renderOptions && hasValidFiles && (
        <div style={{ marginTop: "var(--space-4)" }}>{renderOptions(options, setOptions)}</div>
      )}

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button onClick={handleRun} disabled={!hasValidFiles || runState === "processing"}>
          {runState === "processing" ? "Processing…" : tool.name}
        </Button>
      </div>

      {errorMessage && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

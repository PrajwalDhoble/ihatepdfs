import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import Button from "@/components/Button";
import DynamicOptionsForm, { OptionField } from "./DynamicOptionsForm";
import { useFileUpload } from "@/hooks/useFileUpload";
import { downloadBlob } from "@/utils/downloadBlob";
import { ClientPdfError } from "@/lib/clientPdf";
import {
  rotatePdfClient,
  cropPdfClient,
  resizePdfClient,
  addWatermarkClient,
  addHeaderFooterClient,
  addPageNumbersClient,
  deletePdfPagesClient,
  extractPdfPagesClient,
  rearrangePdfPagesClient,
  editPdfMetadataClient,
  flattenPdfClient,
  redactPdfClient,
  stampPdfClient,
} from "@/lib/clientPdf";

type StepType =
  | "rotate"
  | "crop"
  | "resize"
  | "watermark"
  | "header-footer"
  | "page-numbers"
  | "delete-pages"
  | "extract-pages"
  | "rearrange-pages"
  | "metadata"
  | "flatten"
  | "redact"
  | "sign";

interface WorkflowStep {
  id: string;
  type: StepType;
  options: Record<string, unknown>;
}

const STEP_LABELS: Record<StepType, string> = {
  rotate: "Rotate",
  crop: "Crop",
  resize: "Resize",
  watermark: "Add watermark",
  "header-footer": "Add header/footer",
  "page-numbers": "Add page numbers",
  "delete-pages": "Delete pages",
  "extract-pages": "Extract pages",
  "rearrange-pages": "Rearrange pages",
  metadata: "Edit metadata",
  flatten: "Flatten form fields",
  redact: "Redact a region",
  sign: "Stamp signature text",
};

const STEP_FIELDS: Record<StepType, OptionField[]> = {
  rotate: [{ key: "degrees", type: "select", label: "Rotate by", choices: [{ value: "90", label: "90°" }, { value: "180", label: "180°" }, { value: "270", label: "270°" }] }],
  crop: [{ key: "marginPercent", type: "range", label: "Crop margin per edge (%)", min: 1, max: 40 }],
  resize: [
    { key: "width", type: "number", label: "Width (pt, optional)", min: 1 },
    { key: "height", type: "number", label: "Height (pt, optional)", min: 1 },
    { key: "scalePercent", type: "number", label: "Or scale by % instead", min: 1, max: 400 },
  ],
  watermark: [{ key: "text", type: "text", label: "Watermark text" }],
  "header-footer": [
    { key: "headerText", type: "text", label: "Header text (optional)" },
    { key: "footerText", type: "text", label: "Footer text (optional)" },
  ],
  "page-numbers": [
    { key: "position", type: "select", label: "Position", choices: [{ value: "bottom-center", label: "Bottom center" }, { value: "bottom-left", label: "Bottom left" }, { value: "bottom-right", label: "Bottom right" }] },
    { key: "startAt", type: "number", label: "Start at", min: 1 },
  ],
  "delete-pages": [{ key: "pages", type: "text", label: "Pages to delete (e.g. 2,4)" }],
  "extract-pages": [{ key: "pages", type: "text", label: "Pages to keep (e.g. 1,3,5-7)" }],
  "rearrange-pages": [{ key: "order", type: "text", label: "New page order (e.g. 3,1,2)" }],
  metadata: [
    { key: "title", type: "text", label: "Title" },
    { key: "author", type: "text", label: "Author" },
  ],
  flatten: [],
  redact: [
    { key: "page", type: "number", label: "Page number", min: 1 },
    { key: "x", type: "number", label: "X (pt)", min: 0 },
    { key: "y", type: "number", label: "Y (pt)", min: 0 },
    { key: "width", type: "number", label: "Width (pt)", min: 1 },
    { key: "height", type: "number", label: "Height (pt)", min: 1 },
  ],
  sign: [{ key: "text", type: "text", label: "Signature text" }],
};

async function runStep(file: File, step: WorkflowStep): Promise<File> {
  const o = step.options;
  let blob: Blob;
  switch (step.type) {
    case "rotate":
      blob = await rotatePdfClient(file, (Number(o.degrees) || 90) as 90 | 180 | 270);
      break;
    case "crop":
      blob = await cropPdfClient(file, (o.marginPercent as number) ?? 5);
      break;
    case "resize":
      blob = await resizePdfClient(file, { width: o.width as number, height: o.height as number, scalePercent: o.scalePercent as number });
      break;
    case "watermark":
      blob = await addWatermarkClient(file, (o.text as string) ?? "");
      break;
    case "header-footer":
      blob = await addHeaderFooterClient(file, { headerText: o.headerText as string, footerText: o.footerText as string });
      break;
    case "page-numbers":
      blob = await addPageNumbersClient(file, o.position as "bottom-center" | "bottom-left" | "bottom-right", o.startAt as number);
      break;
    case "delete-pages":
      blob = await deletePdfPagesClient(file, (o.pages as string) ?? "");
      break;
    case "extract-pages":
      blob = await extractPdfPagesClient(file, (o.pages as string) ?? "");
      break;
    case "rearrange-pages":
      blob = await rearrangePdfPagesClient(file, (o.order as string) ?? "");
      break;
    case "metadata":
      blob = await editPdfMetadataClient(file, { title: o.title as string, author: o.author as string });
      break;
    case "flatten":
      blob = await flattenPdfClient(file);
      break;
    case "redact":
      blob = await redactPdfClient(file, { page: o.page as number, x: o.x as number, y: o.y as number, width: o.width as number, height: o.height as number });
      break;
    case "sign":
      blob = await stampPdfClient(file, (o.text as string) ?? "");
      break;
  }
  return new File([blob], file.name, { type: "application/pdf" });
}

function makeStepId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function WorkflowBuilderTool({}: { tool: unknown }) {
  const { files, addFiles, removeFile, clearFiles, hasValidFiles, globalError } = useFileUpload({
    acceptFormats: ["pdf"],
    maxFileSizeMB: 50,
    maxFiles: 1,
  });
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  function addStep(type: StepType) {
    setSteps((prev) => [...prev, { id: makeStepId(), type, options: {} }]);
  }

  function updateStepOptions(id: string, options: Record<string, unknown>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, options } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function moveStep(id: string, direction: -1 | 1) {
    setSteps((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  async function handleRun() {
    const validFile = files.find((f) => f.status === "pending")?.file;
    if (!validFile) {
      setError("Upload a PDF first.");
      return;
    }
    if (steps.length === 0) {
      setError("Add at least one step.");
      return;
    }

    setError(null);
    setStatus("processing");
    try {
      let current = validFile;
      for (let i = 0; i < steps.length; i++) {
        setProgress(`Step ${i + 1} of ${steps.length}: ${STEP_LABELS[steps[i].type]}…`);
        current = await runStep(current, steps[i]);
      }
      downloadBlob(current, `workflow-result-${validFile.name}`);
      setStatus("done");
    } catch (err) {
      setError(err instanceof ClientPdfError ? err.message : "The workflow failed partway through.");
      setStatus("error");
    } finally {
      setProgress(null);
    }
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
        🔒 Every step runs locally in your browser — the file is never uploaded
      </div>

      <UploadZone
        files={files}
        acceptFormats={["pdf"]}
        maxFiles={1}
        globalError={globalError}
        onFilesAdded={addFiles}
        onRemove={removeFile}
        onClear={clearFiles}
      />

      {hasValidFiles && (
        <div style={{ marginTop: "var(--space-5)" }}>
          <h3 style={{ fontSize: 15 }}>Steps</h3>
          {steps.length === 0 && <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>No steps yet — add one below.</p>}

          {steps.map((step, i) => (
            <div key={step.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>
                  {i + 1}. {STEP_LABELS[step.type]}
                </strong>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => moveStep(step.id, -1)} disabled={i === 0} style={{ border: "none", background: "none", cursor: "pointer" }} aria-label="Move up">↑</button>
                  <button onClick={() => moveStep(step.id, 1)} disabled={i === steps.length - 1} style={{ border: "none", background: "none", cursor: "pointer" }} aria-label="Move down">↓</button>
                  <button onClick={() => removeStep(step.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--color-danger)" }} aria-label="Remove step">×</button>
                </div>
              </div>
              {STEP_FIELDS[step.type].length > 0 && (
                <DynamicOptionsForm fields={STEP_FIELDS[step.type]} options={step.options} setOptions={(o) => updateStepOptions(step.id, o)} />
              )}
            </div>
          ))}

          <select
            onChange={(e) => {
              if (e.target.value) addStep(e.target.value as StepType);
              e.target.value = "";
            }}
            defaultValue=""
            style={{ padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
          >
            <option value="" disabled>
              + Add a step…
            </option>
            {(Object.keys(STEP_LABELS) as StepType[]).map((type) => (
              <option key={type} value={type}>
                {STEP_LABELS[type]}
              </option>
            ))}
          </select>

          <div style={{ marginTop: "var(--space-4)" }}>
            <Button onClick={handleRun} disabled={status === "processing" || steps.length === 0}>
              {status === "processing" ? progress ?? "Running…" : "Run workflow"}
            </Button>
          </div>
        </div>
      )}

      {status === "done" && <p style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 8 }}>Download started.</p>}
      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

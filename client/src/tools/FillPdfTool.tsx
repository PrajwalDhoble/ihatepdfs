import { useState } from "react";
import { Tool } from "@shared/tools";
import Button from "@/components/Button";
import { inspectFillablePdf, createJob, getJobStatus, getJobDownloadUrl, ApiError, FormFieldInfo } from "@/services/api";

type Stage = "upload" | "fill" | "processing" | "done" | "error";

export default function FillPdfTool({ tool }: { tool: Tool }) {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  async function handleFileSelected(selected: File) {
    setError(null);
    setFile(selected);
    try {
      const detectedFields = await inspectFillablePdf(selected);
      if (detectedFields.length === 0) {
        setError("This PDF doesn't appear to have any fillable form fields.");
        return;
      }
      setFields(detectedFields);
      setStage("fill");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't read this PDF's form fields.");
    }
  }

  async function handleSubmit() {
    if (!file) return;
    setStage("processing");
    setError(null);
    try {
      const created = await createJob(tool.slug, [file], { values });
      let status = created;
      const start = Date.now();
      while (status.status !== "done" && status.status !== "failed") {
        if (Date.now() - start > 60_000) throw new ApiError("Processing timed out.", "TIMEOUT", 408);
        await new Promise((r) => setTimeout(r, 800));
        status = await getJobStatus(created.jobId);
      }
      if (status.status === "failed") throw new ApiError(status.error ?? "Processing failed.", "PROCESSING_FAILED", 500);
      setJobId(created.jobId);
      setStage("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Processing failed. Please try again.");
      setStage("error");
    }
  }

  if (stage === "done" && jobId) {
    return (
      <div style={{ padding: "var(--space-5)", background: "var(--color-primary-light)", border: "1px solid var(--color-primary)", borderRadius: "var(--radius-lg)" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Your filled PDF is ready</div>
        <a href={getJobDownloadUrl(jobId)}>
          <Button>Download result</Button>
        </a>
      </div>
    );
  }

  if (stage === "upload") {
    return (
      <div>
        <label
          style={{
            display: "block",
            padding: "var(--space-6)",
            border: "2px dashed var(--color-border)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            cursor: "pointer",
            background: "var(--color-bg-alt)",
          }}
        >
          <input
            type="file"
            accept=".pdf"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
          />
          Click to upload a PDF form
        </label>
        {error && <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
        Found {fields.length} field{fields.length === 1 ? "" : "s"} in <strong>{file?.name}</strong>.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {fields.map((field) => (
          <label key={field.name} style={{ fontSize: 13, fontWeight: 600 }}>
            {field.name}
            {field.type === "checkbox" ? (
              <input
                type="checkbox"
                style={{ display: "block", marginTop: 4 }}
                checked={Boolean(values[field.name])}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.checked })}
              />
            ) : field.type === "dropdown" || field.type === "radio" ? (
              <select
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
                value={(values[field.name] as string) ?? ""}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                style={{ display: "block", width: "100%", marginTop: 4, padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13 }}
                value={(values[field.name] as string) ?? ""}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button onClick={handleSubmit} disabled={stage === "processing"}>
          {stage === "processing" ? "Filling…" : "Fill PDF"}
        </Button>
      </div>

      {error && <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

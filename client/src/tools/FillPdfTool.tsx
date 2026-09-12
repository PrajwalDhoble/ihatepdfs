import { useState } from "react";
import Button from "@/components/Button";
import { downloadBlob } from "@/utils/downloadBlob";
import { inspectPdfFormClient, fillPdfFormClient, ClientFormFieldInfo, ClientPdfError } from "@/lib/clientPdf";

type Stage = "upload" | "fill" | "done";

export default function FillPdfTool() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<ClientFormFieldInfo[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(selected: File) {
    setError(null);
    setFile(selected);
    try {
      const detectedFields = await inspectPdfFormClient(selected);
      if (detectedFields.length === 0) {
        setError("This PDF doesn't appear to have any fillable form fields.");
        return;
      }
      setFields(detectedFields);
      setStage("fill");
    } catch (err) {
      setError(err instanceof ClientPdfError ? err.message : "Couldn't read this PDF's form fields.");
    }
  }

  async function handleSubmit() {
    if (!file) return;
    setError(null);
    try {
      const blob = await fillPdfFormClient(file, values);
      downloadBlob(blob, `filled-${file.name}`);
      setStage("done");
    } catch (err) {
      setError(err instanceof ClientPdfError ? err.message : "Couldn't fill this PDF.");
    }
  }

  const badge = (
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
      🔒 Processed locally in your browser — never uploaded
    </div>
  );

  if (stage === "done") {
    return (
      <div>
        {badge}
        <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>Download started.</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStage("upload");
            setFile(null);
            setValues({});
          }}
        >
          Fill another PDF
        </Button>
      </div>
    );
  }

  if (stage === "upload") {
    return (
      <div>
        {badge}
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
      {badge}
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
        <Button onClick={handleSubmit}>Fill PDF</Button>
      </div>

      {error && <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}

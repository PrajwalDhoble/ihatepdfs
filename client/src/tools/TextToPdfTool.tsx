import { useState } from "react";
import { textToPdfClient, ClientPdfError } from "@/lib/clientPdf";
import { downloadBlob } from "@/utils/downloadBlob";
import Button from "@/components/Button";

export default function TextToPdfTool({}: { tool: unknown }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");

  async function handleCreate() {
    setError(null);
    setStatus("processing");
    try {
      const blob = await textToPdfClient({ text, title: title || undefined });
      downloadBlob(blob, `${title || "document"}.pdf`);
      setStatus("done");
    } catch (err) {
      setError(err instanceof ClientPdfError ? err.message : "Couldn't create the PDF.");
      setStatus("idle");
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
        🔒 Created locally in your browser — nothing is uploaded
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 10 }}>
        Document title (optional)
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Document"
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            padding: "8px 10px",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
          }}
        />
      </label>

      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Text content
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Type or paste your text here…"
          style={{
            display: "block",
            width: "100%",
            marginTop: 4,
            padding: "var(--space-3)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
      </label>

      <div style={{ marginTop: "var(--space-4)" }}>
        <Button onClick={handleCreate} disabled={!text.trim() || status === "processing"}>
          {status === "processing" ? "Creating…" : "Create PDF"}
        </Button>
      </div>

      {status === "done" && <p style={{ fontSize: 13, color: "var(--color-ink-soft)", marginTop: 8 }}>Download started.</p>}
      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

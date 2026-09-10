import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { UploadedFile } from "@/hooks/useFileUpload";
import { formatBytes } from "@/utils/validation";
import Button from "./Button";

interface UploadZoneProps {
  files: UploadedFile[];
  acceptFormats: string[];
  maxFiles: number;
  globalError?: string | null;
  onFilesAdded: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function UploadZone({
  files,
  acceptFormats,
  maxFiles,
  globalError,
  onFilesAdded,
  onRemove,
  onClear,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) onFilesAdded(e.dataTransfer.files);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) onFilesAdded(e.target.files);
    e.target.value = ""; // allow re-selecting the same file
  }

  const acceptAttr = acceptFormats.map((f) => `.${f}`).join(",");

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload file. Accepted formats: ${acceptFormats.join(", ")}`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? "var(--color-primary)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-lg)",
          background: isDragging ? "var(--color-primary-light)" : "var(--color-bg-alt)",
          padding: "var(--space-8) var(--space-5)",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color 120ms ease, background-color 120ms ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptAttr}
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">📁</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          Drag and drop your {maxFiles > 1 ? "files" : "file"} here
        </div>
        <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: 12 }}>
          or click to browse — {acceptFormats.join(", ").toUpperCase()}
        </div>
        <Button type="button" size="sm" variant="secondary">
          Choose {maxFiles > 1 ? "Files" : "File"}
        </Button>
      </div>

      {globalError && (
        <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13, marginTop: 8 }}>
          {globalError}
        </p>
      )}

      {files.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: "var(--space-4) 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {files.map((f) => (
            <li
              key={f.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                border: `1px solid ${f.status === "error" ? "var(--color-danger)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-md)",
                fontSize: 13,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{f.file.name}</div>
                <div style={{ color: f.status === "error" ? "var(--color-danger)" : "var(--color-ink-soft)" }}>
                  {f.status === "error" ? f.error : formatBytes(f.file.size)}
                </div>
              </div>
              <button
                onClick={() => onRemove(f.id)}
                aria-label={`Remove ${f.file.name}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-soft)", fontSize: 18 }}
              >
                ×
              </button>
            </li>
          ))}
          <li>
            <button
              onClick={onClear}
              style={{ background: "none", border: "none", color: "var(--color-ink-soft)", fontSize: 13, cursor: "pointer", padding: 0 }}
            >
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

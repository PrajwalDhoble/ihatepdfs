import { ReactNode, useState } from "react";

interface TextUtilityToolProps {
  /** Runs synchronously or async; returning a string sets the output box. */
  run: (input: string, options: Record<string, unknown>) => string | Promise<string>;
  renderOptions?: (options: Record<string, unknown>, setOptions: (o: Record<string, unknown>) => void) => ReactNode;
  defaultOptions?: Record<string, unknown>;
  inputLabel?: string;
  outputLabel?: string;
  inputPlaceholder?: string;
  actionLabel?: string;
  /** If true, no input box is shown (e.g. Lorem Ipsum / UUID generators that only produce output). */
  noInput?: boolean;
  rows?: number;
}

const boxStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  resize: "vertical",
};

export default function TextUtilityTool({
  run,
  renderOptions,
  defaultOptions,
  inputLabel = "Input",
  outputLabel = "Output",
  inputPlaceholder,
  actionLabel = "Run",
  noInput = false,
  rows = 10,
}: TextUtilityToolProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<Record<string, unknown>>(defaultOptions ?? {});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleRun() {
    setError(null);
    try {
      const result = await run(input, options);
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        🔒 Runs entirely in your browser — nothing is uploaded
      </div>

      {!noInput && (
        <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: "var(--space-3)" }}>
          {inputLabel}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            rows={rows}
            style={{ ...boxStyle, marginTop: 4, display: "block" }}
          />
        </label>
      )}

      {renderOptions && <div style={{ marginBottom: "var(--space-3)" }}>{renderOptions(options, setOptions)}</div>}

      <button
        onClick={handleRun}
        style={{
          padding: "10px 18px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--color-primary)",
          color: "#fff",
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {actionLabel}
      </button>

      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {output && (
        <div style={{ marginTop: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{outputLabel}</label>
            <button
              onClick={handleCopy}
              style={{ fontSize: 12, background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "4px 10px", cursor: "pointer" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea readOnly value={output} rows={rows} style={boxStyle} />
        </div>
      )}
    </div>
  );
}

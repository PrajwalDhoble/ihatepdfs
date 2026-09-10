import { useMemo, useState } from "react";

function countStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed.length ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[.!?]+(\s|$)/g) ?? []).length || (trimmed ? 1 : 0) : 0;
  const paragraphs = trimmed ? trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0).length : 0;
  return { words, characters, charactersNoSpaces, sentences, paragraphs };
}

export default function WordCounterTool() {
  const [text, setText] = useState("");
  const stats = useMemo(() => countStats(text), [text]);

  const statBoxStyle: React.CSSProperties = {
    padding: "12px 16px",
    background: "var(--color-bg-alt)",
    borderRadius: "var(--radius-md)",
    textAlign: "center",
    flex: 1,
    minWidth: 90,
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your text here…"
        rows={10}
        style={{
          width: "100%",
          padding: "var(--space-4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          fontSize: 14,
          fontFamily: "inherit",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "var(--space-4)" }}>
        <div style={statBoxStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{stats.words}</div>
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Words</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{stats.characters}</div>
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Characters</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{stats.charactersNoSpaces}</div>
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Characters (no spaces)</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{stats.sentences}</div>
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Sentences</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontWeight: 800, fontSize: 20 }}>{stats.paragraphs}</div>
          <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>Paragraphs</div>
        </div>
      </div>
    </div>
  );
}

interface CompressImageOptionsProps {
  options: Record<string, unknown>;
  setOptions: (o: Record<string, unknown>) => void;
}

const PRESETS = [
  { id: "custom", label: "Custom" },
  { id: "best", label: "Best Quality", quality: 90 },
  { id: "balanced", label: "Balanced", quality: 75 },
  { id: "small", label: "Small File", quality: 50 },
  { id: "email", label: "Email (target 1MB)", targetSizeKB: 1024 },
  { id: "website", label: "Website (target 500KB)", targetSizeKB: 500 },
  { id: "social", label: "Social Media (target 200KB)", targetSizeKB: 200 },
];

const fieldStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
};

export function CompressImageOptions({ options, setOptions }: CompressImageOptionsProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Preset
        <select
          style={{ ...fieldStyle, display: "block", width: "100%", marginTop: 4 }}
          onChange={(e) => {
            const preset = PRESETS.find((p) => p.id === e.target.value);
            if (!preset || preset.id === "custom") return;
            setOptions({
              quality: preset.quality,
              targetSizeKB: preset.targetSizeKB,
            });
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Target size (KB) — optional, overrides quality
        <input
          type="number"
          min={10}
          style={{ ...fieldStyle, display: "block", width: "100%", marginTop: 4 }}
          value={(options.targetSizeKB as number) ?? ""}
          onChange={(e) =>
            setOptions({ ...options, targetSizeKB: e.target.value ? Number(e.target.value) : undefined })
          }
          placeholder="e.g. 500"
        />
      </label>

      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Quality (1–100, used when no target size is set)
        <input
          type="range"
          min={1}
          max={100}
          value={(options.quality as number) ?? 80}
          onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
    </div>
  );
}

export function CompressPdfOptions({ options, setOptions }: CompressImageOptionsProps) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600 }}>
      Compression level
      <select
        style={{ ...fieldStyle, display: "block", width: "100%", marginTop: 4 }}
        value={(options.quality as string) ?? "balanced"}
        onChange={(e) => setOptions({ ...options, quality: e.target.value })}
      >
        <option value="best">Best Quality</option>
        <option value="balanced">Balanced</option>
        <option value="small">Small File</option>
      </select>
    </label>
  );
}

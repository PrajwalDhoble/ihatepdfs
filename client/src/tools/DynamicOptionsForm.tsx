export type OptionField =
  | { key: string; type: "text"; label: string; placeholder?: string }
  | { key: string; type: "textarea"; label: string; placeholder?: string; rows?: number }
  | { key: string; type: "password"; label: string; placeholder?: string }
  | { key: string; type: "number"; label: string; min?: number; max?: number; placeholder?: string }
  | { key: string; type: "select"; label: string; choices: { value: string; label: string }[] }
  | { key: string; type: "range"; label: string; min: number; max: number };

interface DynamicOptionsFormProps {
  fields: OptionField[];
  options: Record<string, unknown>;
  setOptions: (o: Record<string, unknown>) => void;
}

const fieldStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
  display: "block",
  width: "100%",
  marginTop: 4,
};

export default function DynamicOptionsForm({ fields, options, setOptions }: DynamicOptionsFormProps) {
  function update(key: string, value: unknown) {
    setOptions({ ...options, [key]: value });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {fields.map((field) => (
        <label key={field.key} style={{ fontSize: 13, fontWeight: 600 }}>
          {field.label}
          {field.type === "text" && (
            <input
              type="text"
              style={fieldStyle}
              placeholder={field.placeholder}
              value={(options[field.key] as string) ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
            />
          )}
          {field.type === "textarea" && (
            <textarea
              style={{ ...fieldStyle, minHeight: (field.rows ?? 8) * 20, fontFamily: "inherit", resize: "vertical" }}
              placeholder={field.placeholder}
              rows={field.rows ?? 8}
              value={(options[field.key] as string) ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
            />
          )}
          {field.type === "password" && (
            <input
              type="password"
              style={fieldStyle}
              placeholder={field.placeholder}
              value={(options[field.key] as string) ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
              autoComplete="off"
            />
          )}
          {field.type === "number" && (
            <input
              type="number"
              style={fieldStyle}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              value={(options[field.key] as number) ?? ""}
              onChange={(e) => update(field.key, e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
          {field.type === "select" && (
            <select
              style={fieldStyle}
              value={(options[field.key] as string) ?? field.choices[0]?.value}
              onChange={(e) => update(field.key, e.target.value)}
            >
              {field.choices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
          {field.type === "range" && (
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={(options[field.key] as number) ?? field.min}
              onChange={(e) => update(field.key, Number(e.target.value))}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          )}
        </label>
      ))}
    </div>
  );
}

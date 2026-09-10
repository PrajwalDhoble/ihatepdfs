import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchTools, Tool } from "@shared/tools";

interface SearchBoxProps {
  compact?: boolean;
  placeholder?: string;
}

export default function SearchBox({ compact = false, placeholder }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tool[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setResults(query.trim() ? searchTools(query) : []);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToTool(tool: Tool) {
    setOpen(false);
    setQuery("");
    navigate(`/${tool.slug}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) goToTool(results[0]);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <form onSubmit={handleSubmit} role="search" aria-label="Tool search">
        <label htmlFor="tool-search" className="visually-hidden">
          What do you want to do?
        </label>
        <input
          id="tool-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "What do you want to do?"}
          style={{
            width: "100%",
            padding: compact ? "8px 14px" : "16px 20px",
            fontSize: compact ? 14 : 16,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            outline: "none",
          }}
          autoComplete="off"
        />
      </form>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 6,
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            listStyle: "none",
            padding: 4,
            zIndex: 100,
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {results.map((tool) => (
            <li key={tool.id}>
              <button
                onClick={() => goToTool(tool)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "var(--color-ink)",
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <strong>{tool.name}</strong>
                <div style={{ fontSize: 12, color: "var(--color-ink-soft)" }}>{tool.description}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

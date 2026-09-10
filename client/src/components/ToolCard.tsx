import { Link } from "react-router-dom";
import { Tool } from "@shared/tools";

export default function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={`/${tool.slug}`}
      style={{
        display: "block",
        padding: "var(--space-5)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--color-bg)",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 120ms ease, transform 120ms ease",
        position: "relative",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {tool.status === "coming-soon" && (
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-warning)",
            background: "#fff6e0",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          Coming Soon
        </span>
      )}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{tool.name}</div>
      <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>{tool.description}</div>
    </Link>
  );
}

import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CATEGORIES } from "@shared/tools";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";

const CATEGORY_ICONS: Record<string, string> = {
  pdf: "📄",
  image: "🖼️",
  document: "📁",
  converter: "🔄",
  text: "✏️",
  data: "📊",
  business: "💼",
  security: "🔒",
  time: "⏱️",
  developer: "🛠️",
  ai: "✨",
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 80,
          width: 38,
          height: 38,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          boxShadow: "var(--shadow-sm)",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        ☰
      </button>

      <div className={`sidebar-overlay${isOpen ? " is-open" : ""}`} onClick={() => setIsOpen(false)} />

      <aside
        className={`sidebar${isOpen ? " is-open" : ""}${collapsed ? " is-collapsed" : ""}`}
        aria-label="Sidebar navigation"
      >
        <div style={{ padding: collapsed ? "var(--space-4) var(--space-2)" : "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", minHeight: 32 }}>
            {!collapsed && (
              <Link to="/" onClick={() => setIsOpen(false)} style={{ fontWeight: 800, fontSize: 17, color: "var(--color-ink)", textDecoration: "none", letterSpacing: "-0.01em" }}>
                I <span style={{ color: "var(--color-primary)" }}>Hate</span> PDF
              </Link>
            )}
            {collapsed && (
              <Link to="/" onClick={() => setIsOpen(false)} style={{ fontWeight: 800, fontSize: 18, color: "var(--color-primary)", textDecoration: "none" }}>
                IH
              </Link>
            )}
          </div>

          {!collapsed && <SearchBox compact placeholder="Search tools…" />}

          <nav aria-label="Categories" style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {CATEGORIES.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/${cat.slug}`}
                onClick={() => setIsOpen(false)}
                title={collapsed ? cat.name : undefined}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "10px 0" : "9px 10px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: isActive ? "var(--color-primary)" : "var(--color-ink-soft)",
                  background: isActive ? "var(--color-primary-light)" : "transparent",
                  textDecoration: "none",
                  transition: "background-color 120ms ease, color 120ms ease",
                })}
              >
                <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>{CATEGORY_ICONS[cat.id] ?? "•"}</span>
                {!collapsed && <span>{cat.name}</span>}
              </NavLink>
            ))}
          </nav>

          {!collapsed && (
            <>
              <Link
                to="/all-tools"
                onClick={() => setIsOpen(false)}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none", padding: "9px 10px" }}
              >
                View all tools →
              </Link>
              <Link
                to="/blog"
                onClick={() => setIsOpen(false)}
                style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-soft)", textDecoration: "none", padding: "0 10px" }}
              >
                Blog
              </Link>
            </>
          )}
        </div>

        <div
          style={{
            padding: collapsed ? "var(--space-3) var(--space-2)" : "var(--space-3) var(--space-4)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 8,
          }}
        >
          {!collapsed && (
            <Link to="/help" onClick={() => setIsOpen(false)} style={{ fontSize: 12.5, color: "var(--color-ink-soft)" }}>
              Help
            </Link>
          )}
          <ThemeToggle />
          <button
            className="hide-on-mobile"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg)",
              cursor: "pointer",
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
      </aside>
    </>
  );
}

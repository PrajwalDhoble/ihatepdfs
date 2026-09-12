import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CATEGORIES } from "@shared/tools";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 80,
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ☰
      </button>

      <div className={`sidebar-overlay${isOpen ? " is-open" : ""}`} onClick={() => setIsOpen(false)} />

      <aside className={`sidebar${isOpen ? " is-open" : ""}`} aria-label="Sidebar navigation">
        <div style={{ padding: "var(--space-5) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              style={{ fontWeight: 800, fontSize: 18, color: "var(--color-ink)", textDecoration: "none" }}
            >
              Repair<span style={{ color: "var(--color-primary)" }}>My</span>PDF
            </Link>
            <ThemeToggle />
          </div>

          <SearchBox compact placeholder="Search tools…" />

          <nav aria-label="Categories" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {CATEGORIES.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/${cat.slug}`}
                onClick={() => setIsOpen(false)}
                style={({ isActive }) => ({
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: isActive ? "var(--color-primary)" : "var(--color-ink-soft)",
                  background: isActive ? "var(--color-primary-light)" : "transparent",
                  textDecoration: "none",
                })}
              >
                {cat.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div style={{ padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
          <Link to="/help" onClick={() => setIsOpen(false)} style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
            Help
          </Link>
        </div>
      </aside>
    </>
  );
}

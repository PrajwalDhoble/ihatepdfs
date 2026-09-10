import { Link, NavLink } from "react-router-dom";
import { CATEGORIES } from "@shared/tools";
import SearchBox from "./SearchBox";
import ThemeToggle from "./ThemeToggle";

const NAV_CATEGORIES = CATEGORIES.slice(0, 5); // PDF, Image, Document, Converter, Text

export default function Navbar() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        background: "var(--color-bg)",
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: "var(--space-6)", height: 64 }}
      >
        <Link
          to="/"
          style={{ fontWeight: 800, fontSize: 20, color: "var(--color-ink)", textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Repair<span style={{ color: "var(--color-primary)" }}>My</span>PDF
        </Link>

        <nav
          aria-label="Primary"
          style={{ display: "flex", gap: "var(--space-5)", flex: 1 }}
          className="nav-links"
        >
          {NAV_CATEGORIES.map((cat) => (
            <NavLink
              key={cat.id}
              to={`/${cat.slug}`}
              style={({ isActive }) => ({
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? "var(--color-primary)" : "var(--color-ink-soft)",
                textDecoration: "none",
              })}
            >
              {cat.name}
            </NavLink>
          ))}
        </nav>

        <div style={{ minWidth: 220, maxWidth: 320, flex: "0 1 320px" }}>
          <SearchBox compact />
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}

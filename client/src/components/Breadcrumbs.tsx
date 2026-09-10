import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: "var(--space-4)" }}>
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6, padding: 0, margin: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {item.href ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

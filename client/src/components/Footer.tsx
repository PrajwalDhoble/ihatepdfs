import { Link } from "react-router-dom";
import { CATEGORIES } from "@shared/tools";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg-alt)", marginTop: "var(--space-8)" }}>
      <div className="container" style={{ padding: "var(--space-7) var(--space-5)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "var(--space-6)",
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>RepairMyPDF</div>
            <p style={{ fontSize: 13, maxWidth: 220 }}>Fix, convert and optimize your files. Fast, simple and secure — no installation required.</p>
          </div>

          <div>
            <h4 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--color-ink-soft)" }}>Categories</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link to={`/${c.slug}`} style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--color-ink-soft)" }}>Popular tools</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><Link to="/compress-pdf" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Compress PDF</Link></li>
              <li><Link to="/merge-pdf" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Merge PDF</Link></li>
              <li><Link to="/compress-image" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Compress Image</Link></li>
              <li><Link to="/jpg-to-pdf" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>JPG to PDF</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: 13, textTransform: "uppercase", color: "var(--color-ink-soft)" }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><Link to="/about" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>About</Link></li>
              <li><Link to="/contact" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Contact</Link></li>
              <li><Link to="/privacy" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Privacy</Link></li>
              <li><Link to="/terms" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Terms</Link></li>
              <li><Link to="/security" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Security</Link></li>
              <li><Link to="/help" style={{ fontSize: 14, color: "var(--color-ink-soft)" }}>Help</Link></li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)", fontSize: 12, color: "var(--color-ink-soft)" }}>
          © {new Date().getFullYear()} RepairMyPDF. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

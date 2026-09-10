import { CATEGORIES, getToolBySlug } from "@shared/tools";
import SEOHead from "@/components/SEOHead";
import SearchBox from "@/components/SearchBox";
import ToolCard from "@/components/ToolCard";
import FAQ from "@/components/FAQ";
import AdSlot from "@/components/AdSlot";
import { Link } from "react-router-dom";
import { buildWebsiteSchema, buildOrganizationSchema } from "@/seo/structuredData";

const POPULAR_SLUGS = ["compress-pdf", "merge-pdf", "split-pdf", "pdf-to-jpg", "jpg-to-pdf", "compress-image", "resize-image"];

const TRUST_POINTS = [
  { title: "Fast", text: "Most files process in seconds, not minutes." },
  { title: "Simple", text: "No learning curve — upload, process, download." },
  { title: "Secure", text: "Files are processed temporarily and removed automatically." },
  { title: "No installation", text: "Works entirely in your browser." },
];

const HOME_FAQ = [
  { q: "Do I need an account to use RepairMyPDF?", a: "No — most basic tools work without creating an account." },
  { q: "Is RepairMyPDF free to use?", a: "Yes, core tools are free. Optional Pro features may be added in the future for larger files and higher limits." },
  { q: "Are my files stored permanently?", a: "No. Files are processed in a temporary, isolated workspace and automatically deleted after processing." },
];

export default function Home() {
  const popularTools = POPULAR_SLUGS.map(getToolBySlug).filter(Boolean) as NonNullable<ReturnType<typeof getToolBySlug>>[];

  return (
    <>
      <SEOHead
        title="RepairMyPDF — Fix, Convert and Optimize Your Files Online"
        description="Simple online tools for PDFs, images and documents. Compress, convert, merge, split and optimize files in seconds. No installation, no account required."
        canonical="/"
        structuredData={[buildWebsiteSchema(), buildOrganizationSchema()]}
      />

      <section style={{ textAlign: "center", padding: "var(--space-8) 0 var(--space-6)" }}>
        <div className="container">
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800 }}>
            Fix, convert and optimize your files.
          </h1>
          <p style={{ maxWidth: 560, margin: "0 auto var(--space-6)", fontSize: 16 }}>
            Simple online tools for PDFs, images and documents. Compress, convert, merge, split and optimize files in seconds.
          </p>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <SearchBox placeholder="What do you want to do? e.g. Compress PDF, Reduce JPG to 100KB" />
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-6)" }}>
        <h2 style={{ fontSize: 20 }}>Popular tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-7)" }}>
        <AdSlot placement="in-content" />
      </section>

      <section className="container" style={{ marginTop: "var(--space-6)" }}>
        <h2 style={{ fontSize: 20 }}>Browse by category</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              to={`/${cat.slug}`}
              style={{
                display: "block",
                padding: "var(--space-4)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 700 }}>{cat.name}</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>{cat.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-7)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          {TRUST_POINTS.map((point) => (
            <div key={point.title} style={{ padding: "var(--space-4)", background: "var(--color-bg-alt)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{point.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>{point.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-7)", marginBottom: "var(--space-8)" }}>
        <FAQ items={HOME_FAQ} />
      </section>
    </>
  );
}

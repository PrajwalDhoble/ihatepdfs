import { CATEGORIES, getToolBySlug } from "@shared/tools";
import SEOHead from "@/components/SEOHead";
import SearchBox from "@/components/SearchBox";
import ToolCard from "@/components/ToolCard";
import FAQ from "@/components/FAQ";
import { Link } from "react-router-dom";
import { buildWebsiteSchema, buildOrganizationSchema } from "@/seo/structuredData";
import { useRecentTools } from "@/hooks/useRecentTools";

const POPULAR_SLUGS = ["compress-pdf", "merge-pdf", "split-pdf", "pdf-to-jpg", "jpg-to-pdf", "compress-image", "resize-image"];

const TRUST_POINTS = [
  { title: "Fast", text: "Most files process in seconds — many tools run instantly in your browser." },
  { title: "Simple", text: "No learning curve — upload, process, download." },
  { title: "Private", text: "PDF page tools process locally and are never uploaded. No watermark, ever." },
  { title: "No installation", text: "Works entirely in your browser, on any device." },
];

const HOME_FAQ = [
  { q: "Do I need an account to use I Hate PDF?", a: "No — no tool requires an account or sign-up." },
  { q: "Is I Hate PDF free to use?", a: "Yes, all core tools are free with no watermark added to your files." },
  { q: "Are my files ever uploaded to a server?", a: "For most PDF page tools (merge, split, rotate, watermark, and more), no — they run entirely in your browser and the file never leaves your device. Tools that need format conversion or OCR do process on a server, in an isolated, temporary workspace that's deleted immediately afterward." },
];

export default function Home() {
  const popularTools = POPULAR_SLUGS.map(getToolBySlug).filter(Boolean) as NonNullable<ReturnType<typeof getToolBySlug>>[];
  const { recentSlugs } = useRecentTools();
  const recentTools = recentSlugs.map(getToolBySlug).filter(Boolean) as NonNullable<ReturnType<typeof getToolBySlug>>[];

  return (
    <>
      <SEOHead
        title="I Hate PDF — Fix, Convert and Optimize Your Files Online"
        description="Simple online tools for PDFs, images and documents. Compress, convert, merge, split and optimize files in seconds. No installation, no account required."
        canonical="/"
        structuredData={[buildWebsiteSchema(), buildOrganizationSchema()]}
      />

      <section
        style={{
          textAlign: "center",
          padding: "var(--space-8) 0 var(--space-7)",
          background: "linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg) 65%)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--color-primary)",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              padding: "6px 14px",
              borderRadius: 999,
              marginBottom: "var(--space-4)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            ✨ 80+ free tools · no sign-up
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5.5vw, 52px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Fix, convert and optimize your files.
          </h1>
          <p style={{ maxWidth: 580, margin: "var(--space-4) auto var(--space-6)", fontSize: 17, color: "var(--color-ink-soft)" }}>
            Simple online tools for PDFs, images and documents. Compress, convert, merge, split and optimize files in seconds.
          </p>
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <SearchBox placeholder="What do you want to do? e.g. Compress PDF, Reduce JPG to 100KB" />
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: "var(--space-7)" }}>
        <h2 style={{ fontSize: 20 }}>Popular tools</h2>
        <div className="responsive-grid">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {recentTools.length > 0 && (
        <section className="container" style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{ fontSize: 20 }}>Recently used</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
            {recentTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      )}

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

import { useParams, Navigate, Link } from "react-router-dom";
import { getToolBySlug, getCategory } from "@shared/tools";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import FAQ from "@/components/FAQ";
import RelatedTools from "@/components/RelatedTools";
import AdSlot from "@/components/AdSlot";
import { buildToolSchema, buildBreadcrumbSchema } from "@/seo/structuredData";
import { renderActiveTool } from "@/tools/activeToolRegistry";

interface ToolPageProps {
  /** Optional override, used when resolved from a bare top-level slug. */
  slug?: string;
}

export default function ToolPage({ slug }: ToolPageProps) {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const resolvedSlug = slug ?? toolSlug;
  const tool = resolvedSlug ? getToolBySlug(resolvedSlug) : undefined;

  if (!tool) return <Navigate to="/404" replace />;

  const category = getCategory(tool.category);
  const isActive = tool.status === "active";

  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)" }}>
      <SEOHead
        title={tool.seo.title}
        description={tool.seo.description}
        canonical={tool.seo.canonical}
        structuredData={[
          ...buildToolSchema(tool),
          buildBreadcrumbSchema([
            { label: "Home", href: "/" },
            ...(category ? [{ label: category.name, href: `/${category.slug}` }] : []),
            { label: tool.name },
          ]),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category ? [{ label: category.name, href: `/${category.slug}` }] : []),
          { label: tool.name },
        ]}
      />

      <h1>{tool.seo.h1}</h1>
      <p style={{ maxWidth: 640 }}>{tool.description}</p>

      {!isActive && (
        <div
          role="status"
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-warning)",
            background: "#fff6e0",
            padding: "4px 10px",
            borderRadius: 999,
            marginBottom: "var(--space-4)",
          }}
        >
          Coming Soon — this tool is not yet available
        </div>
      )}

      <div style={{ maxWidth: 640 }}>
        {isActive ? (
          renderActiveTool(tool)
        ) : (
          <ComingSoonPlaceholder tool={tool} />
        )}
      </div>

      <AdSlot placement="below-tool" />

      <section style={{ marginTop: "var(--space-7)", maxWidth: 720 }}>
        {tool.slug !== "word-counter" && (
          <>
            <h2 style={{ fontSize: 20 }}>How to use {tool.name.toLowerCase()}</h2>
            <ol style={{ paddingLeft: 20, fontSize: 14, color: "var(--color-ink-soft)" }}>
              <li>Upload your {tool.inputFormats.join(" or ").toUpperCase() || "file"}.</li>
              <li>Adjust any available options.</li>
              <li>Click "{tool.name}" and wait for processing to finish.</li>
              <li>Download your result — files are removed automatically afterward.</li>
            </ol>
          </>
        )}

        <h2 style={{ fontSize: 20 }}>Privacy &amp; security</h2>
        <p style={{ fontSize: 14 }}>
          Files are processed in an isolated, temporary workspace and are not stored permanently. See our{" "}
          <Link to="/privacy">Privacy Policy</Link> for details.
        </p>
      </section>

      <FAQ items={tool.faq} />
      <RelatedTools slugs={tool.relatedTools} />
    </div>
  );
}

/** Honest placeholder for tools whose processor isn't implemented yet — no fake upload/process flow. */
function ComingSoonPlaceholder({ tool }: { tool: ReturnType<typeof getToolBySlug> }) {
  return (
    <div
      style={{
        padding: "var(--space-6)",
        border: "1px dashed var(--color-border)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center",
        color: "var(--color-ink-soft)",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">🛠️</div>
      <p style={{ margin: 0 }}>
        {tool?.name} is coming soon. We're still building this processor — check back shortly, or explore the
        related tools below.
      </p>
    </div>
  );
}

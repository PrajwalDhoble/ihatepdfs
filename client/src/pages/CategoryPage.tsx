import { useParams, Navigate } from "react-router-dom";
import { CATEGORIES, getToolsByCategory } from "@shared/tools";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";
import { buildBreadcrumbSchema } from "@/seo/structuredData";

interface CategoryPageProps {
  /** Optional override, used when resolved from a bare top-level slug. */
  slug?: string;
}

export default function CategoryPage({ slug }: CategoryPageProps) {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const resolvedSlug = slug ?? categorySlug;
  const category = CATEGORIES.find((c) => c.slug === resolvedSlug);

  if (!category) return <Navigate to="/404" replace />;

  const tools = getToolsByCategory(category.id);

  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)" }}>
      <SEOHead
        title={`${category.name} — Free Online ${category.name} | I Hate PDF`}
        description={category.description}
        canonical={`/${category.slug}`}
        structuredData={buildBreadcrumbSchema([{ label: "Home", href: "/" }, { label: category.name }])}
      />

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.name }]} />

      <h1>{category.name}</h1>
      <p style={{ maxWidth: 620 }}>{category.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {tools.length === 0 && <p>No tools in this category yet. Check back soon.</p>}

    </div>
  );
}

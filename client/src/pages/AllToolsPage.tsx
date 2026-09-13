import { CATEGORIES, getToolsByCategory } from "@shared/tools";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import ToolCard from "@/components/ToolCard";

export default function AllToolsPage() {
  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)" }}>
      <SEOHead
        title="All Tools | I Hate PDF"
        description="Browse every PDF, image, document, text, data, business, security, time, developer and AI tool available."
        canonical="/all-tools"
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Tools" }]} />
      <h1>All Tools</h1>
      <p style={{ maxWidth: 640 }}>Every tool, grouped by category.</p>

      {CATEGORIES.map((cat) => {
        const tools = getToolsByCategory(cat.id);
        if (tools.length === 0) return null;
        return (
          <section key={cat.id} style={{ marginTop: "var(--space-7)" }}>
            <h2 style={{ fontSize: 18 }}>{cat.name}</h2>
            <div className="responsive-grid">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

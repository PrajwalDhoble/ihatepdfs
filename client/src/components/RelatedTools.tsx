import { getToolBySlug } from "@shared/tools";
import ToolCard from "./ToolCard";

export default function RelatedTools({ slugs }: { slugs: string[] }) {
  const tools = slugs.map(getToolBySlug).filter(Boolean) as NonNullable<ReturnType<typeof getToolBySlug>>[];
  if (!tools.length) return null;

  return (
    <section style={{ marginTop: "var(--space-7)" }} aria-labelledby="related-tools-heading">
      <h2 id="related-tools-heading" style={{ fontSize: 20 }}>Related tools</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </section>
  );
}

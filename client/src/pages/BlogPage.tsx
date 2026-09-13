import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import { BLOG_POSTS } from "@/blog/posts";

export default function BlogPage() {
  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)", maxWidth: 860 }}>
      <SEOHead
        title="Blog | I Hate PDF"
        description="Practical guides on PDF compression, image optimization, document conversion, security and file management."
        canonical="/blog"
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <h1>Blog</h1>
      <p style={{ maxWidth: 640 }}>Practical guides on getting the most out of your files.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: "var(--space-5)" }}>
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="tool-card-polished"
            style={{
              display: "block",
              padding: "var(--space-5)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              textDecoration: "none",
              color: "inherit",
              marginBottom: "var(--space-3)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
              {post.category}
            </div>
            <h2 style={{ fontSize: 18, margin: "0 0 6px" }}>{post.title}</h2>
            <p style={{ margin: 0, fontSize: 14 }}>{post.description}</p>
            <div style={{ fontSize: 12, color: "var(--color-ink-soft)", marginTop: 8 }}>
              {new Date(post.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

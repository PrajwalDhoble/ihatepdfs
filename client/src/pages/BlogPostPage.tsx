import { useParams, Navigate, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";
import RelatedTools from "@/components/RelatedTools";
import { getBlogPost } from "@/blog/posts";
import { buildBreadcrumbSchema } from "@/seo/structuredData";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/404" replace />;

  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)", maxWidth: 720 }}>
      <SEOHead
        title={`${post.title} | I Hate PDF Blog`}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        structuredData={buildBreadcrumbSchema([{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }])}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {post.category}
      </div>
      <h1>{post.title}</h1>
      <div style={{ fontSize: 13, color: "var(--color-ink-soft)", marginBottom: "var(--space-5)" }}>
        {new Date(post.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.7 }}>
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <RelatedTools slugs={post.relatedTools} />

      <div style={{ marginTop: "var(--space-6)" }}>
        <Link to="/blog">← Back to Blog</Link>
      </div>
    </div>
  );
}

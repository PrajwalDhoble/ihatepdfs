import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
      <SEOHead title="Page Not Found | I Hate PDF" description="The page you're looking for doesn't exist." canonical="/404" />
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/">Back to homepage</Link>
    </div>
  );
}

import { Routes, Route, useParams, Navigate } from "react-router-dom";
import { getCategory, getToolBySlug } from "@shared/tools";
import MainLayout from "@/layouts/MainLayout";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ToolPage from "@/pages/ToolPage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Security from "@/pages/Security";
import Help from "@/pages/Help";
import AllToolsPage from "@/pages/AllToolsPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />

        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="security" element={<Security />} />
        <Route path="help" element={<Help />} />
        <Route path="all-tools" element={<AllToolsPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="blog/:slug" element={<BlogPostPage />} />

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<ResolveSlug />} />
      </Route>
    </Routes>
  );
}

// Resolves a bare top-level slug (e.g. "/compress-pdf") as either a category
// or a tool page, since both live at the site root for clean SEO URLs.
function ResolveSlug() {
  const params = useParams();
  const slug = params["*"] ?? "";
  const topSlug = slug.split("/")[0];

  if (getCategory(topSlug)) return <CategoryPage slug={topSlug} />;
  if (getToolBySlug(topSlug)) return <ToolPage slug={topSlug} />;
  return <Navigate to="/404" replace />;
}

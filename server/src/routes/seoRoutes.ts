import { Router } from "express";
import { getAllTools, CATEGORIES } from "../../../shared/tools/index.js";
const router = Router();
const SITE_URL = process.env.SITE_URL ?? "https://www.repairmypdf.com";

// Only real, active, indexable tool + category pages ever appear here —
// no job/upload/download URLs, no query-parameter duplicates, no
// coming-soon pages until they're genuinely ready.
router.get("/sitemap.xml", (_req, res) => {
  const staticPaths = ["/", "/about", "/contact", "/privacy", "/terms", "/security", "/help"];
  const categoryPaths = CATEGORIES.map((c) => `/${c.slug}`);
  const toolPaths = getAllTools()
    .filter((t) => t.status === "active")
    .map((t) => t.seo.canonical);

  const urls = [...staticPaths, ...categoryPaths, ...toolPaths];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>`;

  res.type("application/xml").send(xml);
});

router.get("/robots.txt", (_req, res) => {
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;
  res.type("text/plain").send(body);
});

export default router;

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllTools, CATEGORIES } from "../../shared/tools/index.ts";

/**
 * Generates sitemap.xml and robots.txt as STATIC files in client/public/
 * at build time, run automatically via the "prebuild" npm script. This is
 * deliberately independent of whether the Express backend is deployed or
 * reachable — the frontend (static hosting: Vercel/Netlify/S3/nginx) and
 * backend (a persistent Node host: Render/Railway/Fly/a VPS) are commonly
 * deployed separately, and Search Console needs the sitemap to work no
 * matter what the backend's status is. The old dynamic server routes at
 * server/src/routes/seoRoutes.ts still exist for setups where a single
 * server serves both, but this static version is what should actually be
 * indexed for a split frontend/backend deployment.
 */
 
const SITE_URL = process.env.VITE_SITE_URL ?? "https://www.ihatepdf.net";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(currentDir, "../public");

function generateSitemap(): string {
  const staticPaths = ["/", "/about", "/contact", "/privacy", "/terms", "/security", "/help"];
  const categoryPaths = CATEGORIES.map((c) => `/${c.slug}`);
  const toolPaths = getAllTools()
    .filter((t) => t.status === "active")
    .map((t) => t.seo.canonical);

  const urls = [...staticPaths, ...categoryPaths, ...toolPaths];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>
`;
}

function generateRobots(): string {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), generateSitemap());
fs.writeFileSync(path.join(publicDir, "robots.txt"), generateRobots());

console.log(`[seo] Generated sitemap.xml and robots.txt for ${SITE_URL} in ${publicDir}`);
console.log(`[seo] ${getAllTools().filter((t) => t.status === "active").length} active tool URLs included.`);

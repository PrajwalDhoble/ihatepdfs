import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { getAllTools, CATEGORIES } from "../shared/tools";

/**
 * Generates sitemap.xml and robots.txt directly into the build output.
 * Implemented as a Vite plugin (closeBundle hook) rather than an npm
 * "prebuild" lifecycle script — some hosting platforms' build pipelines
 * (Vercel among them, depending on the configured Build Command) invoke
 * `vite build` directly and don't reliably run package.json's prebuild
 * hooks. Hooking into the actual Vite build guarantees this runs on every
 * build, regardless of the exact command a platform uses to trigger it.
 */
function seoFilesPlugin(): Plugin {
  return {
    name: "generate-seo-files",
    closeBundle() {
      const siteUrl = process.env.VITE_SITE_URL ?? "https://www.repairmypdf.com";
      const outDir = path.resolve(__dirname, "dist");

      const staticPaths = ["/", "/about", "/contact", "/privacy", "/terms", "/security", "/help"];
      const categoryPaths = CATEGORIES.map((c) => `/${c.slug}`);
      const toolPaths = getAllTools()
        .filter((t) => t.status === "active")
        .map((t) => t.seo.canonical);
      const urls = [...staticPaths, ...categoryPaths, ...toolPaths];

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`).join("\n")}
</urlset>
`;
      const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
      fs.writeFileSync(path.join(outDir, "robots.txt"), robots);

      // eslint-disable-next-line no-console
      console.log(`[seo] Wrote sitemap.xml + robots.txt to ${outDir} (${urls.length} URLs, site: ${siteUrl})`);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), seoFilesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});

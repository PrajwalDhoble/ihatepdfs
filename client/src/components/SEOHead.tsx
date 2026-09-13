import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string; // path starting with "/"
  structuredData?: object | object[];
}

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://ihatepdf.net";

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Lightweight, dependency-free SEO head manager. Sets document title, meta
 * description, canonical link, Open Graph tags and JSON-LD structured data.
 * For production, tool/category routes should also be prerendered at build
 * time so crawlers see final HTML without executing JS.
 */
export default function SEOHead({ title, description, canonical, structuredData }: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    setMeta("description", description);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", `${SITE_URL}${canonical}`);

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", `${SITE_URL}${canonical}`, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", `${SITE_URL}/og-image.png`, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", `${SITE_URL}/og-image.png`);

    const scriptId = "seo-structured-data";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, structuredData]);

  return null;
}

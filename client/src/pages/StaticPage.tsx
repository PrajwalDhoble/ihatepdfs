import { ReactNode } from "react";
import SEOHead from "@/components/SEOHead";
import Breadcrumbs from "@/components/Breadcrumbs";

interface StaticPageProps {
  title: string;
  description: string;
  canonical: string;
  children: ReactNode;
}

export default function StaticPage({ title, description, canonical, children }: StaticPageProps) {
  return (
    <div className="container" style={{ padding: "var(--space-6) 0 var(--space-8)", maxWidth: 760 }}>
      <SEOHead title={`${title} | RepairMyPDF`} description={description} canonical={canonical} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <h1>{title}</h1>
      <div style={{ fontSize: 15 }}>{children}</div>
    </div>
  );
}

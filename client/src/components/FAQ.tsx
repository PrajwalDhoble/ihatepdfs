import { useState } from "react";
import { ToolFAQ } from "@shared/tools";

export default function FAQ({ items }: { items: ToolFAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  if (!items.length) return null;

  return (
    <section aria-labelledby="faq-heading" style={{ marginTop: "var(--space-7)" }}>
      <h2 id="faq-heading" style={{ fontSize: 20 }}>Frequently asked questions</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {item.q}
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p style={{ padding: "0 16px 14px", margin: 0, fontSize: 14 }}>{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

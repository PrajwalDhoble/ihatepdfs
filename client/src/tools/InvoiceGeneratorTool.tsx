import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { downloadBlob } from "@/utils/downloadBlob";

interface LineItem {
  description: string;
  quantity: string;
  price: string;
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "8px 10px",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  fontSize: 13,
};

export default function InvoiceGeneratorTool() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: "1", price: "0" }]);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: "1", price: "0" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function generateInvoice() {
    setError(null);
    const validItems = items.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError("Add at least one line item with a description.");
      return;
    }

    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const margin = 56;
    let y = 792 - margin;

    page.drawText("INVOICE", { x: margin, y, size: 24, font: bold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(invoiceNumber, { x: 612 - margin - font.widthOfTextAtSize(invoiceNumber, 12), y: y + 4, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 40;

    page.drawText("From:", { x: margin, y, size: 10, font: bold });
    page.drawText("To:", { x: margin + 260, y, size: 10, font: bold });
    y -= 16;
    from.split("\n").forEach((line) => {
      page.drawText(line, { x: margin, y, size: 10, font });
      y -= 14;
    });
    let toY = y + from.split("\n").length * 14;
    to.split("\n").forEach((line) => {
      page.drawText(line, { x: margin + 260, y: toY, size: 10, font });
      toY -= 14;
    });
    y = Math.min(y, toY) - 30;

    // Table header
    page.drawLine({ start: { x: margin, y: y + 4 }, end: { x: 612 - margin, y: y + 4 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    page.drawText("Description", { x: margin, y, size: 10, font: bold });
    page.drawText("Qty", { x: margin + 320, y, size: 10, font: bold });
    page.drawText("Price", { x: margin + 380, y, size: 10, font: bold });
    page.drawText("Total", { x: margin + 460, y, size: 10, font: bold });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: 612 - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 18;

    let grandTotal = 0;
    for (const item of validItems) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      const lineTotal = qty * price;
      grandTotal += lineTotal;

      page.drawText(item.description.slice(0, 45), { x: margin, y, size: 10, font });
      page.drawText(String(qty), { x: margin + 320, y, size: 10, font });
      page.drawText(price.toFixed(2), { x: margin + 380, y, size: 10, font });
      page.drawText(lineTotal.toFixed(2), { x: margin + 460, y, size: 10, font });
      y -= 18;
    }

    y -= 10;
    page.drawLine({ start: { x: margin + 380, y: y + 10 }, end: { x: 612 - margin, y: y + 10 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    page.drawText("Total:", { x: margin + 380, y, size: 11, font: bold });
    page.drawText(grandTotal.toFixed(2), { x: margin + 460, y, size: 11, font: bold });

    const blob = new Blob([await doc.save()], { type: "application/pdf" });
    downloadBlob(blob, `${invoiceNumber || "invoice"}.pdf`);
  }

  return (
    <div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-accent)",
          background: "#e6f9f2",
          padding: "4px 10px",
          borderRadius: 999,
          marginBottom: "var(--space-3)",
        }}
      >
        🔒 Generated entirely in your browser — nothing is uploaded
      </div>

      <label style={{ fontSize: 13, fontWeight: 600 }}>
        Invoice number
        <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} style={fieldStyle} />
      </label>

      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          From (your details)
          <textarea value={from} onChange={(e) => setFrom(e.target.value)} rows={3} style={{ ...fieldStyle, fontFamily: "inherit" }} placeholder={"Your Business Name\n123 Main St\nyou@email.com"} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          To (client details)
          <textarea value={to} onChange={(e) => setTo(e.target.value)} rows={3} style={{ ...fieldStyle, fontFamily: "inherit" }} placeholder={"Client Name\nClient Address\nclient@email.com"} />
        </label>
      </div>

      <h3 style={{ fontSize: 14, marginTop: 16 }}>Line items</h3>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} style={{ ...fieldStyle, flex: 3, marginTop: 0 }} />
          <input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} style={{ ...fieldStyle, flex: 1, marginTop: 0 }} />
          <input placeholder="Price" type="number" value={item.price} onChange={(e) => updateItem(i, { price: e.target.value })} style={{ ...fieldStyle, flex: 1, marginTop: 0 }} />
          <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: 18 }} aria-label="Remove item">×</button>
        </div>
      ))}
      <button onClick={addItem} style={{ fontSize: 13, background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" }}>
        + Add item
      </button>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={generateInvoice}
          style={{ padding: "10px 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >
          Generate Invoice PDF
        </button>
      </div>

      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

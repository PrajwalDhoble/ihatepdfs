import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { downloadBlob } from "@/utils/downloadBlob";

interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  bullets: string;
}

interface EducationEntry {
  school: string;
  degree: string;
  dates: string;
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

const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 8 };

export default function ResumeBuilderTool() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [contact, setContact] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([{ title: "", company: "", dates: "", bullets: "" }]);
  const [education, setEducation] = useState<EducationEntry[]>([{ school: "", degree: "", dates: "" }]);
  const [skills, setSkills] = useState("");
  const [error, setError] = useState<string | null>(null);

  function updateExperience(i: number, patch: Partial<ExperienceEntry>) {
    setExperience((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function updateEducation(i: number, patch: Partial<EducationEntry>) {
    setEducation((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function generate() {
    setError(null);
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const margin = 54;
    const pageWidth = 612;
    const pageHeight = 792;
    const maxWidth = pageWidth - margin * 2;
    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    function ensureSpace(needed: number) {
      if (y - needed < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    }

    function wrapText(text: string, size: number, f = font): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(candidate, size) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) lines.push(current);
      return lines;
    }

    function drawParagraph(text: string, size = 10.5, lineHeight = 14, f = font, color = rgb(0.2, 0.2, 0.2)) {
      for (const line of wrapText(text, size, f)) {
        ensureSpace(lineHeight);
        page.drawText(line, { x: margin, y, size, font: f, color });
        y -= lineHeight;
      }
    }

    // Header
    page.drawText(name, { x: margin, y, size: 22, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= 26;
    if (title.trim()) {
      page.drawText(title, { x: margin, y, size: 13, font, color: rgb(0.3, 0.3, 0.3) });
      y -= 18;
    }
    if (contact.trim()) {
      page.drawText(contact, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 20;
    }
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 1.5, color: rgb(0.1, 0.1, 0.1) });
    y -= 16;

    if (summary.trim()) {
      ensureSpace(20);
      page.drawText("SUMMARY", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
      drawParagraph(summary);
      y -= 8;
    }

    const validExperience = experience.filter((e) => e.title.trim() || e.company.trim());
    if (validExperience.length > 0) {
      ensureSpace(20);
      page.drawText("EXPERIENCE", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
      for (const exp of validExperience) {
        ensureSpace(16);
        page.drawText(`${exp.title}${exp.company ? " — " + exp.company : ""}`, { x: margin, y, size: 11, font: bold, color: rgb(0.15, 0.15, 0.15) });
        if (exp.dates.trim()) {
          const dw = font.widthOfTextAtSize(exp.dates, 9.5);
          page.drawText(exp.dates, { x: pageWidth - margin - dw, y: y + 1, size: 9.5, font, color: rgb(0.4, 0.4, 0.4) });
        }
        y -= 15;
        for (const bullet of exp.bullets.split("\n").filter((b) => b.trim())) {
          for (const line of wrapText(`•  ${bullet.trim()}`, 10)) {
            ensureSpace(14);
            page.drawText(line, { x: margin + 4, y, size: 10, font, color: rgb(0.25, 0.25, 0.25) });
            y -= 14;
          }
        }
        y -= 6;
      }
    }

    const validEducation = education.filter((e) => e.school.trim());
    if (validEducation.length > 0) {
      ensureSpace(20);
      page.drawText("EDUCATION", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
      for (const edu of validEducation) {
        ensureSpace(15);
        page.drawText(`${edu.degree}${edu.degree ? ", " : ""}${edu.school}`, { x: margin, y, size: 10.5, font, color: rgb(0.2, 0.2, 0.2) });
        if (edu.dates.trim()) {
          const dw = font.widthOfTextAtSize(edu.dates, 9.5);
          page.drawText(edu.dates, { x: pageWidth - margin - dw, y, size: 9.5, font, color: rgb(0.4, 0.4, 0.4) });
        }
        y -= 16;
      }
      y -= 4;
    }

    if (skills.trim()) {
      ensureSpace(20);
      page.drawText("SKILLS", { x: margin, y, size: 11, font: bold, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;
      drawParagraph(skills);
    }

const pdfBytes = await doc.save();
const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
new Uint8Array(pdfBuffer).set(pdfBytes);

const blob = new Blob([pdfBuffer], { type: "application/pdf" });    downloadBlob(blob, `${name.replace(/\s+/g, "-") || "resume"}.pdf`);
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

      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          Full name
          <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>
          Title (optional)
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} placeholder="Software Engineer" />
        </label>
      </div>

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 10 }}>
        Contact info (email, phone, location — one line)
        <input value={contact} onChange={(e) => setContact(e.target.value)} style={fieldStyle} placeholder="jane@email.com · (555) 123-4567 · San Francisco, CA" />
      </label>

      <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginTop: 10 }}>
        Summary (optional)
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} style={{ ...fieldStyle, fontFamily: "inherit" }} />
      </label>

      <h3 style={sectionTitle}>Experience</h3>
      {experience.map((exp, i) => (
        <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 10, marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Job title" value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 1 }} />
            <input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 1 }} />
            <input placeholder="Dates" value={exp.dates} onChange={(e) => updateExperience(i, { dates: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 1 }} />
          </div>
          <textarea
            placeholder={"One bullet point per line"}
            value={exp.bullets}
            onChange={(e) => updateExperience(i, { bullets: e.target.value })}
            rows={3}
            style={{ ...fieldStyle, fontFamily: "inherit" }}
          />
        </div>
      ))}
      <button onClick={() => setExperience((p) => [...p, { title: "", company: "", dates: "", bullets: "" }])} style={{ fontSize: 13, background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" }}>
        + Add experience
      </button>

      <h3 style={sectionTitle}>Education</h3>
      {education.map((edu, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input placeholder="School" value={edu.school} onChange={(e) => updateEducation(i, { school: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 2 }} />
          <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 2 }} />
          <input placeholder="Dates" value={edu.dates} onChange={(e) => updateEducation(i, { dates: e.target.value })} style={{ ...fieldStyle, marginTop: 0, flex: 1 }} />
        </div>
      ))}
      <button onClick={() => setEducation((p) => [...p, { school: "", degree: "", dates: "" }])} style={{ fontSize: 13, background: "none", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "6px 12px", cursor: "pointer" }}>
        + Add education
      </button>

      <h3 style={sectionTitle}>Skills</h3>
      <input value={skills} onChange={(e) => setSkills(e.target.value)} style={fieldStyle} placeholder="JavaScript, Project Management, Figma, SQL" />

      <div style={{ marginTop: 24 }}>
        <button
          onClick={generate}
          style={{ padding: "10px 18px", borderRadius: "var(--radius-md)", border: "none", background: "var(--color-primary)", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >
          Generate Resume PDF
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

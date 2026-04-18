/**
 * Client-side DOCX export using the 'docx' npm package.
 * Generates an ATS-readable Word document from current resume state.
 *
 * FIX: Previously the DOCX button returned JSON data with no file download.
 *      Now generates a real .docx binary and triggers browser download.
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, convertInchesToTwip, Header,
  Footer, PageNumber, NumberFormat, UnderlineType,
} from "docx";
import type { ResumeSection } from "@/types";

const fmtDate = (s?: string) => {
  if (!s) return "";
  const [y, m] = s.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return m ? `${months[+m-1]} ${y}` : y;
};

const ptToTwip = (pt: number) => Math.round(pt * 20);
const hexToDocx = (hex: string) => hex.replace("#", "").toUpperCase();

export async function buildDocx(
  sections: ResumeSection[],
  theme: any,
  title: string
): Promise<Blob> {
  const accent = hexToDocx(theme?.accent_color || "#57CDA4");
  const fontSize = Math.round((theme?.font_size || 11) * 2); // half-points
  const margins = convertInchesToTwip((theme?.margins || 36) / 96);

  const visible = [...sections]
    .filter(s => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  const children: Paragraph[] = [];

  // ── HEADER: Name ──────────────────────────────────────────────────────────
  if (pd.name) {
    children.push(new Paragraph({
      children: [new TextRun({ text: pd.name, bold: true, size: 52, color: "111111" })],
      spacing: { after: 60 },
    }));
  }

  if (pd.job_title) {
    children.push(new Paragraph({
      children: [new TextRun({ text: pd.job_title, size: 26, color: "555555" })],
      spacing: { after: 80 },
    }));
  }

  // ── CONTACT INFO ──────────────────────────────────────────────────────────
  const contactParts = [
    pd.email, pd.phone, pd.location, pd.linkedin, pd.website, pd.github
  ].filter(Boolean);

  if (contactParts.length) {
    children.push(new Paragraph({
      children: contactParts.map((part, i) => [
        new TextRun({ text: part, size: fontSize, color: "555555" }),
        i < contactParts.length - 1 ? new TextRun({ text: "  •  ", size: fontSize, color: "888888" }) : null,
      ].filter(Boolean) as TextRun[]).flat(),
      border: {
        bottom: { color: accent, size: 16, style: BorderStyle.SINGLE, space: 1 },
      },
      spacing: { after: 160 },
    }));
  }

  // ── SECTIONS ──────────────────────────────────────────────────────────────
  for (const sec of visible) {
    if (sec.section_type === "personal") continue;

    // Section heading
    children.push(new Paragraph({
      children: [new TextRun({
        text: sec.title.toUpperCase(),
        bold: true,
        size: Math.round(fontSize * 0.9),
        color: accent,
        characterSpacing: 80,
      })],
      border: {
        bottom: { color: "E5E7EB", size: 6, style: BorderStyle.SINGLE, space: 1 },
      },
      spacing: { before: 160, after: 80 },
    }));

    // Summary
    if (sec.section_type === "summary" && sec.data?.text) {
      children.push(new Paragraph({
        children: [new TextRun({ text: sec.data.text, size: fontSize, color: "333333" })],
        spacing: { after: 80 },
      }));
    }

    // Experience / Education / Projects
    if (["experience", "education", "projects"].includes(sec.section_type)) {
      const entries = (sec.section_entries || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      for (const entry of entries) {
        const d = entry.data || {};
        const mainLabel = d.role || d.degree || d.name || "";
        const org = d.company || d.school || "";
        const start = fmtDate(d.startDate);
        const end = d.current ? "Present" : fmtDate(d.endDate);
        const dateStr = start ? `${start}${end ? ` – ${end}` : ""}` : "";

        // Role + Company line
        const roleParts: TextRun[] = [];
        if (mainLabel) roleParts.push(new TextRun({ text: mainLabel, bold: true, size: fontSize + 2 }));
        if (org) roleParts.push(new TextRun({ text: ` — ${org}`, size: fontSize, color: "444444" }));
        if (d.location) roleParts.push(new TextRun({ text: ` · ${d.location}`, size: fontSize - 2, color: "666666" }));

        // Put role and date on same line using tabs
        children.push(new Paragraph({
          children: [
            ...roleParts,
            ...(dateStr ? [
              new TextRun({ text: "\t", size: fontSize }),
              new TextRun({ text: dateStr, size: fontSize, color: "666666" }),
            ] : []),
          ],
          tabStops: [{ type: "right", position: convertInchesToTwip(6.5) }],
          spacing: { after: 40 },
        }));

        // Notes / GPA
        if (d.notes || d.gpa) {
          children.push(new Paragraph({
            children: [new TextRun({
              text: [d.notes, d.gpa ? `GPA: ${d.gpa}` : ""].filter(Boolean).join(" · "),
              size: fontSize - 2, color: "444444", italics: true,
            })],
            spacing: { after: 40 },
          }));
        }

        // URL
        if (d.url) {
          children.push(new Paragraph({
            children: [new TextRun({ text: d.url, size: fontSize - 2, color: accent })],
            spacing: { after: 40 },
          }));
        }

        // Description
        if (d.description) {
          children.push(new Paragraph({
            children: [new TextRun({ text: d.description, size: fontSize, color: "333333" })],
            spacing: { after: 40 },
          }));
        }

        // Bullets
        if (d.bullets?.filter(Boolean).length) {
          for (const bullet of d.bullets.filter(Boolean)) {
            children.push(new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: bullet, size: fontSize, color: "222222" })],
              spacing: { after: 30 },
            }));
          }
        }

        children.push(new Paragraph({ children: [], spacing: { after: 60 } }));
      }
    }

    // Skills
    if (sec.section_type === "skills") {
      const entries = (sec.section_entries || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      for (const entry of entries) {
        const d = entry.data || {};
        if (d.category && d.skills?.length) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${d.category}: `, bold: true, size: fontSize }),
              new TextRun({ text: (d.skills || []).join(", "), size: fontSize, color: "444444" }),
            ],
            spacing: { after: 60 },
          }));
        }
      }
    }

    // Certifications
    if (sec.section_type === "certifications") {
      const entries = (sec.section_entries || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      for (const entry of entries) {
        const d = entry.data || {};
        children.push(new Paragraph({
          children: [
            new TextRun({ text: d.name || "", bold: true, size: fontSize }),
            d.issuer ? new TextRun({ text: ` — ${d.issuer}`, size: fontSize, color: "555555" }) : null,
            d.date ? new TextRun({ text: `\t${d.date}`, size: fontSize, color: "666666" }) : null,
          ].filter(Boolean) as TextRun[],
          tabStops: [{ type: "right", position: convertInchesToTwip(6.5) }],
          spacing: { after: 60 },
        }));
      }
    }

    // Generic text sections (achievements, languages, references)
    if (["achievements", "languages", "references"].includes(sec.section_type) && sec.data?.text) {
      children.push(new Paragraph({
        children: [new TextRun({ text: sec.data.text, size: fontSize, color: "333333" })],
        spacing: { after: 80 },
      }));
    }
  }

  // ── BUILD DOCUMENT ─────────────────────────────────────────────────────────
  const doc = new Document({
    title,
    description: "ATS-optimized resume created with ResumeOS",
    creator: pd.name || "ResumeOS",
    sections: [{
      properties: {
        page: {
          margin: {
            top: margins,
            bottom: margins,
            left: margins,
            right: margins,
          },
          size: {
            // A4: 11906 × 16838 twips; Letter: 12240 × 15840
            width: theme?.page_size === "Letter" ? 12240 : 11906,
            height: theme?.page_size === "Letter" ? 15840 : 16838,
          },
        },
      },
      children,
    }],
    numbering: {
      config: [{
        reference: "bullet-numbering",
        levels: [{
          level: 0,
          format: NumberFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: {
              indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.25) },
            },
          },
        }],
      }],
    },
  });

  return await Packer.toBlob(doc);
}

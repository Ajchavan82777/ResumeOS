const express = require("express");
const router  = express.Router();
const { supabaseAdmin } = require("../db/supabase");
const { authenticate }  = require("../middleware/auth");

// ── POST /api/export/:resumeId/pdf ─────────────────────────────────────────
router.post("/:resumeId/pdf", authenticate, async (req, res) => {
  try {
    const { data: resume, error } = await supabaseAdmin
      .from("resumes")
      .select(`*, resume_customizations(*), resume_sections(*, section_entries(*))`)
      .eq("id", req.params.resumeId)
      .eq("user_id", req.userId)
      .single();

    if (error || !resume) return res.status(404).json({ error: "Resume not found" });

    const html = buildResumeHTML(resume);

    // Try Puppeteer for server-side PDF
    let pdfGenerated = false;
    try {
      const puppeteer = require("puppeteer");
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        headless: "new",
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 });
      const pdf = await page.pdf({
        format: resume.resume_customizations?.page_size || "A4",
        printBackground: true,
        margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
      });
      await browser.close();

      supabaseAdmin.from("export_logs").insert({
        user_id: req.userId, resume_id: resume.id, format: "pdf",
        file_name: `${resume.title.replace(/\s+/g, "_")}.pdf`,
        file_size: pdf.length, ip_address: req.ip,
      }).catch(() => {});

      const filename = encodeURIComponent(resume.title || "resume");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
      res.setHeader("Content-Length", pdf.length);
      res.send(Buffer.from(pdf));
      pdfGenerated = true;
    } catch (puppeteerErr) {
      console.warn("Puppeteer unavailable:", puppeteerErr.message);
    }

    if (!pdfGenerated) {
      // Fallback: return HTML so client can print
      res.json({ html, fallback: true, message: "Use client-side print for PDF" });
    }
  } catch (err) {
    console.error("PDF export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

// ── POST /api/export/:resumeId/docx ────────────────────────────────────────
router.post("/:resumeId/docx", authenticate, async (req, res) => {
  try {
    const { data: resume, error } = await supabaseAdmin
      .from("resumes")
      .select(`*, resume_customizations(*), resume_sections(*, section_entries(*))`)
      .eq("id", req.params.resumeId)
      .eq("user_id", req.userId)
      .single();

    if (error || !resume) return res.status(404).json({ error: "Resume not found" });

    try {
      const docxBuffer = await buildDocxBuffer(resume);

      supabaseAdmin.from("export_logs").insert({
        user_id: req.userId, resume_id: resume.id, format: "docx",
        file_name: `${resume.title.replace(/\s+/g, "_")}.docx`,
        file_size: docxBuffer.length, ip_address: req.ip,
      }).catch(() => {});

      const filename = encodeURIComponent(resume.title || "resume");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.docx"`);
      res.setHeader("Content-Length", docxBuffer.length);
      res.send(docxBuffer);
    } catch (docxErr) {
      console.warn("docx package unavailable:", docxErr.message);
      // Return structured data — client will use its own DOCX builder
      res.json({ resume, fallback: true, message: "Client-side DOCX generation" });
    }
  } catch (err) {
    console.error("DOCX export error:", err);
    res.status(500).json({ error: "Export failed" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Server-side DOCX builder (requires 'docx' npm package)
// ─────────────────────────────────────────────────────────────────────────────
async function buildDocxBuffer(resume) {
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, BorderStyle, convertInchesToTwip, NumberFormat,
  } = require("docx");

  const c       = resume.resume_customizations || {};
  const accent  = (c.accent_color || "#57CDA4").replace("#", "").toUpperCase();
  const fontSize = Math.round((c.font_size || 11) * 2);
  const margins  = convertInchesToTwip((c.margins || 36) / 96);

  const fmtDate = (s) => {
    if (!s) return "";
    const [y, m] = s.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return m ? `${months[+m - 1]} ${y}` : y;
  };

  const sections = (resume.resume_sections || [])
    .filter(s => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(s => ({
      ...s,
      section_entries: (s.section_entries || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

  const personal = sections.find(s => s.section_type === "personal");
  const pd       = personal?.data || {};
  const children = [];

  // Name
  if (pd.name) children.push(new Paragraph({
    children: [new TextRun({ text: pd.name, bold: true, size: 52, color: "111111" })],
    spacing: { after: 60 },
  }));

  if (pd.job_title) children.push(new Paragraph({
    children: [new TextRun({ text: pd.job_title, size: 26, color: "555555" })],
    spacing: { after: 80 },
  }));

  // Contact
  const cParts = [pd.email, pd.phone, pd.location, pd.linkedin, pd.website, pd.github].filter(Boolean);
  if (cParts.length) {
    children.push(new Paragraph({
      children: cParts.flatMap((p, i) => [
        new TextRun({ text: p, size: fontSize, color: "555555" }),
        ...(i < cParts.length - 1 ? [new TextRun({ text: "  •  ", size: fontSize, color: "999999" })] : []),
      ]),
      border: { bottom: { color: accent, size: 16, style: BorderStyle.SINGLE, space: 1 } },
      spacing: { after: 160 },
    }));
  }

  for (const sec of sections) {
    if (sec.section_type === "personal") continue;

    children.push(new Paragraph({
      children: [new TextRun({
        text: sec.title.toUpperCase(), bold: true,
        size: Math.round(fontSize * 0.9), color: accent, characterSpacing: 80,
      })],
      border: { bottom: { color: "E5E7EB", size: 6, style: BorderStyle.SINGLE, space: 1 } },
      spacing: { before: 160, after: 80 },
    }));

    if (sec.section_type === "summary" && sec.data?.text) {
      children.push(new Paragraph({
        children: [new TextRun({ text: sec.data.text, size: fontSize, color: "333333" })],
        spacing: { after: 80 },
      }));
    }

    if (["experience", "education", "projects"].includes(sec.section_type)) {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        const mainLabel = d.role || d.degree || d.name || "";
        const org = d.company || d.school || "";
        const dateStr = d.startDate
          ? `${fmtDate(d.startDate)} – ${d.current ? "Present" : fmtDate(d.endDate) || ""}`
          : "";

        const rParts = [];
        if (mainLabel) rParts.push(new TextRun({ text: mainLabel, bold: true, size: fontSize + 2 }));
        if (org) rParts.push(new TextRun({ text: ` — ${org}`, size: fontSize, color: "444444" }));

        children.push(new Paragraph({
          children: [
            ...rParts,
            ...(dateStr ? [
              new TextRun({ text: "\t", size: fontSize }),
              new TextRun({ text: dateStr, size: fontSize, color: "666666" }),
            ] : []),
          ],
          tabStops: [{ type: "right", position: convertInchesToTwip(6.5) }],
          spacing: { after: 40 },
        }));

        if (d.notes || d.gpa) {
          children.push(new Paragraph({
            children: [new TextRun({
              text: [d.notes, d.gpa ? `GPA: ${d.gpa}` : ""].filter(Boolean).join(" · "),
              size: fontSize - 2, color: "444444", italics: true,
            })],
            spacing: { after: 40 },
          }));
        }

        if (d.url) children.push(new Paragraph({
          children: [new TextRun({ text: d.url, size: fontSize - 2, color: accent })],
          spacing: { after: 40 },
        }));

        if (d.description) children.push(new Paragraph({
          children: [new TextRun({ text: d.description, size: fontSize, color: "333333" })],
          spacing: { after: 40 },
        }));

        if (d.bullets?.filter(Boolean).length) {
          for (const bullet of d.bullets.filter(Boolean)) {
            children.push(new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: bullet, size: fontSize })],
              spacing: { after: 30 },
            }));
          }
        }
        children.push(new Paragraph({ children: [], spacing: { after: 60 } }));
      }
    }

    if (sec.section_type === "skills") {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        if (d.category && d.skills?.length) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${d.category}: `, bold: true, size: fontSize }),
              new TextRun({ text: d.skills.join(", "), size: fontSize, color: "444444" }),
            ],
            spacing: { after: 60 },
          }));
        }
      }
    }

    if (sec.section_type === "certifications") {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        children.push(new Paragraph({
          children: [
            new TextRun({ text: d.name || "", bold: true, size: fontSize }),
            ...(d.issuer ? [new TextRun({ text: ` — ${d.issuer}`, size: fontSize, color: "555555" })] : []),
            ...(d.date ? [
              new TextRun({ text: "\t", size: fontSize }),
              new TextRun({ text: d.date, size: fontSize, color: "666666" }),
            ] : []),
          ],
          tabStops: [{ type: "right", position: convertInchesToTwip(6.5) }],
          spacing: { after: 60 },
        }));
      }
    }
  }

  const doc = new Document({
    title: resume.title,
    sections: [{
      properties: {
        page: {
          margin: { top: margins, bottom: margins, left: margins, right: margins },
          size: {
            width:  c.page_size === "Letter" ? 12240 : 11906,
            height: c.page_size === "Letter" ? 15840 : 16838,
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

  return await Packer.toBuffer(doc);
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML builder for PDF export
// ─────────────────────────────────────────────────────────────────────────────
function buildResumeHTML(resume) {
  const c       = resume.resume_customizations || {};
  const accent  = c.accent_color || "#57CDA4";
  const font    = c.font_family  || "Georgia, serif";
  const fontSize = c.font_size   || 11;
  const margins  = c.margins     || 36;

  const fmtDate = (s) => {
    if (!s) return "";
    const [y, m] = s.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return m ? `${months[+m-1]} ${y}` : y;
  };

  const sections = (resume.resume_sections || [])
    .filter(s => s.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(s => ({
      ...s,
      section_entries: (s.section_entries || []).sort((a, b) => a.sort_order - b.sort_order),
    }));

  const personal = sections.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  let body = "";

  if (personal) {
    body += `<div class="header">
      <h1>${pd.name || ""}</h1>
      <div class="job-title">${pd.job_title || ""}</div>
      <div class="contact">
        ${pd.email    ? `<span>&#9993; ${pd.email}</span>`      : ""}
        ${pd.phone    ? `<span>&#9742; ${pd.phone}</span>`      : ""}
        ${pd.location ? `<span>&#128205; ${pd.location}</span>` : ""}
        ${pd.linkedin ? `<span>&#128279; ${pd.linkedin}</span>` : ""}
        ${pd.website  ? `<span>&#127760; ${pd.website}</span>`  : ""}
        ${pd.github   ? `<span>&#128187; ${pd.github}</span>`   : ""}
      </div>
    </div>`;
  }

  for (const sec of sections) {
    if (sec.section_type === "personal") continue;
    body += `<div class="section"><h2 class="sec-title">${sec.title}</h2>`;

    if (sec.section_type === "summary" && sec.data?.text) {
      body += `<p class="summary">${sec.data.text}</p>`;
    }

    if (["experience", "education", "projects"].includes(sec.section_type)) {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        const mainLabel = d.role || d.degree || d.name || "";
        const org = d.company || d.school || "";
        const start = fmtDate(d.startDate);
        const end = d.current ? "Present" : fmtDate(d.endDate);
        const dateStr = start ? `${start}${end ? ` &ndash; ${end}` : ""}` : "";

        body += `<div class="entry">
          <div class="entry-header">
            <div class="entry-left">
              <span class="entry-main">${mainLabel}</span>
              ${org ? `<span class="entry-org"> &mdash; ${org}</span>` : ""}
              ${d.location ? `<span class="entry-loc"> &middot; ${d.location}</span>` : ""}
            </div>
            ${dateStr ? `<span class="entry-date">${dateStr}</span>` : ""}
          </div>`;

        if (d.notes || d.gpa) body += `<div class="entry-sub">${d.notes || ""}${d.gpa ? ` &middot; GPA: ${d.gpa}` : ""}</div>`;
        if (d.url) body += `<div class="entry-url">${d.url}</div>`;
        if (d.description) body += `<p class="entry-desc">${d.description}</p>`;
        if (d.bullets?.filter(Boolean).length) {
          body += `<ul>${d.bullets.filter(Boolean).map(b => `<li>${b}</li>`).join("")}</ul>`;
        }
        body += `</div>`;
      }
    }

    if (sec.section_type === "skills") {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        if (d.category && d.skills?.length) {
          body += `<div class="skill-row"><strong>${d.category}:</strong> <span>${d.skills.join(", ")}</span></div>`;
        }
      }
    }

    if (sec.section_type === "certifications") {
      for (const entry of sec.section_entries) {
        const d = entry.data || {};
        body += `<div class="entry">
          <div class="entry-header">
            <div class="entry-left">
              <span class="entry-main">${d.name || ""}</span>
              ${d.issuer ? `<span class="entry-org"> &mdash; ${d.issuer}</span>` : ""}
            </div>
            ${d.date ? `<span class="entry-date">${d.date}</span>` : ""}
          </div>
        </div>`;
      }
    }

    if (["achievements","languages","references"].includes(sec.section_type) && sec.data?.text) {
      body += `<p class="summary">${sec.data.text}</p>`;
    }

    body += `</div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${font}; font-size: ${fontSize}pt; line-height: ${c.line_spacing || 1.55};
    color: #1a1a1a; padding: ${margins}px; }
  h1 { font-size: 22pt; font-weight: 700; letter-spacing: -0.4px; color: #111; margin-bottom: 3px; }
  .job-title { font-size: 12pt; color: #555; margin-bottom: 10px; }
  .contact { display: flex; flex-wrap: wrap; gap: 12px; font-size: 9.5pt; color: #555;
    padding-bottom: 12px; border-bottom: 2.5px solid ${accent}; margin-bottom: 14px; }
  .section { margin-bottom: 15px; }
  .sec-title { font-size: 9.5pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
    color: ${accent}; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 9px; }
  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px; }
  .entry-left { flex: 1; }
  .entry-main { font-weight: 700; font-size: 10.5pt; color: #111; }
  .entry-org  { color: #555; font-weight: 500; }
  .entry-loc  { color: #777; font-size: 9pt; }
  .entry-date { font-size: 9.5pt; color: #666; white-space: nowrap; margin-left: 8px; flex-shrink: 0; }
  .entry-sub  { font-size: 10pt; color: #444; margin-bottom: 4px; font-style: italic; }
  .entry-url  { font-size: 9.5pt; color: ${accent}; margin-bottom: 3px; }
  .entry-desc { font-size: 10pt; color: #333; margin-bottom: 4px; }
  ul { padding-left: 15px; margin-top: 4px; }
  li { margin-bottom: 3px; font-size: 10pt; color: #222; }
  .summary { font-size: 10.5pt; color: #333; line-height: 1.75; }
  .skill-row { display: flex; gap: 8px; margin-bottom: 5px; font-size: 10pt; }
  .skill-row strong { min-width: 90px; color: #111; }
  @page { size: ${c.page_size || "A4"}; margin: 0; }
</style>
</head>
<body>${body}</body>
</html>`;
}

module.exports = router;

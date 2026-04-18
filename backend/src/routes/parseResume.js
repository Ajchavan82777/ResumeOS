"use strict";
const express = require("express");
const multer  = require("multer");
const path    = require("path");
const router  = express.Router();
const { authenticate } = require("../middleware/auth");

// ─── Multer: in-memory storage ────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, [".pdf", ".docx", ".doc", ".txt"].includes(ext));
  },
});

// ─── Text extractors ──────────────────────────────────────────────────────────

async function extractText(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  try {
    if (ext === ".txt") {
      return file.buffer.toString("utf-8");
    }
    if (ext === ".docx" || ext === ".doc") {
      try {
        const mammoth = require("mammoth");
        const result  = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value || "";
      } catch {
        return file.buffer.toString("binary").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
    if (ext === ".pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const data     = await pdfParse(file.buffer);
        return data.text || "";
      } catch {
        // Fallback: extract printable ASCII from binary
        const raw     = file.buffer.toString("binary");
        const matches = raw.match(/[\x20-\x7E]{4,}/g) || [];
        return matches.join(" ");
      }
    }
  } catch {
    // Last-resort: treat as UTF-8 text
  }
  return file.buffer.toString("utf-8");
}

// ─── Flexible resume parser ───────────────────────────────────────────────────
// Strategy: scan every line for signals regardless of structure.
// Works on any format — never throws.

function flexibleParse(text) {
  if (!text || !text.trim()) {
    return emptyResult();
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const full  = lines.join(" ");

  // ── Personal info (regex-based, format-independent) ──
  const personal = {};

  const emailM = full.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailM) personal.email = emailM[0];

  const phoneM = full.match(/(\+?[\d][\d\s\-().]{6,18}[\d])/);
  if (phoneM) personal.phone = phoneM[0].trim();

  const linkedM = full.match(/linkedin\.com\/in\/([\w\-%.]+)/i);
  if (linkedM) personal.linkedin = "linkedin.com/in/" + linkedM[1];

  const githubM = full.match(/github\.com\/([\w\-%.]+)/i);
  if (githubM) personal.github = "github.com/" + githubM[1];

  const webM = full.match(/https?:\/\/(?!linkedin|github)([\w\-./]+)/i);
  if (webM) personal.website = webM[0];

  // Name: first line that looks like a real name (no @, digits, slashes; 2-5 words)
  for (const l of lines.slice(0, 5)) {
    if (l.length > 3 && l.length < 70 && !/[@\d\/\\|]/.test(l)) {
      const words = l.trim().split(/\s+/);
      if (words.length >= 2 && words.length <= 6) {
        personal.name = l.trim();
        break;
      }
    }
  }

  // Job title: short line near top that isn't a name, email, phone, or URL
  const titleLineRx = /^[A-Za-z][A-Za-z\s,&\/\-]+$/;
  for (const l of lines.slice(1, 8)) {
    if (!personal.job_title && l.length > 3 && l.length < 60 &&
        titleLineRx.test(l) && l !== personal.name) {
      personal.job_title = l.trim();
      break;
    }
  }

  // Location: "City, State" or "City, Country"
  const locM = full.match(/\b([A-Z][a-zA-Z\s]+),\s*([A-Z]{2,}|[A-Z][a-zA-Z\s]{2,20})\b/);
  if (locM) personal.location = locM[0];

  // ── Section detection (broad list of headers) ──
  const SECTION_RX = {
    summary:        /^(summary|professional\s+summary|career\s+summary|about\s+me|profile|objective|career\s+objective|executive\s+summary)/i,
    experience:     /^(experience|work\s+experience|employment|work\s+history|professional\s+experience|career|positions?)/i,
    education:      /^(education|academic|qualifications?|degrees?|schooling|university|college)/i,
    skills:         /^(skills?|technical\s+skills?|competencies|expertise|core\s+competencies|technologies|tools|proficiencies)/i,
    projects:       /^(projects?|portfolio|personal\s+projects?|side\s+projects?|open\s+source)/i,
    certifications: /^(certifications?|certificates?|training|courses?|licenses?|accreditations?)/i,
    achievements:   /^(achievements?|accomplishments?|awards?|honors?|recognition|highlights?)/i,
    languages:      /^(languages?|language\s+proficiency|spoken\s+languages?)/i,
    references:     /^(references?|referees?)/i,
  };

  const sections = {};
  let currentKey = "header";
  sections["header"] = [];

  for (const line of lines) {
    let matched = false;
    for (const [key, rx] of Object.entries(SECTION_RX)) {
      if (rx.test(line) && line.length < 60) {
        currentKey = key;
        if (!sections[key]) sections[key] = [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!sections[currentKey]) sections[currentKey] = [];
      sections[currentKey].push(line);
    }
  }

  // ── Summary ──
  const summary = (sections.summary || []).join(" ").trim();

  // ── Experience ──
  const experience = parseListSection(sections.experience || []);

  // ── Education ──
  const education = parseEducation(sections.education || []);

  // ── Skills ──
  const skills = parseSkills(sections.skills || []);

  // ── Projects ──
  const projects = parseListSection(sections.projects || []);

  // ── Certifications ──
  const certifications = (sections.certifications || [])
    .filter(l => l.length > 3)
    .map(l => ({ name: l, issuer: "", date: "" }));

  // ── Languages ──
  const languages = (sections.languages || [])
    .map(l => {
      const parts = l.split(/[-–—:,|]/);
      return { language: (parts[0] || "").trim(), proficiency: (parts[1] || "").trim() };
    })
    .filter(l => l.language.length > 1);

  // ── Achievements ──
  const achievements = (sections.achievements || [])
    .filter(l => l.length > 5)
    .map(l => ({ text: l, title: "", description: "" }));

  return { personal, summary, experience, education, skills, projects, certifications, languages, achievements };
}

// ── Parse date ranges like "Jan 2020 – Present" or "2018-2022" ───────────────
function parseDateRange(text) {
  const isCurrent = /present|current|now|ongoing/i.test(text);
  const years = text.match(/\b(19|20)\d{2}\b/g) || [];
  const startDate = years[0] ? years[0] + "-01" : "";
  const endDate   = !isCurrent && years[1] ? years[1] + "-01" : "";
  return { startDate, endDate, current: isCurrent };
}

// ── Parse experience / project blocks ────────────────────────────────────────
function parseListSection(lines) {
  const entries = [];
  let entry = null;
  const dateRx = /\b(19|20)\d{2}\b/;

  for (const line of lines) {
    const hasDates = dateRx.test(line);
    const isBullet = /^[•\-\*▪◦➤►>·]/.test(line);

    if (hasDates && !isBullet && line.length < 120) {
      if (entry) entries.push(entry);
      const dates = parseDateRange(line);
      // Split on common separators to get role / company
      const parts = line.split(/[|,–\-—@]/).map(p => p.replace(/\b(19|20)\d{2}\b.*/g, "").trim()).filter(Boolean);
      entry = {
        role: parts[0] || "",
        company: parts[1] || "",
        location: parts[2] || "",
        ...dates,
        bullets: [],
      };
    } else if (isBullet && entry) {
      entry.bullets.push(line.replace(/^[•\-\*▪◦➤►>·]\s*/, "").trim());
    } else if (entry) {
      if (!entry.role && line.length < 80) entry.role = line;
      else if (!entry.company && line.length < 80) entry.company = line;
      else if (line.length < 80 && !dateRx.test(line)) entry.bullets.push(line);
    } else if (!entry && line.length > 3) {
      // Start entry without date
      entry = { role: line, company: "", location: "", startDate: "", endDate: "", current: false, bullets: [] };
    }
  }
  if (entry) entries.push(entry);
  return entries;
}

// ── Parse education ───────────────────────────────────────────────────────────
function parseEducation(lines) {
  const entries = [];
  let entry = null;
  const eduRx  = /university|college|school|institute|academy|polytechnic/i;
  const dateRx = /\b(19|20)\d{2}\b/;

  for (const line of lines) {
    if (dateRx.test(line) || eduRx.test(line)) {
      if (entry) entries.push(entry);
      const dates = parseDateRange(line);
      const parts = line.split(/[|,–\-—]/).map(p => p.trim()).filter(Boolean);
      entry = { degree: parts[0] || line, school: parts[1] || "", location: parts[2] || "", gpa: "", notes: "", ...dates };
    } else if (entry) {
      if (!entry.school && line.length < 100) entry.school = line;
      else if (!entry.degree && line.length < 100) entry.degree = line;
      else {
        const gpaM = line.match(/gpa[:\s]+([0-9.]+)/i);
        if (gpaM) entry.gpa = gpaM[1];
        else if (line.length < 100) entry.notes = (entry.notes ? entry.notes + " " : "") + line;
      }
    } else if (line.length > 2) {
      entry = { degree: line, school: "", location: "", gpa: "", notes: "", startDate: "", endDate: "", current: false };
    }
  }
  if (entry) entries.push(entry);
  return entries;
}

// ── Parse skills ──────────────────────────────────────────────────────────────
function parseSkills(lines) {
  const groups = [];
  for (const line of lines) {
    if (line.includes(":")) {
      const colonIdx = line.indexOf(":");
      const cat   = line.slice(0, colonIdx).trim();
      const rest  = line.slice(colonIdx + 1).trim();
      const items = rest.split(/[,;·•|\/]/).map(s => s.trim()).filter(s => s.length > 0);
      if (items.length > 0) groups.push({ category: cat, skills: items });
    } else {
      const items = line.split(/[,;·•|\/]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
      if (items.length > 1) groups.push({ category: "Skills", skills: items });
      else if (items.length === 1 && items[0].length > 1) {
        // Single skill on a line — append to last group or create new
        if (groups.length && groups[groups.length - 1].category === "Skills") {
          groups[groups.length - 1].skills.push(items[0]);
        } else {
          groups.push({ category: "Skills", skills: [items[0]] });
        }
      }
    }
  }
  // Merge consecutive "Skills" groups
  const merged = [];
  for (const g of groups) {
    const last = merged[merged.length - 1];
    if (last && last.category === g.category && g.category === "Skills") {
      last.skills.push(...g.skills);
    } else {
      merged.push(g);
    }
  }
  return merged;
}

function emptyResult() {
  return { personal: {}, summary: "", experience: [], education: [], skills: [], projects: [], certifications: [], languages: [], achievements: [] };
}

// ─── AI-enhanced parser ───────────────────────────────────────────────────────
async function aiParse(text) {
  try {
    const { supabaseAdmin } = require("../db/supabase");
    const { data: settings } = await supabaseAdmin
      .from("ai_settings").select("*").limit(1).single();

    if (!settings?.ai_enabled || !settings?.api_key) return null;

    const axios  = require("axios");
    const prompt = `Extract resume information from the following text and return ONLY valid JSON with NO markdown fences, matching this structure exactly:
{
  "personal": { "name": "", "job_title": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "" },
  "summary": "",
  "experience": [{ "role": "", "company": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "bullets": [] }],
  "education": [{ "degree": "", "school": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "gpa": "", "notes": "" }],
  "skills": [{ "category": "", "skills": [] }],
  "projects": [{ "role": "", "company": "", "location": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "current": false, "bullets": [] }],
  "certifications": [{ "name": "", "issuer": "", "date": "" }],
  "languages": [{ "language": "", "proficiency": "" }],
  "achievements": [{ "text": "", "title": "", "description": "" }]
}

Resume text:
${text.substring(0, 4000)}`;

    const provider = settings.provider || "anthropic";
    const model    = settings.model || (provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini");
    const key      = settings.api_key.trim();
    let result = "";

    if (provider === "anthropic") {
      const resp = await axios.post(
        "https://api.anthropic.com/v1/messages",
        { model, max_tokens: 2000, messages: [{ role: "user", content: prompt }] },
        { headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" } }
      );
      result = resp.data.content?.[0]?.text || "";
    } else {
      const baseUrl = provider === "openrouter" ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1";
      const resp = await axios.post(
        `${baseUrl}/chat/completions`,
        { model, max_tokens: 2000, messages: [{ role: "user", content: prompt }] },
        { headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" } }
      );
      result = resp.data.choices?.[0]?.message?.content || "";
    }

    result = result.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    return JSON.parse(result);
  } catch {
    return null;
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/resumes/parse-upload
router.post("/parse-upload", authenticate, upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded. Accepted formats: PDF, DOCX, TXT." });
  try {
    const text   = await extractText(req.file);
    const parsed = !text.trim()
      ? emptyResult()
      : ((await aiParse(text)) || flexibleParse(text));
    res.json({ parsed });
  } catch (err) {
    console.error("parse-upload error:", err);
    // Never fail — return empty structure so frontend can still create a blank resume
    res.json({ parsed: emptyResult() });
  }
});

// POST /api/resumes/parse-text
router.post("/parse-text", authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) return res.status(400).json({ error: "Please provide some resume text." });
  try {
    const parsed = (await aiParse(text)) || flexibleParse(text);
    res.json({ parsed });
  } catch (err) {
    console.error("parse-text error:", err);
    res.json({ parsed: emptyResult() });
  }
});

module.exports = router;

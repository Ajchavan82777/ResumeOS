import type { ResumeSection } from "@/types";

// ── Helpers (defined once) ────────────────────────────────────────────────────
function getEntries(sec: ResumeSection | {}): any[] {
  return (sec as ResumeSection).section_entries || [];
}

function getData(sec: ResumeSection | {}): Record<string, any> {
  return (sec as ResumeSection).data || {};
}

// ── ATS Score ─────────────────────────────────────────────────────────────────
export function calcAtsScore(sections: ResumeSection[]): number {
  if (!sections.length) return 0;

  let score = 20;

  const get = (type: string) => sections.find(s => s.section_type === type && s.is_visible);

  const personal = get("personal");
  const summary  = get("summary");
  const exp      = get("experience");
  const edu      = get("education");
  const skills   = get("skills");

  if (personal) {
    const d = getData(personal);
    if (d.name)     score += 5;
    if (d.email)    score += 5;
    if (d.phone)    score += 4;
    if (d.location) score += 3;
    if (d.linkedin || d.website || d.github) score += 3;
  }

  if (summary) {
    const text = getData(summary).text || "";
    if (text.length > 30)  score += 5;
    if (text.length > 100) score += 5;
  }

  if (exp) {
    const entries = getEntries(exp);
    if (entries.length > 0) {
      score += 10;
      if (entries.length >= 2) score += 5;
      const hasBullets = entries.some(e => (e.data?.bullets || []).filter(Boolean).length >= 2);
      if (hasBullets) score += 5;
      const hasDates = entries.some(e => e.data?.startDate);
      if (hasDates) score += 5;
    }
  }

  if (edu) {
    if (getEntries(edu).length > 0) score += 10;
  }

  if (skills) {
    const total = getEntries(skills).reduce((a, e) => a + (e.data?.skills?.length || 0), 0);
    if (total > 0)  score += 5;
    if (total >= 6) score += 5;
  }

  const bonusSections = ["projects", "certifications", "achievements"];
  if (sections.some(s => bonusSections.includes(s.section_type) && s.is_visible)) score += 5;

  return Math.min(score, 100);
}

// ── Score Breakdown ───────────────────────────────────────────────────────────
export function getScoreBreakdown(sections: ResumeSection[]): Record<string, number> {
  const get = (type: string) => sections.find(s => s.section_type === type && s.is_visible);

  const personal     = get("personal");
  const summary      = get("summary");
  const exp          = get("experience");
  const edu          = get("education");
  const skills       = get("skills");

  const pd           = getData(personal || {} as ResumeSection);
  const expEntries   = getEntries(exp    || {} as ResumeSection);
  const skillEntries = getEntries(skills || {} as ResumeSection);
  const eduEntries   = getEntries(edu    || {} as ResumeSection);

  const hasBullets  = expEntries.some(e => (e.data?.bullets || []).filter(Boolean).length >= 1);
  const skillCount  = skillEntries.reduce((a, e) => a + (e.data?.skills?.length || 0), 0);
  const summaryText = getData(summary || {} as ResumeSection).text || "";

  return {
    "Contact Info": !personal ? 0 : (pd.name && pd.email ? 100 : pd.name || pd.email ? 50 : 10),
    "Summary":      !summary  ? 0 : summaryText.length > 100 ? 95 : summaryText.length > 30 ? 60 : 20,
    "Experience":   expEntries.length === 0 ? 0 : expEntries.length >= 2 ? (hasBullets ? 95 : 70) : 50,
    "Education":    eduEntries.length > 0 ? 100 : 0,
    "Skills":       skillCount >= 8 ? 90 : skillCount >= 3 ? 70 : skillCount > 0 ? 40 : 0,
    "Formatting":   sections.length >= 4 ? 88 : sections.length >= 2 ? 60 : 30,
  };
}

// ── Score Suggestions ─────────────────────────────────────────────────────────
export function getScoreSuggestions(sections: ResumeSection[]): { color: string; text: string }[] {
  const suggestions: { color: string; text: string }[] = [];
  const get = (type: string) => sections.find(s => s.section_type === type && s.is_visible);

  const personal = get("personal");
  const summary  = get("summary");
  const exp      = get("experience");
  const skills   = get("skills");

  const pd = getData(personal || {} as ResumeSection);

  // Contact
  if (!personal || (!pd.name || !pd.email)) {
    suggestions.push({ color: "#EF4444", text: "Add your name and email to Personal Information" });
  } else if (!pd.phone) {
    suggestions.push({ color: "#F59E0B", text: "Add your phone number to boost recruiter response rate" });
  } else {
    suggestions.push({ color: "#57CDA4", text: "Contact information is complete ✓" });
  }

  // Summary
  const sumText = getData(summary || {} as ResumeSection).text || "";
  if (!summary || sumText.length < 30) {
    suggestions.push({ color: "#EF4444", text: "Write a Professional Summary (3-4 sentences, 80+ words)" });
  } else if (sumText.length < 80) {
    suggestions.push({ color: "#F59E0B", text: "Expand your summary — aim for 80+ characters for better ATS impact" });
  } else {
    suggestions.push({ color: "#57CDA4", text: "Professional Summary looks good ✓" });
  }

  // Experience
  const expEntries = getEntries(exp || {} as ResumeSection);
  if (!exp || expEntries.length === 0) {
    suggestions.push({ color: "#EF4444", text: "Add Work Experience — it's the most important ATS section" });
  } else {
    const hasBullets = expEntries.some(e => (e.data?.bullets || []).filter(Boolean).length >= 2);
    if (!hasBullets) {
      suggestions.push({ color: "#F59E0B", text: "Add 2-4 bullet points per experience with quantifiable achievements" });
    } else {
      const allBullets: string[] = expEntries.flatMap(e => e.data?.bullets || []).filter(Boolean);
      const weakVerbs = ["responsible for", "worked on", "helped with", "assisted with", "did"];
      const hasWeak = allBullets.some(b => weakVerbs.some(v => b.toLowerCase().includes(v)));
      suggestions.push(hasWeak
        ? { color: "#F59E0B", text: "Replace weak phrases like 'responsible for' with strong action verbs (Led, Built, Increased)" }
        : { color: "#57CDA4", text: "Experience section looks strong ✓" }
      );
    }
  }

  // Skills
  const skillEntries = getEntries(skills || {} as ResumeSection);
  const skillCount = skillEntries.reduce((a, e) => a + (e.data?.skills?.length || 0), 0);
  if (!skills || skillCount === 0) {
    suggestions.push({ color: "#F59E0B", text: "Add a Skills section — ATS systems scan for keyword matches" });
  } else if (skillCount < 6) {
    suggestions.push({ color: "#F59E0B", text: "Add more skills (aim for 8-15 relevant skills)" });
  } else {
    suggestions.push({ color: "#57CDA4", text: "Skills section looks comprehensive ✓" });
  }

  // Extra sections
  const hasExtras = sections.some(s =>
    ["projects", "certifications", "achievements"].includes(s.section_type) && s.is_visible
  );
  if (!hasExtras) {
    suggestions.push({ color: "#F59E0B", text: "Consider adding Projects or Certifications to stand out" });
  }

  return suggestions.slice(0, 5);
}

"use client";
import { useState, useRef, useEffect } from "react";
import type { ResumeSection, ResumeTheme } from "@/types";
import { SectionField, EntryField, EntryBullet, SectionTitle, useEditContext } from "./EditContext";
import { useBuilderStore } from "@/store";
import { sectionApi } from "@/lib/api";

// ─── Click-to-select section controls ─────────────────────────────────────────

function SectionWrapper({
  sec, children, isFirst, isLast,
}: {
  sec: ResumeSection;
  children: React.ReactNode;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { editable } = useEditContext();
  const { moveSectionUp, moveSectionDown, removeSection, resume } = useBuilderStore();
  const [selected, setSelected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setSelected(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  if (!editable) return <>{children}</>;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${sec.title}" section?`)) return;
    removeSection(sec.id);
    setSelected(false);
    try { if (resume?.id) await sectionApi.delete(resume.id, sec.id); } catch {}
  };

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        outline: selected ? "2px solid #14b8a6" : "2px solid transparent",
        borderRadius: 3,
        transition: "outline 0.12s",
        cursor: "default",
      }}
      onClick={() => setSelected(true)}
    >
      {selected && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: 4, right: 4,
            display: "flex", alignItems: "center", gap: 3,
            background: "#111827", borderRadius: 6, padding: "3px 6px",
            zIndex: 50, boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          }}
        >
          <span style={{ fontSize: "8pt", color: "#9ca3af", marginRight: 2, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sec.title}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); moveSectionUp(sec.id); }}
            disabled={isFirst}
            title="Move up"
            style={{
              width: 20, height: 20, background: isFirst ? "transparent" : "#374151",
              color: isFirst ? "#4b5563" : "#e5e7eb",
              border: "none", borderRadius: 3, cursor: isFirst ? "not-allowed" : "pointer",
              fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >↑</button>
          <button
            onClick={(e) => { e.stopPropagation(); moveSectionDown(sec.id); }}
            disabled={isLast}
            title="Move down"
            style={{
              width: 20, height: 20, background: isLast ? "transparent" : "#374151",
              color: isLast ? "#4b5563" : "#e5e7eb",
              border: "none", borderRadius: 3, cursor: isLast ? "not-allowed" : "pointer",
              fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >↓</button>
          <div style={{ width: 1, height: 12, background: "#374151" }} />
          <button
            onClick={handleDelete}
            title="Delete section"
            style={{
              width: 20, height: 20, background: "#7f1d1d", color: "#fca5a5",
              border: "none", borderRadius: 3, cursor: "pointer",
              fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(false); }}
            title="Close"
            style={{
              width: 20, height: 20, background: "transparent", color: "#6b7280",
              border: "none", borderRadius: 3, cursor: "pointer",
              fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
      )}
      {children}
    </div>
  );
}

interface ResumeDocumentProps {
  sections: ResumeSection[];
  theme?: Partial<ResumeTheme>;
  templateSlug?: string;
}

const fmtDate = (s?: string) => {
  if (!s) return "";
  const [year, month] = s.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

function sortedEntries(sec: ResumeSection) {
  return [...(sec.section_entries || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

// ─── DEFAULT single-column layout ─────────────────────────────────────────────

function DefaultLayout({ sections, theme }: { sections: ResumeSection[]; theme?: Partial<ResumeTheme> }) {
  const accent      = theme?.accent_color || "#57CDA4";
  const fontFamily  = theme?.font_family  || "Georgia, serif";
  const fontSize    = theme?.font_size    || 11;
  const lineSpacing = theme?.line_spacing || 1.55;
  const margins     = theme?.margins      || 36;
  const density     = theme?.density      || "standard";

  const sectionGap = density === "compact" ? 12 : density === "spacious" ? 22 : 16;
  const entryGap   = density === "compact" ? 8  : density === "spacious" ? 16 : 11;
  const bulletSize = density === "compact" ? "9.5pt" : "10.5pt";

  const visible = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "9.5pt", fontWeight: 700, letterSpacing: "1.6px",
    textTransform: "uppercase", color: accent,
    borderBottom: "1px solid #e5e7eb", paddingBottom: 5,
    marginBottom: density === "compact" ? 7 : 10,
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, color: "#1a1a1a", padding: margins, minHeight: 1123 }}>
      {personal && (
        <>
          <div style={{ fontSize: "22pt", fontWeight: 700, letterSpacing: "-0.4px", color: "#111", marginBottom: 3 }}>
            <SectionField section={personal} field="name" tag="span" placeholder="Your Name" />
          </div>
          {pd.job_title !== undefined && (
            <div style={{ fontSize: "12pt", color: "#555", marginBottom: 10 }}>
              <SectionField section={personal} field="job_title" tag="span" placeholder="Job Title" />
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: "9.5pt", color: "#555", paddingBottom: 12, borderBottom: `2.5px solid ${accent}`, marginBottom: sectionGap }}>
            {pd.email    && <span>✉ {pd.email}</span>}
            {pd.phone    && <span>📞 {pd.phone}</span>}
            {pd.location && <span>📍 {pd.location}</span>}
            {pd.linkedin && <span>🔗 {pd.linkedin}</span>}
            {pd.website  && <span>🌐 {pd.website}</span>}
            {pd.github   && <span>💻 {pd.github}</span>}
          </div>
        </>
      )}
      {(() => {
        const nonPersonal = visible.filter(s => s.section_type !== "personal");
        return nonPersonal.map((sec, secIdx) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={secIdx === 0} isLast={secIdx === nonPersonal.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={sectionTitleStyle}>
                <SectionTitle section={sec} style={{ textTransform: "uppercase", letterSpacing: "1.6px" }} />
              </div>
              <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
            </div>
          </SectionWrapper>
        ));
      })()}
    </div>
  );
}

// ─── TWO-COLUMN DARK SIDEBAR layout (Samuel Campbell style) ──────────────────

function TwoColumnDarkLayout({ sections, theme }: { sections: ResumeSection[]; theme?: Partial<ResumeTheme> }) {
  const accent      = theme?.accent_color || "#57CDA4";
  const fontFamily  = theme?.font_family  || "'Helvetica Neue', Arial, sans-serif";
  const fontSize    = theme?.font_size    || 10;
  const lineSpacing = theme?.line_spacing || 1.5;
  const margins     = theme?.margins      || 32;
  const density     = theme?.density      || "standard";
  const sidebarBg   = "#1A2B4B";

  const entryGap   = density === "compact" ? 8 : density === "spacious" ? 16 : 11;
  const bulletSize = density === "compact" ? "9pt" : "10pt";
  const sectionGap = density === "compact" ? 14 : density === "spacious" ? 24 : 18;

  const visible = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  const MAIN_TYPES = ["summary", "experience", "education", "projects"];
  const SIDE_TYPES = ["achievements", "skills", "certifications", "courses", "languages", "references"];

  const mainSecs = visible.filter(s => s.section_type !== "personal" && (MAIN_TYPES.includes(s.section_type) || !SIDE_TYPES.includes(s.section_type)));
  const sideSecs = visible.filter(s => SIDE_TYPES.includes(s.section_type));

  const mainTitleStyle: React.CSSProperties = {
    fontSize: "8.5pt", fontWeight: 800, letterSpacing: "2px",
    textTransform: "uppercase", color: accent,
    borderBottom: `1px solid #e2e8f0`, paddingBottom: 4, marginBottom: 8,
  };
  const sideTitleStyle: React.CSSProperties = {
    fontSize: "8pt", fontWeight: 800, letterSpacing: "1.8px",
    textTransform: "uppercase", color: "rgba(255,255,255,0.9)",
    borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 4, marginBottom: 8,
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, display: "flex", minHeight: 1123 }}>
      {/* Main column */}
      <div style={{ flex: "0 0 62%", padding: `${margins}px ${margins}px`, color: "#1a1a1a" }}>
        {/* Header */}
        {personal && (
          <div style={{ marginBottom: sectionGap }}>
            <div style={{ fontSize: "24pt", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f172a", lineHeight: 1.1, marginBottom: 4 }}>
              <SectionField section={personal} field="name" tag="span" placeholder="Your Name" />
            </div>
            {pd.job_title !== undefined && (
              <div style={{ fontSize: "11pt", fontWeight: 500, color: accent, marginBottom: 10 }}>
                <SectionField section={personal} field="job_title" tag="span" placeholder="Job Title" />
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: "8.5pt", color: "#64748b" }}>
              {pd.phone    && <span>📞 {pd.phone}</span>}
              {pd.email    && <span>✉ {pd.email}</span>}
              {pd.linkedin && <span>🔗 {pd.linkedin}</span>}
              {pd.location && <span>📍 {pd.location}</span>}
              {pd.website  && <span>🌐 {pd.website}</span>}
            </div>
          </div>
        )}
        {/* Main sections */}
        {mainSecs.map((sec, i) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={i === 0} isLast={i === mainSecs.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={mainTitleStyle}><SectionTitle section={sec} /></div>
              <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
            </div>
          </SectionWrapper>
        ))}
      </div>

      {/* Dark sidebar */}
      <div style={{ flex: "0 0 38%", background: sidebarBg, padding: `${margins}px ${Math.round(margins * 0.7)}px`, color: "rgba(255,255,255,0.85)" }}>
        {/* Photo placeholder */}
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "2.5px solid rgba(255,255,255,0.25)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "28pt", opacity: 0.4 }}>👤</span>
        </div>

        {sideSecs.map((sec, i) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={i === 0} isLast={i === sideSecs.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={sideTitleStyle}><SectionTitle section={sec} /></div>
              <SidebarSectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
            </div>
          </SectionWrapper>
        ))}
      </div>
    </div>
  );
}

// ─── CORPORATE centered layout (Jack Taylor style) ────────────────────────────

function CorporateLayout({ sections, theme }: { sections: ResumeSection[]; theme?: Partial<ResumeTheme> }) {
  const accent      = theme?.accent_color || "#2C4A7C";
  const fontFamily  = theme?.font_family  || "'Times New Roman', Georgia, serif";
  const fontSize    = theme?.font_size    || 11;
  const lineSpacing = theme?.line_spacing || 1.5;
  const margins     = theme?.margins      || 36;
  const density     = theme?.density      || "standard";

  const sectionGap = density === "compact" ? 12 : density === "spacious" ? 22 : 16;
  const entryGap   = density === "compact" ? 8  : density === "spacious" ? 16 : 12;
  const bulletSize = `${fontSize}pt`;

  const visible = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, color: "#111", padding: margins, minHeight: 1123 }}>
      {/* Centered header */}
      {personal && (
        <div style={{ textAlign: "center", marginBottom: sectionGap }}>
          <div style={{ fontSize: "22pt", fontWeight: 700, letterSpacing: "1px", color: "#0f172a", marginBottom: 4 }}>
            <SectionField section={personal} field="name" tag="span" placeholder="Your Name" />
          </div>
          {pd.job_title !== undefined && (
            <div style={{ fontSize: "11pt", color: "#555", marginBottom: 6 }}>
              <SectionField section={personal} field="job_title" tag="span" placeholder="Job Title" />
            </div>
          )}
          <div style={{ fontSize: "9.5pt", color: "#555", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {[pd.phone, pd.email, pd.linkedin, pd.location].filter(Boolean).map((v, i) => (
              <span key={i}>{i > 0 && <span style={{ marginRight: 8, color: "#bbb" }}>•</span>}{v}</span>
            ))}
          </div>
          <hr style={{ border: "none", borderTop: "1.5px solid #555", margin: "0 auto" }} />
        </div>
      )}

      {(() => {
        const nonPersonal = visible.filter(s => s.section_type !== "personal");
        return nonPersonal.map((sec, i) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={i === 0} isLast={i === nonPersonal.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <hr style={{ border: "none", borderTop: "1px solid #999", marginBottom: 4 }} />
                <SectionTitle section={sec} style={{ fontSize: "10.5pt", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#111" }} />
                <hr style={{ border: "none", borderTop: "1px solid #999", marginTop: 4 }} />
              </div>
              <CorporateSectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
            </div>
          </SectionWrapper>
        ));
      })()}
    </div>
  );
}

// ─── SIDEBAR MODERN layout (Jacob Roberts style) ──────────────────────────────

function SidebarModernLayout({ sections, theme }: { sections: ResumeSection[]; theme?: Partial<ResumeTheme> }) {
  const accent      = theme?.accent_color || "#3B82F6";
  const fontFamily  = theme?.font_family  || "'Helvetica Neue', Arial, sans-serif";
  const fontSize    = theme?.font_size    || 10;
  const lineSpacing = theme?.line_spacing || 1.5;
  const margins     = theme?.margins      || 28;
  const density     = theme?.density      || "standard";

  const sectionGap = density === "compact" ? 14 : density === "spacious" ? 24 : 18;
  const entryGap   = density === "compact" ? 8  : density === "spacious" ? 16 : 12;
  const bulletSize = density === "compact" ? "9pt" : "10pt";

  const visible = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  const MAIN_TYPES = ["summary", "experience", "education", "projects"];
  const SIDE_TYPES = ["achievements", "skills", "certifications", "languages", "references"];

  const mainSecs = visible.filter(s => s.section_type !== "personal" && (MAIN_TYPES.includes(s.section_type) || !SIDE_TYPES.includes(s.section_type)));
  const sideSecs = visible.filter(s => SIDE_TYPES.includes(s.section_type));

  const mainTitleStyle: React.CSSProperties = {
    fontSize: "8.5pt", fontWeight: 800, letterSpacing: "1.8px",
    textTransform: "uppercase", color: accent,
    borderBottom: `1.5px solid ${accent}`, paddingBottom: 4, marginBottom: 8, opacity: 0.9,
  };
  const sideTitleStyle: React.CSSProperties = {
    fontSize: "8pt", fontWeight: 800, letterSpacing: "1.6px",
    textTransform: "uppercase", color: "#1e293b",
    borderBottom: "1px solid #cbd5e1", paddingBottom: 4, marginBottom: 8,
  };

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, display: "flex", minHeight: 1123 }}>
      {/* Main left column */}
      <div style={{ flex: "0 0 60%", padding: `${margins}px ${margins}px`, color: "#1e293b", borderRight: "1px solid #e2e8f0" }}>
        {personal && (
          <div style={{ marginBottom: sectionGap }}>
            <div style={{ fontSize: "22pt", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px", marginBottom: 2 }}>
              <SectionField section={personal} field="name" tag="span" placeholder="Your Name" />
            </div>
            {pd.job_title !== undefined && (
              <div style={{ fontSize: "10.5pt", color: accent, fontWeight: 600, marginBottom: 8 }}>
                <SectionField section={personal} field="job_title" tag="span" placeholder="Job Title" />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 16px", fontSize: "8.5pt", color: "#64748b", marginBottom: 10 }}>
              {pd.phone    && <span>📞 {pd.phone}</span>}
              {pd.email    && <span>✉ {pd.email}</span>}
              {pd.linkedin && <span>🔗 {pd.linkedin}</span>}
              {pd.location && <span>📍 {pd.location}</span>}
              {pd.website  && <span>🌐 {pd.website}</span>}
              {pd.github   && <span>💻 {pd.github}</span>}
            </div>
          </div>
        )}
        {mainSecs.map((sec, idx) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={idx === 0} isLast={idx === mainSecs.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={mainTitleStyle}><SectionTitle section={sec} /></div>
              {sec.section_type === "experience"
                ? <ExperienceWithDash sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} isLast={idx === mainSecs.length - 1} />
                : <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
              }
            </div>
          </SectionWrapper>
        ))}
      </div>

      {/* Light sidebar */}
      <div style={{ flex: "0 0 40%", background: "#F8FAFC", padding: `${margins}px ${Math.round(margins * 0.75)}px`, color: "#1e293b" }}>
        {sideSecs.map((sec, i) => (
          <SectionWrapper key={sec.id} sec={sec} isFirst={i === 0} isLast={i === sideSecs.length - 1}>
            <div style={{ marginBottom: sectionGap }}>
              <div style={sideTitleStyle}><SectionTitle section={sec} /></div>
              {sec.section_type === "skills"
                ? <SkillChips sec={sec} accent={accent} />
                : sec.section_type === "achievements"
                ? <AchievementCards sec={sec} accent={accent} entryGap={entryGap} />
                : <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
              }
            </div>
          </SectionWrapper>
        ))}
      </div>
    </div>
  );
}

// ─── Section body renderers (shared) ──────────────────────────────────────────

function SectionBody({ sec, accent, entryGap, bulletSize }: { sec: ResumeSection; accent: string; entryGap: number; bulletSize: string }) {
  const entries = sortedEntries(sec);

  if (sec.section_type === "summary") {
    return (
      <SectionField
        section={sec}
        field="text"
        tag="p"
        style={{ fontSize: bulletSize, color: "#333", lineHeight: 1.75, margin: 0 }}
        multiline
        placeholder="Write your professional summary here…"
      />
    );
  }

  if (sec.section_type === "experience") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          const startStr = fmtDate(d.startDate);
          const endStr   = d.current ? "Present" : fmtDate(d.endDate);
          const dateStr  = startStr ? `${startStr}${endStr ? ` – ${endStr}` : ""}` : "";
          const bullets  = (d.bullets || []).filter(Boolean);
          return (
            <div key={entry.id} style={{ marginBottom: entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                <div style={{ flex: 1 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="role" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: "#111" }} placeholder="Job Title" />
                  {d.company  && <span style={{ color: accent, fontWeight: 500 }}> — <EntryField sectionId={sec.id} entry={entry} field="company" tag="span" placeholder="Company" /></span>}
                  {d.location && <span style={{ color: "#777", fontSize: "9pt" }}> · <EntryField sectionId={sec.id} entry={entry} field="location" tag="span" placeholder="Location" /></span>}
                </div>
                {dateStr && <span style={{ fontSize: "9pt", color: "#666", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateStr}</span>}
              </div>
              {bullets.length > 0 && (
                <ul style={{ paddingLeft: 16, margin: 0, marginTop: 4 }}>
                  {bullets.map((b: string, i: number) => (
                    <li key={i} style={{ marginBottom: 3, fontSize: bulletSize, color: "#222" }}>
                      <EntryBullet sectionId={sec.id} entry={entry} index={i} value={b} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "education") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          const dateStr = d.startDate ? `${d.startDate}${d.endDate ? ` – ${d.endDate}` : ""}` : "";
          return (
            <div key={entry.id} style={{ marginBottom: entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                <div style={{ flex: 1 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="degree" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: "#111" }} placeholder="Degree" />
                  {d.school && <span style={{ color: "#555", fontWeight: 500 }}> — <EntryField sectionId={sec.id} entry={entry} field="school" tag="span" placeholder="Institution" /></span>}
                </div>
                {dateStr && <span style={{ fontSize: "9pt", color: "#666", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateStr}</span>}
              </div>
              {(d.notes || d.gpa) && (
                <div style={{ fontSize: "9.5pt", color: "#444", fontStyle: "italic" }}>
                  {d.notes && <EntryField sectionId={sec.id} entry={entry} field="notes" tag="span" placeholder="Notes" />}
                  {d.gpa ? ` · GPA: ${d.gpa}` : ""}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "skills") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          if (!d.category && !(d.skills?.length)) return null;
          return (
            <div key={entry.id} style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap", alignItems: "baseline" }}>
              <EntryField sectionId={sec.id} entry={entry} field="category" tag="span" style={{ fontWeight: 700, fontSize: "10pt", color: "#111", minWidth: 90, flexShrink: 0 }} placeholder="Category" />
              <span style={{ fontSize: "10pt", color: "#444" }}>: {(d.skills || []).join(", ")}</span>
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "projects") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          const startStr = fmtDate(d.startDate);
          const endStr   = d.current ? "Present" : fmtDate(d.endDate);
          const dateStr  = startStr ? `${startStr}${endStr ? ` – ${endStr}` : ""}` : "";
          const bullets  = (d.bullets || []).filter(Boolean);
          return (
            <div key={entry.id} style={{ marginBottom: entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                <div style={{ flex: 1 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="name" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: "#111" }} placeholder="Project Name" />
                  {d.role && <span style={{ color: "#555", fontWeight: 500 }}> — <EntryField sectionId={sec.id} entry={entry} field="role" tag="span" placeholder="Role" /></span>}
                </div>
                {dateStr && <span style={{ fontSize: "9pt", color: "#666", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>{dateStr}</span>}
              </div>
              {d.url && <div style={{ fontSize: "9.5pt", color: accent, marginBottom: 3 }}>
                <EntryField sectionId={sec.id} entry={entry} field="url" tag="span" placeholder="URL" />
              </div>}
              {d.description && (
                <EntryField sectionId={sec.id} entry={entry} field="description" tag="p" style={{ fontSize: bulletSize, color: "#333", marginBottom: 4, margin: 0 }} multiline placeholder="Description" />
              )}
              {bullets.length > 0 && (
                <ul style={{ paddingLeft: 16, margin: 0, marginTop: 4 }}>
                  {bullets.map((b: string, i: number) => (
                    <li key={i} style={{ marginBottom: 3, fontSize: bulletSize, color: "#222" }}>
                      <EntryBullet sectionId={sec.id} entry={entry} index={i} value={b} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "certifications") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          return (
            <div key={entry.id} style={{ marginBottom: entryGap - 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="name" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: "#111" }} placeholder="Certification Name" />
                  {d.issuer && <span style={{ color: "#555", fontSize: "9.5pt" }}> — <EntryField sectionId={sec.id} entry={entry} field="issuer" tag="span" placeholder="Issuer" /></span>}
                </div>
                {d.date && <span style={{ fontSize: "9pt", color: "#666", whiteSpace: "nowrap", marginLeft: 8, flexShrink: 0 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="date" tag="span" placeholder="Date" />
                </span>}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "achievements") {
    return (
      <>
        {sec.data?.text && (
          <SectionField section={sec} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333", lineHeight: 1.7, marginBottom: 6 }} multiline placeholder="Achievements text…" />
        )}
        {entries.map(entry => {
          const d = entry.data || {};
          return d.text ? (
            <div key={entry.id} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ color: accent, flexShrink: 0, marginTop: 2 }}>▸</span>
              <EntryField sectionId={sec.id} entry={entry} field="text" tag="span" style={{ fontSize: bulletSize, color: "#333" }} placeholder="Achievement…" />
            </div>
          ) : null;
        })}
      </>
    );
  }

  if (sec.section_type === "languages") {
    return (
      <>
        {sec.data?.text && <SectionField section={sec} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333" }} placeholder="Languages…" />}
        {entries.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {entries.map(entry => {
              const d = entry.data || {};
              return d.language ? (
                <span key={entry.id} style={{ fontSize: bulletSize, color: "#333" }}>
                  <EntryField sectionId={sec.id} entry={entry} field="language" tag="span" style={{ fontWeight: 700 }} placeholder="Language" />
                  {d.proficiency ? <span> (<EntryField sectionId={sec.id} entry={entry} field="proficiency" tag="span" placeholder="Level" />)</span> : ""}
                </span>
              ) : null;
            })}
          </div>
        )}
      </>
    );
  }

  if (sec.section_type === "references") {
    return (
      <>
        {sec.data?.text
          ? <SectionField section={sec} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333" }} placeholder="References note…" />
          : entries.length === 0 ? <p style={{ fontSize: bulletSize, color: "#888", fontStyle: "italic" }}>Available upon request</p>
          : null}
        {entries.map(entry => {
          const d = entry.data || {};
          return d.name ? (
            <div key={entry.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: bulletSize }}>
                <EntryField sectionId={sec.id} entry={entry} field="name" tag="span" placeholder="Name" />
              </div>
              {d.title   && <div style={{ fontSize: "9.5pt", color: "#555" }}><EntryField sectionId={sec.id} entry={entry} field="title" tag="span" placeholder="Title" /></div>}
              {d.company && <div style={{ fontSize: "9.5pt", color: "#555" }}><EntryField sectionId={sec.id} entry={entry} field="company" tag="span" placeholder="Company" /></div>}
              {d.email   && <div style={{ fontSize: "9pt", color: accent }}><EntryField sectionId={sec.id} entry={entry} field="email" tag="span" placeholder="Email" /></div>}
              {d.phone   && <div style={{ fontSize: "9pt", color: "#666" }}><EntryField sectionId={sec.id} entry={entry} field="phone" tag="span" placeholder="Phone" /></div>}
            </div>
          ) : null;
        })}
      </>
    );
  }

  // Generic/custom
  return (
    <>
      {sec.data?.text && (
        <SectionField section={sec} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333", lineHeight: 1.7 }} multiline placeholder="Content…" />
      )}
      {entries.map(entry => {
        const d = entry.data || {};
        return d.text ? (
          <EntryField key={entry.id} sectionId={sec.id} entry={entry} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333", marginBottom: 5 }} multiline placeholder="Content…" />
        ) : null;
      })}
    </>
  );
}

// ─── Sidebar-specific section bodies ─────────────────────────────────────────

function SidebarSectionBody({ sec, accent, entryGap, bulletSize }: { sec: ResumeSection; accent: string; entryGap: number; bulletSize: string }) {
  const entries = sortedEntries(sec);
  const textColor = "rgba(255,255,255,0.75)";
  const headColor = "rgba(255,255,255,0.95)";

  if (sec.section_type === "achievements") {
    const icons = ["🏆", "⭐", "💡", "⚡", "🎯", "🔑"];
    return (
      <>
        {entries.map((entry, i) => {
          const d = entry.data || {};
          return d.text ? (
            <div key={entry.id} style={{ marginBottom: entryGap, paddingBottom: entryGap, borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 2 }}>
                <span style={{ fontSize: "9pt" }}>{icons[i % icons.length]}</span>
                <EntryField sectionId={sec.id} entry={entry} field="title" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: headColor }} placeholder="Achievement title" />
              </div>
              {d.description && (
                <EntryField sectionId={sec.id} entry={entry} field="description" tag="p" style={{ fontSize: "9pt", color: textColor, paddingLeft: 18, margin: 0 }} multiline placeholder="Description…" />
              )}
            </div>
          ) : null;
        })}
      </>
    );
  }

  if (sec.section_type === "skills") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          return (
            <div key={entry.id} style={{ marginBottom: 6 }}>
              {d.category && <div style={{ fontSize: "8.5pt", color: headColor, fontWeight: 600, marginBottom: 2 }}>
                <EntryField sectionId={sec.id} entry={entry} field="category" tag="span" placeholder="Category" />
              </div>}
              <div style={{ fontSize: "9pt", color: textColor }}>{(d.skills || []).join(" · ")}</div>
            </div>
          );
        })}
        {entries.length === 0 && sec.data?.text && (
          <SectionField section={sec} field="text" tag="p" style={{ fontSize: "9pt", color: textColor }} placeholder="Skills…" />
        )}
      </>
    );
  }

  if (sec.section_type === "certifications") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          return (
            <div key={entry.id} style={{ marginBottom: entryGap - 2 }}>
              <div style={{ fontWeight: 700, fontSize: bulletSize, color: headColor }}>
                <EntryField sectionId={sec.id} entry={entry} field="name" tag="span" placeholder="Certification" />
              </div>
              {d.issuer && <div style={{ fontSize: "9pt", color: textColor }}>
                <EntryField sectionId={sec.id} entry={entry} field="issuer" tag="span" placeholder="Issuer" />
              </div>}
              {d.date   && <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.5)" }}>
                <EntryField sectionId={sec.id} entry={entry} field="date" tag="span" placeholder="Date" />
              </div>}
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "languages") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {entries.map(entry => {
          const d = entry.data || {};
          return d.language ? (
            <div key={entry.id} style={{ fontSize: "9.5pt" }}>
              <EntryField sectionId={sec.id} entry={entry} field="language" tag="span" style={{ color: headColor, fontWeight: 600 }} placeholder="Language" />
              {d.proficiency && <span style={{ color: textColor }}> — <EntryField sectionId={sec.id} entry={entry} field="proficiency" tag="span" placeholder="Level" /></span>}
            </div>
          ) : null;
        })}
      </div>
    );
  }

  return (
    <>
      {sec.data?.text && <SectionField section={sec} field="text" tag="p" style={{ fontSize: "9.5pt", color: textColor }} multiline placeholder="Content…" />}
      {entries.map(entry => {
        const d = entry.data || {};
        return d.text ? (
          <EntryField key={entry.id} sectionId={sec.id} entry={entry} field="text" tag="p" style={{ fontSize: "9.5pt", color: textColor, marginBottom: 4 }} multiline placeholder="Content…" />
        ) : null;
      })}
    </>
  );
}

// ─── Corporate-specific section body ─────────────────────────────────────────

function CorporateSectionBody({ sec, accent, entryGap, bulletSize }: { sec: ResumeSection; accent: string; entryGap: number; bulletSize: string }) {
  const entries = sortedEntries(sec);

  if (sec.section_type === "summary") {
    return (
      <SectionField section={sec} field="text" tag="p" style={{ fontSize: bulletSize, color: "#333", lineHeight: 1.75, margin: 0 }} multiline placeholder="Write your professional summary here…" />
    );
  }

  if (sec.section_type === "experience") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          const startStr = fmtDate(d.startDate);
          const endStr   = d.current ? "Present" : fmtDate(d.endDate);
          const dateStr  = startStr ? `${startStr} – ${endStr}` : "";
          const bullets  = (d.bullets || []).filter(Boolean);
          return (
            <div key={entry.id} style={{ marginBottom: entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <EntryField sectionId={sec.id} entry={entry} field="company" tag="span" style={{ fontWeight: 700, fontSize: bulletSize }} placeholder="Company" />
                {d.location && <span style={{ fontSize: "9.5pt", color: "#666" }}>
                  <EntryField sectionId={sec.id} entry={entry} field="location" tag="span" placeholder="Location" />
                </span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <EntryField sectionId={sec.id} entry={entry} field="role" tag="span" style={{ fontStyle: "italic", fontSize: bulletSize, color: accent }} placeholder="Job Title" />
                {dateStr && <span style={{ fontSize: "9.5pt", color: "#666" }}>{dateStr}</span>}
              </div>
              {bullets.length > 0 && (
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  {bullets.map((b: string, i: number) => (
                    <li key={i} style={{ marginBottom: 3, fontSize: bulletSize, color: "#222" }}>
                      <EntryBullet sectionId={sec.id} entry={entry} index={i} value={b} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "education") {
    return (
      <>
        {entries.map(entry => {
          const d = entry.data || {};
          const dateStr = d.startDate ? `${d.startDate}${d.endDate ? ` – ${d.endDate}` : ""}` : "";
          return (
            <div key={entry.id} style={{ marginBottom: entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <EntryField sectionId={sec.id} entry={entry} field="school" tag="span" style={{ fontWeight: 700, fontSize: bulletSize }} placeholder="Institution" />
                {d.location && <span style={{ fontSize: "9.5pt", color: "#666" }}>
                  <EntryField sectionId={sec.id} entry={entry} field="location" tag="span" placeholder="Location" />
                </span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <EntryField sectionId={sec.id} entry={entry} field="degree" tag="span" style={{ fontStyle: "italic", fontSize: bulletSize, color: accent }} placeholder="Degree" />
                {dateStr && <span style={{ fontSize: "9.5pt", color: "#666" }}>{dateStr}</span>}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (sec.section_type === "skills") {
    const allSkills = entries.flatMap(e => e.data?.skills || []).filter(Boolean);
    const skillText = allSkills.length > 0 ? allSkills.join(" · ") : sec.data?.text || "";
    return <p style={{ fontSize: bulletSize, color: "#333" }}>{skillText}</p>;
  }

  // Fallback to standard section body
  return <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />;
}

// ─── Experience with dashed separators (Sidebar Modern) ──────────────────────

function ExperienceWithDash({ sec, accent, entryGap, bulletSize, isLast }: { sec: ResumeSection; accent: string; entryGap: number; bulletSize: string; isLast: boolean }) {
  const entries = sortedEntries(sec);
  return (
    <>
      {entries.map((entry, idx) => {
        const d = entry.data || {};
        const startStr = fmtDate(d.startDate);
        const endStr   = d.current ? "Present" : fmtDate(d.endDate);
        const dateStr  = startStr ? `${startStr} – ${endStr}` : "";
        const bullets  = (d.bullets || []).filter(Boolean);
        const showDash = idx < entries.length - 1;
        return (
          <div key={entry.id}>
            <div style={{ marginBottom: showDash ? 0 : entryGap }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 1 }}>
                <div style={{ flex: 1 }}>
                  <EntryField sectionId={sec.id} entry={entry} field="role" tag="span" style={{ fontWeight: 700, fontSize: bulletSize, color: "#0f172a" }} placeholder="Job Title" />
                  {d.location && <span style={{ fontSize: "8.5pt", color: "#94a3b8" }}> · <EntryField sectionId={sec.id} entry={entry} field="location" tag="span" placeholder="Location" /></span>}
                </div>
                {dateStr && <span style={{ fontSize: "8.5pt", color: "#64748b", whiteSpace: "nowrap", marginLeft: 8 }}>{dateStr}</span>}
              </div>
              {d.company && <div style={{ fontSize: "9.5pt", color: accent, fontWeight: 600, marginBottom: 4 }}>
                <EntryField sectionId={sec.id} entry={entry} field="company" tag="span" placeholder="Company" />
              </div>}
              {bullets.length > 0 && (
                <ul style={{ paddingLeft: 14, margin: 0, marginTop: 3 }}>
                  {bullets.map((b: string, i: number) => (
                    <li key={i} style={{ marginBottom: 2, fontSize: bulletSize, color: "#334155" }}>
                      <EntryBullet sectionId={sec.id} entry={entry} index={i} value={b} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {showDash && (
              <hr style={{ border: "none", borderTop: "1px dashed #cbd5e1", margin: `${entryGap / 2}px 0` }} />
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Skill chips (Sidebar Modern) ────────────────────────────────────────────

function SkillChips({ sec, accent }: { sec: ResumeSection; accent: string }) {
  const entries = sortedEntries(sec);
  const allSkills = entries.flatMap(e => {
    const d = e.data || {};
    return d.skills?.length ? d.skills : [];
  });
  if (allSkills.length === 0 && sec.data?.text) {
    return <p style={{ fontSize: "9.5pt", color: "#475569" }}>{sec.data.text}</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {entries.map(entry => {
        const d = entry.data || {};
        return (
          <div key={entry.id}>
            {d.category && (
              <div style={{ fontSize: "8pt", fontWeight: 700, color: "#64748b", marginTop: 6, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {d.category}
              </div>
            )}
            {(d.skills || []).map((skill: string, i: number) => (
              <span key={i} style={{
                display: "inline-block", margin: "0 3px 4px 0",
                padding: "2px 8px", borderRadius: 12,
                border: `1px solid ${accent}33`,
                background: `${accent}11`,
                fontSize: "8.5pt", color: "#334155",
              }}>{skill}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Achievement cards (Sidebar Modern) ──────────────────────────────────────

function AchievementCards({ sec, accent, entryGap }: { sec: ResumeSection; accent: string; entryGap: number }) {
  const entries = sortedEntries(sec);
  const icons = ["🏆", "📌", "💙", "⚡", "🎯", "🔑"];
  return (
    <>
      {entries.map((entry, i) => {
        const d = entry.data || {};
        return d.text ? (
          <div key={entry.id} style={{ marginBottom: entryGap, paddingBottom: entryGap - 4, borderBottom: "1px dashed #e2e8f0" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 2 }}>
              <span style={{ fontSize: "9pt", color: accent }}>{icons[i % icons.length]}</span>
              <EntryField sectionId={sec.id} entry={entry} field="title" tag="span" style={{ fontWeight: 700, fontSize: "9.5pt", color: "#0f172a" }} placeholder="Achievement title" />
            </div>
            {d.description && (
              <EntryField sectionId={sec.id} entry={entry} field="description" tag="p" style={{ fontSize: "9pt", color: "#64748b", paddingLeft: 18, margin: 0, lineHeight: 1.5 }} multiline placeholder="Description…" />
            )}
          </div>
        ) : null;
      })}
    </>
  );
}

// ─── EXECUTIVE layout (bold header band) ─────────────────────────────────────

function ExecutiveLayout({ sections, theme }: { sections: ResumeSection[]; theme?: Partial<ResumeTheme> }) {
  const accent      = theme?.accent_color || "#F28B82";
  const fontFamily  = theme?.font_family  || "Georgia, serif";
  const fontSize    = theme?.font_size    || 11;
  const lineSpacing = theme?.line_spacing || 1.55;
  const margins     = theme?.margins      || 36;
  const density     = theme?.density      || "standard";

  const sectionGap = density === "compact" ? 12 : density === "spacious" ? 22 : 16;
  const entryGap   = density === "compact" ? 8  : density === "spacious" ? 16 : 11;
  const bulletSize = density === "compact" ? "9.5pt" : "10.5pt";

  const visible = [...sections].filter(s => s.is_visible).sort((a, b) => a.sort_order - b.sort_order);
  const personal = visible.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  return (
    <div style={{ fontFamily, fontSize: `${fontSize}pt`, lineHeight: lineSpacing, color: "#1a1a1a", minHeight: 1123 }}>
      {/* Bold header band */}
      {personal && (
        <div style={{ background: `${accent}18`, padding: `${margins}px ${margins}px ${margins * 0.7}px`, marginBottom: sectionGap, borderBottom: `4px solid ${accent}` }}>
          <div style={{ fontSize: "26pt", fontWeight: 800, letterSpacing: "-0.5px", color: "#0f172a", marginBottom: 4 }}>
            <SectionField section={personal} field="name" tag="span" placeholder="Your Name" />
          </div>
          {pd.job_title !== undefined && (
            <div style={{ fontSize: "13pt", color: "#333", fontWeight: 500, marginBottom: 10 }}>
              <SectionField section={personal} field="job_title" tag="span" placeholder="Job Title" />
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: "9.5pt", color: "#555" }}>
            {pd.email    && <span>✉ {pd.email}</span>}
            {pd.phone    && <span>📞 {pd.phone}</span>}
            {pd.location && <span>📍 {pd.location}</span>}
            {pd.linkedin && <span>🔗 {pd.linkedin}</span>}
            {pd.website  && <span>🌐 {pd.website}</span>}
          </div>
        </div>
      )}
      <div style={{ padding: `0 ${margins}px ${margins}px` }}>
        {(() => {
          const nonPersonal = visible.filter(s => s.section_type !== "personal");
          return nonPersonal.map((sec, i) => (
            <SectionWrapper key={sec.id} sec={sec} isFirst={i === 0} isLast={i === nonPersonal.length - 1}>
              <div style={{ marginBottom: sectionGap }}>
                <div style={{ fontSize: "9.5pt", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: accent, borderBottom: `1.5px solid ${accent}`, paddingBottom: 5, marginBottom: 8 }}>
                  <SectionTitle section={sec} />
                </div>
                <SectionBody sec={sec} accent={accent} entryGap={entryGap} bulletSize={bulletSize} />
              </div>
            </SectionWrapper>
          ));
        })()}
      </div>
    </div>
  );
}

// ─── MAIN export ──────────────────────────────────────────────────────────────

function getLayoutType(slug: string): "two-column" | "sidebar" | "single" {
  if (slug === "two-column-dark") return "two-column";
  if (slug === "sidebar-modern") return "sidebar";
  // Check custom templates stored in localStorage
  try {
    const custom = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("resumeos_custom_templates") || "[]")
      : [];
    const found = custom.find((t: any) => t.slug === slug);
    if (found) return found.layout as any;
  } catch {}
  return "single";
}

export function ResumeDocument({ sections, theme, templateSlug }: ResumeDocumentProps) {
  const slug = templateSlug || "two-column-dark";
  const layoutType = getLayoutType(slug);

  return (
    <div style={{ width: 794, minHeight: 1123, position: "relative" }}>
      {(slug === "two-column-dark" || layoutType === "two-column") && <TwoColumnDarkLayout sections={sections} theme={theme} />}
      {slug === "corporate"                                          && <CorporateLayout sections={sections} theme={theme} />}
      {(slug === "sidebar-modern"  || layoutType === "sidebar")     && <SidebarModernLayout sections={sections} theme={theme} />}
      {layoutType === "single" && slug !== "corporate"               && <DefaultLayout sections={sections} theme={theme} />}
    </div>
  );
}

"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Plus, Eye, EyeOff, Trash2, GripVertical, Loader, Search, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useBuilderStore } from "@/store";
import { sectionApi, aiApi, resumeApi } from "@/lib/api";
import { SectionForm } from "./SectionForm";
import { TemplateThumbnail } from "./TemplateThumbnail";
import { AddSectionModal } from "./AddSectionModal";
import { SECTION_EXAMPLE_DATA } from "@/lib/sampleData";
import { calcAtsScore, getScoreBreakdown, getScoreSuggestions } from "@/lib/atsScore";
import { RESUME_FONTS, loadGoogleFont } from "@/lib/fonts";
import type { ResumeSection, SectionType } from "@/types";

const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "summary",        label: "Professional Summary" },
  { type: "experience",     label: "Work Experience" },
  { type: "education",      label: "Education" },
  { type: "skills",         label: "Skills" },
  { type: "projects",       label: "Projects" },
  { type: "certifications", label: "Certifications" },
  { type: "achievements",   label: "Achievements" },
  { type: "languages",      label: "Languages" },
  { type: "references",     label: "References" },
];

const BASE_TEMPLATES = [
  { slug: "two-column-dark", name: "Two-Column Pro", tag: "Popular", color: "#3B6FD4" },
  { slug: "corporate",       name: "Corporate",      tag: "ATS",     color: "#2C4A7C" },
  { slug: "sidebar-modern",  name: "Sidebar Modern", tag: "New",     color: "#3B82F6" },
];

function getTemplateList() {
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("resumeos_custom_templates") : null;
    const custom = stored ? JSON.parse(stored) : [];
    return [...BASE_TEMPLATES, ...custom];
  } catch { return BASE_TEMPLATES; }
}

const ACCENT_COLORS = [
  "#57CDA4","#A396E2","#F28B82","#F6B26B",
  "#7BAFD4","#374151","#EC4899","#10B981",
];

const FONT_CATEGORIES = ["all", "serif", "sans-serif", "monospace"] as const;

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<typeof FONT_CATEGORIES[number]>("all");
  const ref = useRef<HTMLDivElement>(null);

  const currentFont = RESUME_FONTS.find(f => f.value === value);

  const filtered = RESUME_FONTS.filter(f =>
    (category === "all" || f.category === category) &&
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none hover:border-teal-400 focus:border-teal-400 transition"
        style={{ fontFamily: value }}
      >
        <span className="truncate">{currentFont?.name || "Select font…"}</span>
        <ChevronDown size={14} className={`ml-2 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={13} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fonts…"
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
            />
          </div>
          {/* Category tabs */}
          <div className="flex border-b border-gray-100">
            {FONT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  category === cat ? "border-b-2 border-teal-500 text-teal-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Font list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">No fonts found</p>
            )}
            {filtered.map(font => (
              <button
                key={font.value}
                onClick={() => { onChange(font.value); setOpen(false); setSearch(""); }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition ${
                  font.value === value ? "bg-teal-50 text-teal-700" : "text-gray-700"
                }`}
                style={{ fontFamily: font.value }}
              >
                <span>{font.name}</span>
                <span className="ml-2 text-[10px] text-gray-400 font-sans">{font.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EditorPanelProps { resumeId: string; }

export function EditorPanel({ resumeId }: EditorPanelProps) {
  const {
    sections, resume, activePanel, activeSectionId,
    setActiveSectionId, updateSection, addSection, removeSection,
    reorderSections, setTheme, pushHistory, setDirty,
  } = useBuilderStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [edTab,        setEdTab]        = useState<"edit" | "preview">("edit");
  const [dragIdx,      setDragIdx]      = useState<number | null>(null);
  const [dragOverIdx,  setDragOverIdx]  = useState<number | null>(null);
  const [TEMPLATES]                     = useState(() => getTemplateList());

  // JD state
  const [jdText,    setJdText]    = useState("");
  const [jdResult,  setJdResult]  = useState<any>(null);
  const [jdLoading, setJdLoading] = useState(false);

  // AI state
  const [aiStatus,  setAiStatus]  = useState<{ enabled: boolean; message: string; provider?: string; model?: string } | null>(null);
  const [aiChecked, setAiChecked] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState("");
  const [aiFeature, setAiFeature] = useState<string | null>(null);

  const activeSection = sections.find(s => s.id === activeSectionId) ?? null;
  const score       = calcAtsScore(sections);
  const breakdown   = getScoreBreakdown(sections);
  const suggestions = getScoreSuggestions(sections);
  const theme       = resume?.resume_customizations;

  // Check AI status when AI panel is opened
  useEffect(() => {
    if (activePanel === "ai" && !aiChecked) {
      setAiChecked(true);
      aiApi.status()
        .then(({ data }) => setAiStatus({ enabled: data.enabled, message: data.message, provider: data.provider, model: data.model }))
        .catch(() => setAiStatus({ enabled: false, message: "Could not contact server." }));
    }
  }, [activePanel, aiChecked]);

  // Also check AI status when JD panel opens (JD also uses AI)
  useEffect(() => {
    if ((activePanel === "jd" || activePanel === "ai") && !aiChecked) {
      setAiChecked(true);
      aiApi.status()
        .then(({ data }) => setAiStatus({ enabled: data.enabled, message: data.message, provider: data.provider, model: data.model }))
        .catch(() => setAiStatus({ enabled: false, message: "Could not contact server." }));
    }
  }, [activePanel]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };

  const onDrop = useCallback(async (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    reorderSections(reordered);
    setDragIdx(null); setDragOverIdx(null);
    pushHistory();
    try {
      const order = reordered.map((sec, i) => ({ id: sec.id, sort_order: i }));
      await sectionApi.reorder(resumeId, order);
    } catch { /* autosave will retry */ }
  }, [dragIdx, sections, resumeId, reorderSections, pushHistory]);

  // ── Add Section with example data ─────────────────────────────────────────
  const handleAddSection = async (type: SectionType, label: string) => {
    const example = SECTION_EXAMPLE_DATA[type] || SECTION_EXAMPLE_DATA["custom"];
    try {
      const createRes = await sectionApi.create(resumeId, {
        section_type: type,
        title: label,
        sort_order: sections.length,
        data: example.data || {},
      });
      const createdSection = createRes.data?.section;
      if (!createdSection?.id) throw new Error("Server did not return a section");
      const sectionId = createdSection.id;

      if (example.entries?.length) {
        await Promise.all(
          example.entries.map(entry =>
            sectionApi.createEntry(resumeId, sectionId, entry).catch(() => null)
          )
        );
        const listRes = await sectionApi.list(resumeId);
        const freshSec = (listRes.data?.sections || []).find((s: any) => s.id === sectionId);
        addSection({
          ...(freshSec ?? createdSection),
          section_entries: freshSec?.section_entries ?? [],
        });
      } else {
        addSection({ ...createdSection, section_entries: [] });
      }
      setActiveSectionId(sectionId);
      setShowAddModal(false);
      pushHistory();
      toast.success(`${label} section added`);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to add section";
      console.error("[handleAddSection]", err?.response?.data ?? err);
      toast.error(msg);
    }
  };

  // ── Toggle Visibility ──────────────────────────────────────────────────────
  const toggleVis = async (sec: ResumeSection) => {
    const newVal = !sec.is_visible;
    updateSection(sec.id, { is_visible: newVal });
    try { await sectionApi.update(resumeId, sec.id, { is_visible: newVal }); }
    catch { updateSection(sec.id, { is_visible: !newVal }); toast.error("Failed to update"); }
  };

  // ── Delete Section ─────────────────────────────────────────────────────────
  const handleDelete = async (secId: string) => {
    const sec = sections.find(s => s.id === secId);
    if (!confirm(`Remove "${sec?.title}" section?`)) return;
    removeSection(secId);
    try { await sectionApi.delete(resumeId, secId); pushHistory(); toast.success("Removed"); }
    catch { toast.error("Failed to remove"); }
  };

  // ── Template Switch ────────────────────────────────────────────────────────
  const handleTemplateChange = async (slug: string) => {
    const tmpl = TEMPLATES.find((t: any) => t.slug === slug);
    if (!tmpl) return;
    useBuilderStore.setState(s => ({
      resume: s.resume ? { ...s.resume, template_slug: slug } : null,
      isDirty: true,
    }));
    setTheme({ accent_color: tmpl.color });
    try { await resumeApi.update(resumeId, { template_slug: slug }); toast.success(`Template: ${tmpl.name}`); }
    catch { toast.error("Failed to save template"); }
  };

  // ── JD Analysis ────────────────────────────────────────────────────────────
  const analyzeJD = async () => {
    if (!jdText.trim()) return toast.error("Paste a job description first");
    if (!aiStatus?.enabled) return toast.error("AI is disabled. Ask your admin to enable it.");

    setJdLoading(true);
    try {
      const resumeText = sections.map(s => {
        const parts = [s.title, s.data?.text || ""];
        (s.section_entries || []).forEach(e => {
          const d = e.data || {};
          parts.push(d.role || "", d.company || "", d.degree || "", d.school || "",
            d.name || "", ...(d.skills || []), ...(d.bullets || []), d.description || "");
        });
        return parts.join(" ");
      }).join(" ");

      const { data } = await aiApi.keywordMatch({ job_description: jdText, resume_text: resumeText, resume_id: resumeId });
      setJdResult(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Analysis failed";
      toast.error(msg);
    } finally { setJdLoading(false); }
  };

  // ── AI Actions ─────────────────────────────────────────────────────────────
  const runAI = async (feature: string) => {
    if (!aiStatus?.enabled) {
      toast.error("AI is disabled. Contact your admin to enable it.");
      return;
    }
    setAiLoading(true); setAiResult(""); setAiFeature(feature);
    const jobTitle = sections.find(s => s.section_type === "personal")?.data?.job_title || "professional";
    try {
      let result = "";
      if (feature === "summary") {
        const { data } = await aiApi.generateSummary({ job_title: jobTitle, resume_id: resumeId });
        result = data.summary;
      } else if (feature === "skills") {
        const existing = (sections.find(s => s.section_type === "skills")?.section_entries || []).flatMap(e => e.data?.skills || []);
        const { data } = await aiApi.suggestSkills({ job_title: jobTitle, existing_skills: existing, resume_id: resumeId });
        result = Array.isArray(data.skills) ? data.skills.join(", ") : "No suggestions";
      } else if (feature === "bullets") {
        const exp = sections.find(s => s.section_type === "experience");
        const bullets = exp?.section_entries?.[0]?.data?.bullets?.filter(Boolean) || [];
        if (!bullets.length) { toast.error("Add some experience bullet points first"); setAiLoading(false); return; }
        const { data } = await aiApi.improveBullets({ bullets, job_title: jobTitle, resume_id: resumeId });
        result = Array.isArray(data.bullets) ? data.bullets.join("\n") : "";
      }
      setAiResult(result);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "AI request failed";
      toast.error(msg);
    } finally { setAiLoading(false); }
  };

  // ── Apply AI result ────────────────────────────────────────────────────────
  const applyAIResult = () => {
    if (!aiResult) return;
    if (aiFeature === "summary") {
      const summarySection = sections.find(s => s.section_type === "summary");
      if (summarySection) {
        updateSection(summarySection.id, { data: { text: aiResult } });
        setActiveSectionId(summarySection.id);
        toast.success("Summary applied!");
      } else toast.error("Add a Professional Summary section first");
    } else if (aiFeature === "bullets") {
      const exp = sections.find(s => s.section_type === "experience");
      if (exp?.section_entries?.[0]) {
        const newBullets = aiResult.split("\n").map(b => b.replace(/^[•\-\*]\s*/, "").trim()).filter(Boolean);
        const updatedEntries = exp.section_entries.map((e, i) =>
          i === 0 ? { ...e, data: { ...e.data, bullets: newBullets } } : e
        );
        updateSection(exp.id, { section_entries: updatedEntries });
        setActiveSectionId(exp.id);
        toast.success("Bullets applied!");
      }
    } else if (aiFeature === "skills") {
      const skillSection = sections.find(s => s.section_type === "skills");
      if (skillSection) {
        toast.success("Add these skills to your Skills section.");
        setActiveSectionId(skillSection.id);
      }
    }
    setDirty(true);
    setAiResult(""); setAiFeature(null);
  };

  return (
    <div className="flex w-[320px] min-w-[320px] flex-col overflow-hidden border-r border-gray-200 bg-white">

      {/* ══ SECTIONS ══════════════════════════════════════════════════════════ */}
      {activePanel === "sections" && (
        <>
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Resume Sections</span>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 transition">
              <Plus size={13} /> Add
            </button>
          </div>

          <div className="flex-shrink-0 overflow-y-auto px-3 py-2" style={{ maxHeight: "42%" }}>
            <div className="flex flex-col gap-1">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={e => onDragOver(e, idx)}
                  onDrop={e => onDrop(e, idx)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={[
                    "group flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition select-none",
                    activeSectionId === sec.id ? "border-teal-400 bg-teal-50" : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50",
                    !sec.is_visible ? "opacity-40" : "",
                    dragOverIdx === idx ? "border-teal-300 bg-teal-50" : "",
                    dragIdx === idx ? "opacity-40 scale-95" : "",
                  ].join(" ")}>
                  <GripVertical size={14} className="flex-shrink-0 cursor-grab text-gray-300" />
                  <span className={`flex-1 truncate text-[13px] font-medium ${activeSectionId === sec.id ? "text-gray-900" : "text-gray-600"}`}>
                    {sec.title}
                  </span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={e => { e.stopPropagation(); toggleVis(sec); }}
                      className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition">
                      {sec.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    {sec.section_type !== "personal" && (
                      <button onClick={e => { e.stopPropagation(); handleDelete(sec.id); }}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-500 transition">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <div className="py-8 text-center text-xs text-gray-400">No sections yet. Click <strong>Add</strong> to start.</div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden border-t border-gray-100">
            <div className="flex flex-shrink-0 gap-1 border-b border-gray-100 px-4 py-2">
              {(["edit", "preview"] as const).map(t => (
                <button key={t} onClick={() => setEdTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${edTab === t ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
                  {t === "edit" ? "Edit Section" : "Tips"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {edTab === "edit" ? (
                <SectionForm section={activeSection} resumeId={resumeId} />
              ) : (
                <div className="rounded-xl bg-teal-50 p-4 text-xs text-teal-800 leading-relaxed">
                  <strong className="block mb-1">Tips:</strong>
                  {activeSection?.section_type === "experience" && "Use strong action verbs (Led, Built, Increased). Add quantifiable metrics. Keep bullets to 1-2 lines."}
                  {activeSection?.section_type === "summary" && "3-4 sentences. Mention years of experience, key skills, one major achievement. Under 80 words."}
                  {activeSection?.section_type === "skills" && "Group by category. Most relevant first. List only skills you know well."}
                  {!activeSection && "Click a section above to start editing."}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══ TEMPLATES ════════════════════════════════════════════════════════ */}
      {activePanel === "templates" && (
        <>
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Templates</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-3 text-xs text-gray-400">Selecting a template updates the preview instantly.</p>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map(tmpl => {
                const isSelected = resume?.template_slug === tmpl.slug;
                return (
                  <div key={tmpl.slug} onClick={() => handleTemplateChange(tmpl.slug)}
                    className={`cursor-pointer overflow-hidden rounded-xl border-2 transition hover:-translate-y-0.5 hover:shadow-md ${isSelected ? "border-teal-400 shadow-md ring-2 ring-teal-200" : "border-gray-200"}`}>
                    <div className="relative bg-white" style={{ height: 120, padding: 5, overflow: "hidden" }}>
                      <div className="h-full w-full overflow-hidden rounded border border-gray-100">
                        <TemplateThumbnail slug={tmpl.slug} color={tmpl.color} />
                      </div>
                      <span className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[8px] font-bold text-white shadow"
                        style={{ background: tmpl.tag === "New" ? "#10B981" : tmpl.color }}>
                        {tmpl.tag}
                      </span>
                      {isSelected && (
                        <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white text-[10px] font-bold shadow">✓</span>
                      )}
                    </div>
                    <div className="bg-white px-2.5 py-2">
                      <span className="text-xs font-semibold text-gray-700">{tmpl.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══ DESIGN ═══════════════════════════════════════════════════════════ */}
      {activePanel === "design" && (
        <>
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Design Settings</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map(c => (
                  <button key={c} style={{ background: c }} onClick={() => setTheme({ accent_color: c })}
                    className={`h-7 w-7 rounded-full transition hover:scale-110 ${theme?.accent_color === c ? "ring-2 ring-gray-800 ring-offset-2" : ""}`} />
                ))}
                <div className="relative">
                  <input type="color" value={theme?.accent_color || "#57CDA4"} onChange={e => setTheme({ accent_color: e.target.value })}
                    className="absolute inset-0 h-7 w-7 cursor-pointer rounded-full opacity-0" />
                  <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-xs text-gray-400 hover:border-teal-400">+</div>
                </div>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Font Family</label>
              <FontPicker
                value={theme?.font_family || "Georgia, serif"}
                onChange={v => { const f = RESUME_FONTS.find(fn => fn.value === v); if (f) loadGoogleFont(f); setTheme({ font_family: v }); }}
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Font Size: {theme?.font_size || 11}pt</label>
              <input type="range" min={9} max={13} step={0.5} value={theme?.font_size || 11} onChange={e => setTheme({ font_size: parseFloat(e.target.value) })} className="w-full accent-teal-500" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Line Spacing: {(theme?.line_spacing || 1.55).toFixed(1)}</label>
              <input type="range" min={1.2} max={2.0} step={0.1} value={theme?.line_spacing || 1.55} onChange={e => setTheme({ line_spacing: parseFloat(e.target.value) })} className="w-full accent-teal-500" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Margins: {theme?.margins || 36}px</label>
              <input type="range" min={16} max={72} step={4} value={theme?.margins || 36} onChange={e => setTheme({ margins: parseInt(e.target.value) })} className="w-full accent-teal-500" />
            </div>
            <div className="h-px bg-gray-100" />
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Page Size</label>
              <div className="grid grid-cols-2 gap-2">
                {(["A4", "Letter"] as const).map(s => (
                  <button key={s} onClick={() => setTheme({ page_size: s })}
                    className={`rounded-lg border-2 py-2 text-xs font-medium transition ${theme?.page_size === s || (!theme?.page_size && s === "A4") ? "border-teal-400 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Density</label>
              <div className="grid grid-cols-3 gap-2">
                {(["compact", "standard", "spacious"] as const).map(d => (
                  <button key={d} onClick={() => setTheme({ density: d })}
                    className={`rounded-lg border-2 py-2 text-xs font-medium capitalize transition ${theme?.density === d || (!theme?.density && d === "standard") ? "border-teal-400 bg-teal-50 text-teal-700 font-semibold" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setTheme({ accent_color: "#57CDA4", font_family: "Georgia, serif", font_size: 11, line_spacing: 1.55, margins: 36, page_size: "A4", density: "standard" })}
              className="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50 transition">
              Reset to Defaults
            </button>
          </div>
        </>
      )}

      {/* ══ ATS SCORE ═════════════════════════════════════════════════════════ */}
      {activePanel === "score" && (
        <>
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">ATS Score Analysis</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="relative mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${score >= 85 ? "#57CDA4" : score >= 60 ? "#F59E0B" : "#EF4444"} ${score * 3.6}deg, #E5E7EB 0deg)` }}>
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold text-gray-900">{score}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">ATS Score</span>
              </div>
            </div>
            <p className={`mb-4 text-center text-sm font-semibold ${score >= 85 ? "text-teal-600" : score >= 60 ? "text-yellow-600" : "text-red-500"}`}>
              {score >= 85 ? "Excellent — ATS Ready ✓" : score >= 60 ? "Good — Room to Improve" : "Needs Work"}
            </p>
            <div className="mb-4 space-y-3">
              {Object.entries(breakdown).map(([label, val]) => (
                <div key={label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-400">{val}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, background: val >= 80 ? "#57CDA4" : val >= 50 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-100 mb-4" />
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Suggestions</p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex gap-2.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                  <p className="text-xs text-gray-500 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ JD MATCH ══════════════════════════════════════════════════════════ */}
      {activePanel === "jd" && (
        <>
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">Job Description Match</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* AI disabled notice */}
            {aiStatus && !aiStatus.enabled && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
                <span className="text-base">⚠️</span>
                <div><strong>AI is disabled.</strong> {aiStatus.message}</div>
              </div>
            )}

            {!jdResult ? (
              <>
                <p className="mb-3 text-xs text-gray-400 leading-relaxed">Paste a job description to see keyword match, missing skills, and suggestions.</p>
                <textarea value={jdText} onChange={e => setJdText(e.target.value)} rows={10}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-gray-50 p-3 text-sm outline-none transition focus:border-teal-400 focus:bg-white"
                  placeholder="Paste the full job description here…" />
                <button onClick={analyzeJD} disabled={jdLoading || !jdText.trim() || (aiStatus !== null && !aiStatus.enabled)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60">
                  {jdLoading ? <><Loader size={14} className="animate-spin" /> Analyzing…</> : "Analyze Match"}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 text-center">
                  <div className={`font-serif text-5xl font-bold ${jdResult.match_percentage >= 70 ? "text-teal-500" : jdResult.match_percentage >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                    {jdResult.match_percentage}%
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Keyword Match Rate</p>
                </div>
                {jdResult.found_keywords?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-600">✓ Found ({jdResult.found_keywords.length})</p>
                    <div className="flex flex-wrap gap-1.5">{jdResult.found_keywords.map((k: string) => <span key={k} className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">{k}</span>)}</div>
                  </div>
                )}
                {jdResult.missing_keywords?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red-500">✗ Missing ({jdResult.missing_keywords.length})</p>
                    <div className="flex flex-wrap gap-1.5">{jdResult.missing_keywords.map((k: string) => <span key={k} className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">{k}</span>)}</div>
                  </div>
                )}
                {jdResult.recommendations?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Recommendations</p>
                    <ul className="space-y-1.5">{jdResult.recommendations.map((r: string, i: number) => <li key={i} className="flex gap-2 text-xs text-gray-500"><span className="text-teal-500 flex-shrink-0">→</span>{r}</li>)}</ul>
                  </div>
                )}
                <button onClick={() => { setJdResult(null); setJdText(""); }} className="w-full rounded-xl border border-gray-200 py-2 text-xs font-medium text-gray-500 transition hover:bg-gray-50">
                  Analyze Different Job
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ══ AI ASSISTANT ══════════════════════════════════════════════════════ */}
      {activePanel === "ai" && (
        <>
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-800">AI Assistant</span>
            {aiStatus?.enabled && (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600">
                {aiStatus.provider || "AI"} Active
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Loading status check */}
            {!aiStatus && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader size={14} className="animate-spin" /> Checking AI availability…
              </div>
            )}

            {/* AI Disabled state */}
            {aiStatus && !aiStatus.enabled && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="font-semibold text-gray-700 mb-1">AI Features Disabled</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{aiStatus.message}</p>
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2.5 text-xs text-yellow-700 text-left">
                  <strong>Admin:</strong> Go to the{" "}
                  <a href="/admin" className="underline hover:text-yellow-900">Admin Panel → AI Settings</a>{" "}
                  to configure your API key and enable AI features.
                </div>
              </div>
            )}

            {/* AI Enabled state */}
            {aiStatus?.enabled && (
              <>
                <p className="mb-4 text-xs text-gray-400 leading-relaxed">
                  Powered by <strong>{aiStatus.provider}</strong> ({aiStatus.model}). Results are applied directly to your resume.
                </p>
                {[
                  { feature: "summary", label: "Generate Professional Summary",  desc: "3-4 sentence summary tailored to your role" },
                  { feature: "bullets", label: "Improve Bullet Points",          desc: "Rewrite with strong action verbs and metrics" },
                  { feature: "skills",  label: "Suggest Missing Skills",         desc: "In-demand skills for your job title" },
                ].map(({ feature, label, desc }) => (
                  <button key={feature} onClick={() => runAI(feature)} disabled={aiLoading}
                    className="mb-2 w-full rounded-xl border-2 border-gray-100 bg-gray-50 p-3.5 text-left transition hover:border-teal-300 hover:bg-teal-50 disabled:opacity-50">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-teal-500">✦</span>
                      <span className="text-[13px] font-semibold text-gray-800">{label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </button>
                ))}

                {aiLoading && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
                    <Loader size={15} className="animate-spin flex-shrink-0" /> Generating with {aiStatus.provider}…
                  </div>
                )}

                {aiResult && !aiLoading && (
                  <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-teal-600">
                      {aiFeature === "summary" ? "Generated Summary" : aiFeature === "bullets" ? "Improved Bullets" : "Suggested Skills"}
                    </p>
                    <p className="mb-3 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{aiResult}</p>
                    <div className="flex gap-2">
                      <button onClick={applyAIResult}
                        className="flex-1 rounded-lg bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-600">
                        Apply to Resume
                      </button>
                      <button onClick={() => { setAiResult(""); setAiFeature(null); }}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ══ ADD SECTION MODAL (rich visual picker) ══════════════════════════ */}
      {showAddModal && (
        <AddSectionModal
          onAdd={handleAddSection}
          onClose={() => setShowAddModal(false)}
          existingSectionTypes={sections.map(s => s.section_type)}
        />
      )}
    </div>
  );
}

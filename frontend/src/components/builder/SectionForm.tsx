"use client";
import { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/store";
import { sectionApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { ResumeSection } from "@/types";

interface SectionFormProps {
  section: ResumeSection | null;
  resumeId: string;
}

export function SectionForm({ section, resumeId }: SectionFormProps) {
  const { updateSection, setDirty } = useBuilderStore();

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
        <div className="mb-3 text-4xl">✏️</div>
        <p className="text-sm">Select a section from the list to edit it</p>
      </div>
    );
  }

  const update = (data: Partial<ResumeSection>) => {
    updateSection(section.id, data);
    // isDirty is set inside updateSection via store, but belt+suspenders:
    setDirty(true);
  };

  return (
    <div>
      {/* Section Title rename */}
      <div className="mb-4 border-b border-gray-100 pb-4">
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Section Title
        </label>
        <input
          value={section.title}
          onChange={e => update({ title: e.target.value })}
          className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white"
        />
      </div>

      {section.section_type === "personal"        && <PersonalForm        s={section} update={update} />}
      {section.section_type === "summary"         && <SummaryForm         s={section} update={update} />}
      {section.section_type === "experience"      && <ExperienceForm      s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "education"       && <EducationForm       s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "skills"          && <SkillsForm          s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "projects"        && <ProjectsForm        s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "certifications"  && <CertificationsForm  s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "achievements"    && <AchievementsForm    s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "languages"       && <LanguagesForm       s={section} update={update} resumeId={resumeId} />}
      {section.section_type === "references"      && <ReferencesForm      s={section} update={update} resumeId={resumeId} />}
      {!["personal","summary","experience","education","skills","projects","certifications","achievements","languages","references"].includes(section.section_type) && (
        <CustomForm s={section} update={update} resumeId={resumeId} />
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
type UpdateFn = (d: Partial<ResumeSection>) => void;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-3">
    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white placeholder:text-gray-300"
  />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white resize-none placeholder:text-gray-300 leading-relaxed"
  />
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <div className="mb-3 flex items-center gap-2">
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${checked ? "bg-teal-500" : "bg-gray-200"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

function EntryCard({
  title, subtitle, open, onToggle, onDelete, children,
}: {
  title: string; subtitle?: string; open: boolean;
  onToggle: () => void; onDelete: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-2 overflow-hidden rounded-xl border-2 border-gray-100 bg-gray-50">
      <div className="flex cursor-pointer items-center gap-2 px-3 py-2.5" onClick={onToggle}>
        {open
          ? <ChevronUp size={14} className="flex-shrink-0 text-gray-400" />
          : <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-800">{title || "New Entry"}</div>
          {subtitle && <div className="truncate text-xs text-gray-400">{subtitle}</div>}
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-red-100 hover:text-red-500">
          <Trash2 size={12} />
        </button>
      </div>
      {open && <div className="border-t border-gray-100 bg-white p-3">{children}</div>}
    </div>
  );
}

/* ── PERSONAL ────────────────────────────────────────────────────────────── */
function PersonalForm({ s, update }: { s: ResumeSection; update: UpdateFn }) {
  const d = s.data || {};
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    update({ data: { ...d, [k]: e.target.value } });

  return (
    <div>
      <Field label="Full Name">       <Input value={d.name      || ""} onChange={set("name")}      placeholder="Your Name" /></Field>
      <Field label="Job Title">       <Input value={d.job_title || ""} onChange={set("job_title")}  placeholder="Senior Designer" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Email">         <Input type="email" value={d.email    || ""} onChange={set("email")}    placeholder="you@email.com" /></Field>
        <Field label="Phone">         <Input value={d.phone    || ""} onChange={set("phone")}    placeholder="+1 555-1234" /></Field>
      </div>
      <Field label="Location">        <Input value={d.location  || ""} onChange={set("location")}  placeholder="San Francisco, CA" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="LinkedIn">      <Input value={d.linkedin  || ""} onChange={set("linkedin")}  placeholder="linkedin.com/in/…" /></Field>
        <Field label="Website">       <Input value={d.website   || ""} onChange={set("website")}   placeholder="yoursite.com" /></Field>
      </div>
      <Field label="GitHub">          <Input value={d.github    || ""} onChange={set("github")}    placeholder="github.com/…" /></Field>
    </div>
  );
}

/* ── SUMMARY ─────────────────────────────────────────────────────────────── */
function SummaryForm({ s, update }: { s: ResumeSection; update: UpdateFn }) {
  const text = s.data?.text || "";
  return (
    <div>
      <Field label="Summary Text">
        <Textarea
          rows={6}
          value={text}
          onChange={e => update({ data: { text: e.target.value } })}
          placeholder="Write a compelling 3-4 sentence professional summary…"
          style={{ minHeight: 130 }}
        />
      </Field>
      <p className="text-[11px] text-gray-400">{text.length}/600 characters</p>
    </div>
  );
}

/* ── EXPERIENCE ──────────────────────────────────────────────────────────── */
function ExperienceForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const [openId, setOpenId] = useState<string | null>(s.section_entries?.[0]?.id || null);
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, {
        role: "", company: "", location: "", startDate: "", endDate: "", current: false, bullets: [""],
      });
      update({ section_entries: [...entries, data.entry] });
      setOpenId(data.entry.id);
    } catch { toast.error("Failed to add entry"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  const updBullet = (entryId: string, idx: number, val: string) => {
    const entry = entries.find(e => e.id === entryId)!;
    const bullets = [...(entry.data.bullets || [])];
    bullets[idx] = val;
    updEntry(entryId, { bullets });
  };

  const addBullet = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)!;
    updEntry(entryId, { bullets: [...(entry.data.bullets || []), ""] });
  };

  const delBullet = (entryId: string, idx: number) => {
    const entry = entries.find(e => e.id === entryId)!;
    updEntry(entryId, { bullets: (entry.data.bullets || []).filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div>
      {entries.map(entry => {
        const d = entry.data || {};
        const open = openId === entry.id;
        return (
          <EntryCard
            key={entry.id}
            title={d.role || "New Role"}
            subtitle={d.company}
            open={open}
            onToggle={() => setOpenId(open ? null : entry.id)}
            onDelete={() => delEntry(entry.id)}>
            <Field label="Job Title">
              <Input value={d.role || ""} onChange={e => updEntry(entry.id, { role: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Company">
                <Input value={d.company || ""} onChange={e => updEntry(entry.id, { company: e.target.value })} />
              </Field>
              <Field label="Location">
                <Input value={d.location || ""} onChange={e => updEntry(entry.id, { location: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Date">
                <Input type="month" value={d.startDate || ""} onChange={e => updEntry(entry.id, { startDate: e.target.value })} />
              </Field>
              <Field label="End Date">
                <Input type="month" value={d.endDate || ""} disabled={d.current} onChange={e => updEntry(entry.id, { endDate: e.target.value })} />
              </Field>
            </div>
            <Toggle checked={!!d.current} onChange={() => updEntry(entry.id, { current: !d.current })} label="Currently working here" />
            <Field label="Bullet Points">
              {(d.bullets || []).map((b: string, i: number) => (
                <div key={i} className="mb-2 flex items-start gap-2">
                  <span className="mt-2 flex-shrink-0 text-gray-400">•</span>
                  <Textarea
                    rows={2}
                    value={b}
                    onChange={e => updBullet(entry.id, i, e.target.value)}
                    placeholder="Led a team of 5 engineers to deliver…"
                  />
                  <button
                    type="button"
                    onClick={() => delBullet(entry.id, i)}
                    className="mt-2 flex-shrink-0 text-gray-400 transition hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addBullet(entry.id)}
                className="mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-600 transition hover:text-teal-700">
                <Plus size={13} /> Add bullet
              </button>
            </Field>
          </EntryCard>
        );
      })}
      <button
        type="button"
        onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Experience
      </button>
    </div>
  );
}

/* ── EDUCATION ───────────────────────────────────────────────────────────── */
function EducationForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const [openId, setOpenId] = useState<string | null>(s.section_entries?.[0]?.id || null);
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { degree: "", school: "", location: "", startDate: "", endDate: "", gpa: "", notes: "" });
      update({ section_entries: [...entries, data.entry] });
      setOpenId(data.entry.id);
    } catch { toast.error("Failed to add entry"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  return (
    <div>
      {entries.map(entry => {
        const d = entry.data || {};
        const open = openId === entry.id;
        return (
          <EntryCard
            key={entry.id}
            title={d.degree || "New Degree"}
            subtitle={d.school}
            open={open}
            onToggle={() => setOpenId(open ? null : entry.id)}
            onDelete={() => delEntry(entry.id)}>
            <Field label="Degree"><Input value={d.degree || ""} onChange={e => updEntry(entry.id, { degree: e.target.value })} /></Field>
            <Field label="School / University"><Input value={d.school || ""} onChange={e => updEntry(entry.id, { school: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Year"><Input value={d.startDate || ""} placeholder="2020" onChange={e => updEntry(entry.id, { startDate: e.target.value })} /></Field>
              <Field label="End Year"><Input value={d.endDate || ""} placeholder="2024" onChange={e => updEntry(entry.id, { endDate: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="GPA"><Input value={d.gpa || ""} placeholder="3.8" onChange={e => updEntry(entry.id, { gpa: e.target.value })} /></Field>
              <Field label="Location"><Input value={d.location || ""} onChange={e => updEntry(entry.id, { location: e.target.value })} /></Field>
            </div>
            <Field label="Notes / Thesis / Minor">
              <Input value={d.notes || ""} placeholder="e.g. Minor in Computer Science" onChange={e => updEntry(entry.id, { notes: e.target.value })} />
            </Field>
          </EntryCard>
        );
      })}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Education
      </button>
    </div>
  );
}

/* ── SKILLS ──────────────────────────────────────────────────────────────── */
function SkillsForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const [newSkill, setNewSkill] = useState<Record<string, string>>({});
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { category: "New Category", skills: [] });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add category"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  const addSkill = (id: string) => {
    const val = (newSkill[id] || "").trim();
    if (!val) return;
    const entry = entries.find(e => e.id === id)!;
    updEntry(id, { skills: [...(entry.data.skills || []), val] });
    setNewSkill(p => ({ ...p, [id]: "" }));
  };

  const removeSkill = (id: string, idx: number) => {
    const entry = entries.find(e => e.id === id)!;
    updEntry(id, { skills: entry.data.skills.filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id} className="mb-3 rounded-xl border-2 border-gray-100 bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Input
              value={entry.data.category || ""}
              placeholder="e.g. Technical Skills"
              onChange={e => updEntry(entry.id, { category: e.target.value })}
            />
            <button type="button" onClick={() => delEntry(entry.id)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-red-100 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(entry.data.skills || []).map((sk: string, i: number) => (
              <span key={i} className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600">
                {sk}
                <button type="button" onClick={() => removeSkill(entry.id, i)} className="text-gray-400 transition hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill[entry.id] || ""}
              placeholder="Add skill…"
              onChange={e => setNewSkill(p => ({ ...p, [entry.id]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addSkill(entry.id)}
            />
            <button type="button" onClick={() => addSkill(entry.id)}
              className="flex-shrink-0 rounded-lg bg-teal-500 px-3 text-sm font-medium text-white transition hover:bg-teal-600">
              +
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Skill Category
      </button>
    </div>
  );
}

/* ── PROJECTS ────────────────────────────────────────────────────────────── */
function ProjectsForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const [openId, setOpenId] = useState<string | null>(s.section_entries?.[0]?.id || null);
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { name: "", role: "", url: "", startDate: "", endDate: "", current: false, description: "", bullets: [] });
      update({ section_entries: [...entries, data.entry] });
      setOpenId(data.entry.id);
    } catch { toast.error("Failed to add project"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  const updBullet = (entryId: string, idx: number, val: string) => {
    const entry = entries.find(e => e.id === entryId)!;
    const bullets = [...(entry.data.bullets || [])];
    bullets[idx] = val;
    updEntry(entryId, { bullets });
  };

  const addBullet = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId)!;
    updEntry(entryId, { bullets: [...(entry.data.bullets || []), ""] });
  };

  const delBullet = (entryId: string, idx: number) => {
    const entry = entries.find(e => e.id === entryId)!;
    updEntry(entryId, { bullets: (entry.data.bullets || []).filter((_: any, i: number) => i !== idx) });
  };

  return (
    <div>
      {entries.map(entry => {
        const d = entry.data || {};
        const open = openId === entry.id;
        return (
          <EntryCard
            key={entry.id}
            title={d.name || "New Project"}
            subtitle={d.url || d.role}
            open={open}
            onToggle={() => setOpenId(open ? null : entry.id)}
            onDelete={() => delEntry(entry.id)}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Project Name"><Input value={d.name || ""} onChange={e => updEntry(entry.id, { name: e.target.value })} /></Field>
              <Field label="Your Role"><Input value={d.role || ""} placeholder="Creator, Lead Engineer…" onChange={e => updEntry(entry.id, { role: e.target.value })} /></Field>
            </div>
            <Field label="URL / Link"><Input value={d.url || ""} placeholder="project.com" onChange={e => updEntry(entry.id, { url: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Start Date"><Input type="month" value={d.startDate || ""} onChange={e => updEntry(entry.id, { startDate: e.target.value })} /></Field>
              <Field label="End Date"><Input type="month" value={d.endDate || ""} disabled={d.current} onChange={e => updEntry(entry.id, { endDate: e.target.value })} /></Field>
            </div>
            <Toggle checked={!!d.current} onChange={() => updEntry(entry.id, { current: !d.current })} label="Ongoing project" />
            <Field label="Description">
              <Textarea rows={3} value={d.description || ""} placeholder="What did you build and what was the impact?" onChange={e => updEntry(entry.id, { description: e.target.value })} />
            </Field>
            <Field label="Bullet Points (optional)">
              {(d.bullets || []).map((b: string, i: number) => (
                <div key={i} className="mb-2 flex items-start gap-2">
                  <span className="mt-2 flex-shrink-0 text-gray-400">•</span>
                  <Textarea
                    rows={2}
                    value={b}
                    onChange={e => updBullet(entry.id, i, e.target.value)}
                    placeholder="Describe a key achievement or feature…"
                  />
                  <button type="button" onClick={() => delBullet(entry.id, i)}
                    className="mt-2 flex-shrink-0 text-gray-400 transition hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addBullet(entry.id)}
                className="mt-1 flex items-center gap-1.5 text-xs font-medium text-teal-600 transition hover:text-teal-700">
                <Plus size={13} /> Add bullet point
              </button>
            </Field>
          </EntryCard>
        );
      })}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Project
      </button>
    </div>
  );
}

/* ── CERTIFICATIONS ──────────────────────────────────────────────────────── */
function CertificationsForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { name: "", issuer: "", date: "", url: "" });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add certification"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id} className="mb-2 rounded-xl border-2 border-gray-100 bg-gray-50 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Field label="Certification Name">
                <Input value={entry.data.name || ""} onChange={e => updEntry(entry.id, { name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Issuer">
                  <Input value={entry.data.issuer || ""} onChange={e => updEntry(entry.id, { issuer: e.target.value })} />
                </Field>
                <Field label="Year">
                  <Input value={entry.data.date || ""} placeholder="2024" onChange={e => updEntry(entry.id, { date: e.target.value })} />
                </Field>
              </div>
              <Field label="URL (optional)">
                <Input value={entry.data.url || ""} placeholder="credential link" onChange={e => updEntry(entry.id, { url: e.target.value })} />
              </Field>
            </div>
            <button type="button" onClick={() => delEntry(entry.id)}
              className="mt-6 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-red-100 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Certification
      </button>
    </div>
  );
}

/* ── ACHIEVEMENTS ────────────────────────────────────────────────────────── */
function AchievementsForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { text: "" });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add achievement"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  return (
    <div>
      <p className="mb-3 text-xs text-gray-400">List your key awards, publications, or notable accomplishments.</p>
      {entries.map((entry, i) => (
        <div key={entry.id} className="mb-2 flex items-start gap-2">
          <span className="mt-2 flex-shrink-0 text-gray-400">▸</span>
          <Textarea
            rows={2}
            value={entry.data.text || ""}
            placeholder="Won 1st place at HackMIT 2023…"
            onChange={e => updEntry(entry.id, { text: e.target.value })}
          />
          <button type="button" onClick={() => delEntry(entry.id)}
            className="mt-2 flex-shrink-0 text-gray-400 transition hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Achievement
      </button>
    </div>
  );
}

/* ── LANGUAGES ───────────────────────────────────────────────────────────── */
function LanguagesForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const entries = s.section_entries || [];

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { language: "", proficiency: "Professional" });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add language"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  const LEVELS = ["Native", "Fluent", "Professional", "Conversational", "Basic"];

  return (
    <div>
      {entries.map(entry => (
        <div key={entry.id} className="mb-2 grid grid-cols-2 gap-2 items-end">
          <Field label="Language">
            <Input value={entry.data.language || ""} placeholder="e.g. Spanish" onChange={e => updEntry(entry.id, { language: e.target.value })} />
          </Field>
          <Field label="Proficiency">
            <div className="flex gap-1">
              <select
                value={entry.data.proficiency || "Professional"}
                onChange={e => updEntry(entry.id, { proficiency: e.target.value })}
                className="flex-1 rounded-lg border-2 border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-900 outline-none focus:border-teal-400">
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <button type="button" onClick={() => delEntry(entry.id)}
                className="flex h-9 w-9 items-center justify-center rounded text-gray-400 transition hover:bg-red-100 hover:text-red-500">
                <Trash2 size={13} />
              </button>
            </div>
          </Field>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Language
      </button>
    </div>
  );
}

/* ── REFERENCES ──────────────────────────────────────────────────────────── */
function ReferencesForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const entries = s.section_entries || [];
  const hideDetails = s.data?.hide_details;

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { name: "", title: "", company: "", email: "", phone: "" });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add reference"); }
  };

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  return (
    <div>
      <Toggle
        checked={!!hideDetails}
        onChange={() => update({ data: { ...s.data, hide_details: !hideDetails } })}
        label="Show 'Available upon request' instead of details"
      />
      {!hideDetails && (
        <>
          {entries.map(entry => (
            <div key={entry.id} className="mb-3 rounded-xl border-2 border-gray-100 bg-gray-50 p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Field label="Name"><Input value={entry.data.name || ""} onChange={e => updEntry(entry.id, { name: e.target.value })} /></Field>
                  <Field label="Title"><Input value={entry.data.title || ""} onChange={e => updEntry(entry.id, { title: e.target.value })} /></Field>
                  <Field label="Company"><Input value={entry.data.company || ""} onChange={e => updEntry(entry.id, { company: e.target.value })} /></Field>
                  <Field label="Email"><Input type="email" value={entry.data.email || ""} onChange={e => updEntry(entry.id, { email: e.target.value })} /></Field>
                  <Field label="Phone"><Input value={entry.data.phone || ""} onChange={e => updEntry(entry.id, { phone: e.target.value })} /></Field>
                </div>
                <button type="button" onClick={() => delEntry(entry.id)}
                  className="mt-6 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-red-100 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addEntry}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
            <Plus size={15} /> Add Reference
          </button>
        </>
      )}
    </div>
  );
}

/* ── CUSTOM SECTION ──────────────────────────────────────────────────────── */
function CustomForm({ s, update, resumeId }: { s: ResumeSection; update: UpdateFn; resumeId: string }) {
  const entries = s.section_entries || [];

  const addEntry = async () => {
    try {
      const { data } = await sectionApi.createEntry(resumeId, s.id, { text: "" });
      update({ section_entries: [...entries, data.entry] });
    } catch { toast.error("Failed to add item"); }
  };

  const updEntry = (id: string, patch: any) =>
    update({ section_entries: entries.map(e => e.id === id ? { ...e, data: { ...e.data, ...patch } } : e) });

  const delEntry = async (id: string) => {
    update({ section_entries: entries.filter(e => e.id !== id) });
    try { await sectionApi.deleteEntry(resumeId, s.id, id); } catch {}
  };

  return (
    <div>
      <Field label="Section Text (optional intro)">
        <Textarea
          rows={3}
          value={s.data?.text || ""}
          placeholder="Optional overview text…"
          onChange={e => update({ data: { ...s.data, text: e.target.value } })}
        />
      </Field>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Items</div>
      {entries.map(entry => (
        <div key={entry.id} className="mb-2 flex items-start gap-2">
          <Textarea
            rows={2}
            value={entry.data.text || ""}
            placeholder="Item text…"
            onChange={e => updEntry(entry.id, { text: e.target.value })}
          />
          <button type="button" onClick={() => delEntry(entry.id)}
            className="mt-2 flex-shrink-0 text-gray-400 transition hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-400 transition hover:border-teal-400 hover:text-teal-600">
        <Plus size={15} /> Add Item
      </button>
    </div>
  );
}

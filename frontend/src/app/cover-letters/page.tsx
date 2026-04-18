"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, Sparkles, Download } from "lucide-react";
import toast from "react-hot-toast";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";
import { coverLetterApi, aiApi } from "@/lib/api";
import type { CoverLetter } from "@/types";

export default function CoverLettersPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<CoverLetter | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [form, setForm] = useState({
    title: "", job_title: "", company: "", content: "",
  });

  // Load cover letters
  const { data: letters = [], isLoading } = useQuery({
    queryKey: ["cover-letters"],
    queryFn: async () => {
      const { data } = await coverLetterApi.list();
      return data.cover_letters as CoverLetter[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: object) => coverLetterApi.create(d),
    onSuccess: ({ data }) => {
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
      setSelected(data.cover_letter);
      setIsNew(false);
      toast.success("Cover letter created!");
    },
    onError: () => toast.error("Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => coverLetterApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.success("Saved!");
    },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coverLetterApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cover-letters"] });
      setSelected(null);
      toast.success("Deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const startNew = () => {
    setForm({ title: "Cover Letter", job_title: "", company: "", content: "" });
    setSelected(null);
    setIsNew(true);
  };

  const openLetter = (cl: CoverLetter) => {
    setSelected(cl);
    setIsNew(false);
    setForm({
      title: cl.title, job_title: cl.job_title || "",
      company: cl.company || "", content: cl.content || "",
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (isNew) {
      createMutation.mutate(form);
    } else if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cover letter?")) return;
    deleteMutation.mutate(id);
  };

  const generateWithAI = async () => {
    if (!form.job_title || !form.company) {
      toast.error("Enter Job Title and Company first");
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await aiApi.generateCoverLetter({
        job_title: form.job_title,
        company: form.company,
        applicant_name: profile?.full_name || "",
        key_skills: [],
      });
      setForm(p => ({ ...p, content: data.cover_letter }));
      toast.success("Cover letter generated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "AI generation failed — check ANTHROPIC_API_KEY");
    } finally {
      setAiLoading(false);
    }
  };

  const exportPDF = () => {
    if (!form.content) { toast.error("No content to export"); return; }
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${form.title}</title>
<style>
  body { font-family: Georgia, serif; font-size: 11pt; line-height: 1.7; color: #1a1a1a;
    padding: 48px; max-width: 750px; margin: 0 auto; }
  h1 { font-size: 18pt; margin-bottom: 4px; }
  .meta { color: #555; font-size: 10pt; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
  p { margin-bottom: 14px; }
  @media print { .no-print { display: none; } }
</style></head>
<body>
  <div class="no-print" style="background:#f0fdf4;border:1px solid #86efac;padding:10px 16px;margin-bottom:20px;border-radius:6px;font-family:sans-serif;font-size:12px;color:#166534">
    ✅ Press Ctrl+P → Save as PDF
  </div>
  <h1>${form.title}</h1>
  <div class="meta">${form.job_title}${form.company ? ` at ${form.company}` : ""}</div>
  ${form.content.split("\n\n").map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup blocked — please allow popups"); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
    toast.success("Print dialog opened — Save as PDF");
  };

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const inputCls = "w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">Cover Letters</h1>
            <p className="mt-1 text-sm text-gray-400">Write and manage your cover letters</p>
          </div>
          <button
            onClick={startNew}
            className="flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600">
            <Plus size={16} /> New Cover Letter
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left: List */}
          <div className="col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3">
                <span className="text-sm font-semibold text-gray-700">
                  Your Letters ({letters.length})
                </span>
              </div>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                  Loading…
                </div>
              ) : letters.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400">
                  <FileText size={24} className="opacity-40" />
                  <p className="text-sm">No cover letters yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {letters.map(cl => (
                    <div
                      key={cl.id}
                      onClick={() => openLetter(cl)}
                      className={`flex cursor-pointer items-start justify-between px-4 py-3 transition ${
                        selected?.id === cl.id ? "bg-teal-50" : "hover:bg-gray-50"
                      }`}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800">{cl.title}</p>
                        <p className="text-xs text-gray-400">
                          {cl.company ? `${cl.company} · ` : ""}{new Date(cl.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(cl.id); }}
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor */}
          <div className="col-span-2">
            {isNew || selected ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                {/* Meta fields */}
                <div className="mb-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Title</label>
                    <input value={form.title} onChange={setF("title")} placeholder="Cover Letter – Stripe" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Job Title</label>
                    <input value={form.job_title} onChange={setF("job_title")} placeholder="Senior Engineer" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Company</label>
                    <input value={form.company} onChange={setF("company")} placeholder="Stripe, Inc." className={inputCls} />
                  </div>
                </div>

                {/* AI Generate */}
                <button
                  onClick={generateWithAI}
                  disabled={aiLoading}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100 disabled:opacity-60">
                  {aiLoading
                    ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" /> Generating with Claude…</>
                    : <><Sparkles size={15} /> Generate with AI</>}
                </button>

                {/* Content */}
                <div className="mb-5">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Cover Letter Content
                  </label>
                  <textarea
                    value={form.content}
                    onChange={setF("content")}
                    rows={16}
                    placeholder="Write your cover letter here, or click 'Generate with AI' above…"
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                  <p className="mt-1 text-[11px] text-gray-400">{form.content.length} characters</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60">
                    {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-teal-400 hover:text-teal-600">
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                <FileText size={32} className="opacity-30" />
                <p className="text-sm">Select a cover letter or create a new one</p>
                <button onClick={startNew} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition">
                  New Cover Letter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Copy, Trash2, Clock, FileText, BarChart2,
  Link2, Search, Edit2, Check, X
} from "lucide-react";
import toast from "react-hot-toast";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";
import { useResumes, useCreateResume, useDeleteResume, useDuplicateResume } from "@/hooks/useResume";
import { resumeApi } from "@/lib/api";
import type { Resume } from "@/types";

const TEMPLATE_COLORS: Record<string, string> = {
  classic: "#57CDA4", modern: "#A396E2", executive: "#F28B82",
  technical: "#7BAFD4", creative: "#F6B26B", minimal: "#9CA3AF",
};

export default function DashboardPage() {
  const { profile, isPro } = useAuth();
  const { data: resumes = [], isLoading, refetch } = useResumes();
  const createResume = useCreateResume();
  const deleteResume = useDeleteResume();
  const duplicateResume = useDuplicateResume();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "title">("updated");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // FIX: correct response path — API returns { resume: {...} } directly
  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await createResume.mutateAsync({ title: "My Resume" });
      // Handle both possible response shapes
      const resumeData = response?.data?.resume || response?.data?.data?.resume;
      if (!resumeData?.id) throw new Error("No resume ID in response");
      router.push(`/builder/${resumeData.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create resume");
    } finally {
      setCreating(false);
    }
  };

  const startRename = (resume: Resume) => {
    setEditingId(resume.id);
    setEditTitle(resume.title);
  };

  const saveRename = async (id: string) => {
    const title = editTitle.trim();
    if (!title) { toast.error("Title cannot be empty"); return; }
    try {
      await resumeApi.update(id, { title });
      await refetch();
      toast.success("Renamed!");
    } catch {
      toast.error("Failed to rename");
    } finally {
      setEditingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...resumes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.template_slug.includes(q));
    }
    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [resumes, search, sortBy]);

  const fmtDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const stats = [
    { label: "Total Resumes", value: resumes.length, icon: FileText, color: "text-teal-500", bg: "bg-teal-50" },
    {
      label: "Avg ATS Score",
      value: resumes.length
        ? Math.round(resumes.filter(r => r.ats_score > 0).reduce((a, r) => a + r.ats_score, 0) / (resumes.filter(r => r.ats_score > 0).length || 1))
        : 0,
      icon: BarChart2, color: "text-purple-500", bg: "bg-purple-100"
    },
    { label: "Plan", value: isPro ? "Pro" : "Free", icon: Link2, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              {greeting()}, {profile?.full_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-400">Manage and export your professional resumes</p>
          </div>
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-60 sm:self-start">
            <Plus size={16} /> {creating ? "Creating…" : "New Resume"}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Sort bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resumes…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-teal-400"
            />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400">
            <option value="updated">Last Modified</option>
            <option value="created">Date Created</option>
            <option value="title">Title (A–Z)</option>
          </select>
          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} of {resumes.length} resume{resumes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center gap-2 text-sm text-gray-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
            Loading resumes…
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Create card */}
            <button onClick={handleCreate}
              className="flex h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-500">
              <Plus size={24} />
              <span className="text-sm font-medium">Create New Resume</span>
            </button>

            {filtered.map((resume) => {
              const color = TEMPLATE_COLORS[resume.template_slug] || "#57CDA4";
              const score = resume.ats_score || 0;
              const isEditing = editingId === resume.id;
              return (
                <div key={resume.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,.10)]">
                  {/* Thumbnail */}
                  <div
                    className="h-[130px] cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 p-4"
                    onClick={() => !isEditing && router.push(`/builder/${resume.id}`)}>
                    <div className="mx-auto w-3/5">
                      <div className="mb-2 h-[7px] rounded-md" style={{ background: color, width: "55%" }} />
                      <div className="mb-1.5 h-[2px] rounded bg-gray-200" />
                      <div className="mb-1.5 h-[2px] w-4/5 rounded bg-gray-200" />
                      <div className="mb-3 h-[2px] w-2/3 rounded bg-gray-200" />
                      <div className="mb-2 h-[3px] rounded" style={{ background: color, opacity: 0.5, width: "45%" }} />
                      <div className="mb-1 h-[2px] rounded bg-gray-100" />
                      <div className="h-[2px] w-3/4 rounded bg-gray-100" />
                    </div>
                    {score > 0 && (
                      <div className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        score >= 85 ? "bg-teal-100 text-teal-700" : "bg-yellow-100 text-yellow-700"
                      }`}>{score}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    {isEditing ? (
                      <div className="mb-1 flex items-center gap-1">
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveRename(resume.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="flex-1 rounded border border-teal-400 px-2 py-0.5 text-sm text-gray-900 outline-none"
                        />
                        <button onClick={() => saveRename(resume.id)} className="text-teal-500 hover:text-teal-700"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="mb-0.5 flex items-center gap-1">
                        <span className="flex-1 truncate text-sm font-semibold text-gray-900">{resume.title}</span>
                        <button
                          onClick={e => { e.stopPropagation(); startRename(resume); }}
                          className="opacity-0 transition group-hover:opacity-100 text-gray-400 hover:text-gray-700"
                          title="Rename">
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="capitalize">{resume.template_slug}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {fmtDate(resume.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-x-0 bottom-0 flex border-t border-gray-100 bg-white opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      className="flex flex-1 items-center justify-center gap-1 py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => router.push(`/builder/${resume.id}`)}>
                      <FileText size={12} /> Edit
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1 py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => duplicateResume.mutate(resume.id)}>
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-1 py-2 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`Delete "${resume.title}"? This cannot be undone.`))
                          deleteResume.mutate(resume.id);
                      }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty search state */}
            {!isLoading && filtered.length === 0 && resumes.length > 0 && (
              <div className="col-span-2 md:col-span-4 flex flex-col items-center justify-center py-16 text-gray-400">
                <Search size={32} className="mb-3 opacity-40" />
                <p className="text-sm">No resumes match &ldquo;{search}&rdquo;</p>
                <button onClick={() => setSearch("")} className="mt-2 text-xs text-teal-500 hover:underline">
                  Clear search
                </button>
              </div>
            )}

            {/* First-time empty state */}
            {!isLoading && resumes.length === 0 && (
              <div className="col-span-2 md:col-span-4 flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText size={40} className="mb-4 opacity-30" />
                <p className="mb-2 text-base font-medium text-gray-600">No resumes yet</p>
                <p className="mb-5 text-sm">Create your first resume to get started</p>
                <button onClick={handleCreate}
                  className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition">
                  Create My First Resume
                </button>
              </div>
            )}
          </div>
        )}

        {!isPro && (
          <div className="mt-10 flex items-center justify-between rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
            <div>
              <div className="mb-1 text-base font-semibold">Upgrade to Pro</div>
              <div className="text-sm text-teal-100">Unlock AI writing assistant, unlimited resumes, DOCX export, and no watermarks.</div>
            </div>
            <Link href="/pricing" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50">
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

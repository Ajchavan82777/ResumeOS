"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Menu, Layout, Settings, Target, Percent, Sparkles,
  Undo2, Redo2, ChevronLeft, Save, Download, FileText,
  Image, MoveVertical, Eye, EyeOff,
} from "lucide-react";
import { useBuilderStore } from "@/store";
import { resumeApi, sectionApi } from "@/lib/api";
import { EditorPanel } from "./EditorPanel";
import { PreviewPanel } from "./PreviewPanel";
import { calcAtsScore } from "@/lib/atsScore";
import { buildDocx } from "@/lib/exportDocx";
import { saveAs } from "file-saver";
import { RearrangeModal } from "./RearrangeModal";

const TOOL_ITEMS = [
  { id: "sections"   as const, label: "Sections",      Icon: Menu      },
  { id: "templates"  as const, label: "Templates",     Icon: Layout    },
  { id: "design"     as const, label: "Design",        Icon: Settings  },
  { id: "score"      as const, label: "ATS Score",     Icon: Target    },
  { id: "jd"         as const, label: "Job Match",     Icon: Percent   },
  { id: "ai"         as const, label: "AI Assistant",  Icon: Sparkles  },
];

interface BuilderShellProps { resumeId: string; }

export function BuilderShell({ resumeId }: BuilderShellProps) {
  const router = useRouter();
  const {
    resume, sections, activePanel, isDirty, isSaving,
    setActivePanel, undo, redo, pushHistory, setSaving, setDirty,
  } = useBuilderStore();

  const [showRearrange, setShowRearrange] = useState(false);
  const [showPreview,   setShowPreview]   = useState(true);   // mobile toggle

  const score = calcAtsScore(sections);

  // ── MANUAL SAVE ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (isSaving) return;
    setSaving(true);
    const toastId = toast.loading("Saving…");
    try {
      if (resume?.resume_customizations) {
        await resumeApi.updateCustomization(resumeId, resume.resume_customizations);
      }
      if (resume?.template_slug) {
        await resumeApi.update(resumeId, { template_slug: resume.template_slug });
      }
      await Promise.all(
        sections.map(async (sec, idx) => {
          await sectionApi.update(resumeId, sec.id, {
            title: sec.title, is_visible: sec.is_visible,
            sort_order: idx, data: sec.data,
          });
          if (sec.section_entries?.length) {
            await Promise.all(
              sec.section_entries.map((entry, eIdx) =>
                sectionApi.updateEntry(resumeId, sec.id, entry.id, {
                  data: entry.data, sort_order: eIdx,
                })
              )
            );
          }
        })
      );
      setDirty(false);
      toast.success("Saved!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // ── PDF EXPORT — multi-page, pixel-perfect ───────────────────────────────────
  const handleExportPDF = async () => {
    const toastId = toast.loading("Generating PDF…");
    try {
      const resumeEl = document.querySelector(".resume-capture-target") as HTMLElement;
      if (!resumeEl) throw new Error("Resume element not found");

      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const pageSize = resume?.resume_customizations?.page_size || "A4";
      const [pw, ph] = pageSize === "Letter" ? [816, 1056] : [794, 1123];

      const totalH = resumeEl.scrollHeight || ph;
      const numPages = Math.ceil(totalH / ph);

      // Capture full resume content at once
      const fullCanvas = await html2canvas(resumeEl, {
        scale: 2, useCORS: true, logging: false,
        backgroundColor: "#ffffff",
        width: pw, height: totalH,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [pw, ph], compress: true });

      for (let i = 0; i < numPages; i++) {
        if (i > 0) pdf.addPage([pw, ph]);

        // Create a canvas slice for this page
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = pw * 2;
        pageCanvas.height = ph * 2;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(
          fullCanvas,
          0, i * ph * 2,   // source offset (scale: 2)
          pw * 2, ph * 2,  // source size
          0, 0,
          pw * 2, ph * 2,
        );
        pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.97), "JPEG", 0, 0, pw, ph);
      }

      const filename = `${(resume?.title || "Resume").replace(/\s+/g, "_")}.pdf`;
      pdf.save(filename);
      toast.success(`PDF downloaded! (${numPages} page${numPages > 1 ? "s" : ""})`, { id: toastId });
    } catch (err) {
      console.error("PDF error:", err);
      toast.error("PDF export failed", { id: toastId });
    }
  };

  // ── JPG EXPORT ───────────────────────────────────────────────────────────────
  const handleExportJPG = async () => {
    const toastId = toast.loading("Generating JPG…");
    try {
      const resumeEl = document.querySelector(".resume-capture-target") as HTMLElement;
      if (!resumeEl) throw new Error("Resume element not found");

      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(resumeEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Failed to create image", { id: toastId }); return; }
        const filename = `${(resume?.title || "Resume").replace(/\s+/g, "_")}.jpg`;
        saveAs(blob, filename);
        toast.success("JPG downloaded!", { id: toastId });
      }, "image/jpeg", 0.95);
    } catch (err) {
      console.error("JPG error:", err);
      toast.error("JPG export failed", { id: toastId });
    }
  };

  // ── DOCX EXPORT ──────────────────────────────────────────────────────────────
  const handleExportDOCX = async () => {
    const toastId = toast.loading("Building DOCX…");
    try {
      const blob = await buildDocx(sections, resume?.resume_customizations, resume?.title || "Resume");
      const filename = `${(resume?.title || "Resume").replace(/\s+/g, "_")}.docx`;
      saveAs(blob, filename);
      toast.success("DOCX downloaded!", { id: toastId });
    } catch (err: any) {
      console.error("DOCX error:", err);
      toast.error("DOCX export failed", { id: toastId });
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* ── TOP BAR ── */}
      <div className="flex h-[54px] flex-shrink-0 items-center gap-1 border-b border-gray-200 bg-white px-2 sm:px-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="mx-1 h-5 w-px bg-gray-200 hidden sm:block" />
        <span className="max-w-[120px] sm:max-w-[200px] truncate text-sm font-semibold text-gray-800">
          {resume?.title || "Resume"}
        </span>

        {/* Undo/Redo — hidden on very small screens */}
        <button onClick={undo} title="Undo"
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
          <Undo2 size={15} />
        </button>
        <button onClick={redo} title="Redo"
          className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
          <Redo2 size={15} />
        </button>

        <button onClick={handleSave} disabled={isSaving || !isDirty}
          className="flex items-center gap-1 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition disabled:opacity-50">
          <Save size={14} />
          <span className="hidden sm:inline">{isSaving ? "Saving…" : isDirty ? "Save" : "Saved ✓"}</span>
        </button>

        {/* ATS badge */}
        <div className={`ml-1 flex items-center gap-1 rounded-full px-2 sm:px-3 py-1 text-xs font-bold ${
          score >= 85 ? "border border-teal-200 bg-teal-50 text-teal-700"
          : score >= 60 ? "border border-yellow-200 bg-yellow-50 text-yellow-700"
          : "border border-red-200 bg-red-50 text-red-700"
        }`}>
          <Target size={11} />
          <span className="hidden sm:inline">ATS </span>{score}
        </div>

        {/* Rearrange sections */}
        <button onClick={() => setShowRearrange(true)}
          title="Rearrange sections"
          className="hidden md:flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition">
          <MoveVertical size={14} />
          <span className="hidden lg:inline text-xs">Rearrange</span>
        </button>

        {/* Mobile: toggle preview/editor */}
        <button onClick={() => setShowPreview(p => !p)}
          className="md:hidden flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 ml-auto">
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="text-xs">{showPreview ? "Edit" : "Preview"}</span>
        </button>

        {/* Export buttons */}
        <div className="ml-auto md:ml-0 flex items-center gap-1 sm:gap-2">
          <button onClick={handleExportJPG}
            title="Download as JPG"
            className="hidden sm:flex items-center gap-1 rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition">
            <Image size={13} />
            <span className="hidden lg:inline">JPG</span>
          </button>
          <button onClick={handleExportDOCX}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-teal-400 hover:text-teal-600 transition">
            <FileText size={13} />
            <span className="hidden lg:inline">DOCX</span>
          </button>
          <button onClick={handleExportPDF}
            className="flex items-center gap-1.5 rounded-lg bg-teal-500 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-600 transition shadow-sm">
            <Download size={13} />
            <span className="hidden sm:inline">Export </span>PDF
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tool Rail */}
        <div className="flex w-[48px] sm:w-[52px] flex-shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-3">
          {TOOL_ITEMS.map(({ id, label, Icon }) => (
            <button key={id}
              onClick={() => setActivePanel(id)}
              title={label}
              className={`group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition ${
                activePanel === id ? "bg-teal-50 text-teal-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}>
              <Icon size={17} />
              {id === "score" && (
                <span className={`absolute right-1 top-1 h-2 w-2 rounded-full ${
                  score >= 85 ? "bg-teal-500" : score >= 60 ? "bg-yellow-400" : "bg-red-400"
                }`} />
              )}
              <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">
                {label}
              </span>
            </button>
          ))}
          <div className="my-2 h-px w-7 bg-gray-200" />
          {[{ Icon: Undo2, fn: undo, label: "Undo" }, { Icon: Redo2, fn: redo, label: "Redo" }].map(({ Icon, fn, label }) => (
            <button key={label} onClick={fn} title={label}
              className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
              <Icon size={15} />
              <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">{label}</span>
            </button>
          ))}
          {/* Rearrange button in rail (mobile) */}
          <button onClick={() => setShowRearrange(true)} title="Rearrange"
            className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
            <MoveVertical size={15} />
            <span className="pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50">Rearrange</span>
          </button>
        </div>

        {/* Editor panel — hidden on mobile when preview is shown */}
        <div className={`${showPreview ? "hidden md:flex" : "flex"} flex-col flex-shrink-0`}>
          <EditorPanel resumeId={resumeId} />
        </div>

        {/* Preview panel — hidden on mobile when editor is shown */}
        <div className={`${showPreview ? "flex" : "hidden md:flex"} flex-1 min-w-0`}>
          <PreviewPanel />
        </div>
      </div>

      {/* Rearrange Modal */}
      {showRearrange && (
        <RearrangeModal resumeId={resumeId} onClose={() => setShowRearrange(false)} />
      )}
    </div>
  );
}

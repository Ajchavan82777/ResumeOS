"use client";
import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { useBuilderStore } from "@/store";
import { sectionApi } from "@/lib/api";
import type { ResumeSection } from "@/types";

interface RearrangeModalProps {
  resumeId: string;
  onClose: () => void;
}

const MAIN_TYPES = ["summary", "experience", "education", "projects"];
const SIDE_TYPES = ["achievements", "skills", "certifications", "courses", "languages", "references"];

export function RearrangeModal({ resumeId, onClose }: RearrangeModalProps) {
  const { sections, resume, reorderSections, pushHistory } = useBuilderStore();
  const template = resume?.template_slug || "two-column-dark";

  const sorted = [...sections].sort((a, b) => a.sort_order - b.sort_order);
  const personal = sorted.find(s => s.section_type === "personal");
  const movable = sorted.filter(s => s.section_type !== "personal");

  const isTwoCol = ["two-column-dark", "sidebar-modern"].includes(template);
  const mainSecs = isTwoCol ? movable.filter(s => MAIN_TYPES.includes(s.section_type) || !SIDE_TYPES.includes(s.section_type)) : movable;
  const sideSecs = isTwoCol ? movable.filter(s => SIDE_TYPES.includes(s.section_type)) : [];

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reorderList = useCallback(async (reordered: ResumeSection[]) => {
    const full = personal
      ? [{ ...personal, sort_order: 0 }, ...reordered.map((s, i) => ({ ...s, sort_order: i + 1 }))]
      : reordered.map((s, i) => ({ ...s, sort_order: i }));
    reorderSections(full);
    pushHistory();
    try {
      await sectionApi.reorder(resumeId, full.map(s => ({ id: s.id, sort_order: s.sort_order })));
    } catch {}
  }, [personal, resumeId, reorderSections, pushHistory]);

  const onDrop = useCallback(async (targetId: string, col: "main" | "side") => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const list = col === "main" ? mainSecs : sideSecs;
    const fromIdx = list.findIndex(s => s.id === dragId);
    const toIdx = list.findIndex(s => s.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDragId(null); setDragOverId(null); return; }
    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const other = col === "main" ? sideSecs : mainSecs;
    const fullMovable = col === "main" ? [...reordered, ...other] : [...other, ...reordered];
    await reorderList(fullMovable);
    setDragId(null); setDragOverId(null);
  }, [dragId, mainSecs, sideSecs, reorderList]);

  const moveUp = useCallback(async (id: string, col: "main" | "side") => {
    const list = col === "main" ? mainSecs : sideSecs;
    const idx = list.findIndex(s => s.id === id);
    if (idx <= 0) return;
    const reordered = [...list];
    [reordered[idx], reordered[idx - 1]] = [reordered[idx - 1], reordered[idx]];
    const other = col === "main" ? sideSecs : mainSecs;
    await reorderList(col === "main" ? [...reordered, ...other] : [...other, ...reordered]);
  }, [mainSecs, sideSecs, reorderList]);

  const moveDown = useCallback(async (id: string, col: "main" | "side") => {
    const list = col === "main" ? mainSecs : sideSecs;
    const idx = list.findIndex(s => s.id === id);
    if (idx < 0 || idx >= list.length - 1) return;
    const reordered = [...list];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const other = col === "main" ? sideSecs : mainSecs;
    await reorderList(col === "main" ? [...reordered, ...other] : [...other, ...reordered]);
  }, [mainSecs, sideSecs, reorderList]);

  // Mini section box component (looks like Enhancv reference)
  const SectionBox = ({
    sec, col, idx, total,
  }: { sec: ResumeSection; col: "main" | "side"; idx: number; total: number }) => {
    const isDragging = dragId === sec.id;
    const isDragOver = dragOverId === sec.id;
    return (
      <div
        draggable
        onDragStart={() => setDragId(sec.id)}
        onDragOver={(e) => { e.preventDefault(); setDragOverId(sec.id); }}
        onDrop={() => onDrop(sec.id, col)}
        onDragEnd={() => { setDragId(null); setDragOverId(null); }}
        style={{
          background: isDragOver ? "#dbeafe" : isDragging ? "transparent" : "#eef2ff",
          border: isDragOver ? "2px dashed #3b82f6" : isDragging ? "2px dashed #94a3b8" : "2px solid transparent",
          borderRadius: 6,
          padding: "8px 10px",
          cursor: "grab",
          transition: "all 0.12s",
          opacity: isDragging ? 0.4 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
        }}
      >
        {/* Grip dots */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2.5, flexShrink: 0 }}>
          {[0, 1, 2].map(row => (
            <div key={row} style={{ display: "flex", gap: 2.5 }}>
              {[0, 1].map(dot => (
                <div key={dot} style={{ width: 3, height: 3, borderRadius: "50%", background: "#94a3b8" }} />
              ))}
            </div>
          ))}
        </div>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sec.title}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => moveUp(sec.id, col)} disabled={idx === 0}
            style={{ width: 18, height: 18, background: "none", border: "1px solid #d1d5db", borderRadius: 3, cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#d1d5db" : "#6b7280", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
          <button onClick={() => moveDown(sec.id, col)} disabled={idx === total - 1}
            style={{ width: 18, height: 18, background: "none", border: "1px solid #d1d5db", borderRadius: 3, cursor: idx === total - 1 ? "default" : "pointer", color: idx === total - 1 ? "#d1d5db" : "#6b7280", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative flex items-start justify-between px-8 pt-7 pb-4">
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold text-gray-900">Hold &amp; Drag the boxes to rearrange</h2>
            <p className="text-sm text-gray-400 mt-1">Changes save automatically</p>
          </div>
          <button onClick={onClose} className="absolute right-5 top-5 h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        {/* Mini A4 resume layout */}
        <div className="px-8 pb-6">
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 14,
            minHeight: 320,
          }}>
            {/* Locked header */}
            <div style={{
              background: "#dce8ff",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              padding: "10px 14px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{personal?.title || "Header"}</span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>locked</span>
            </div>

            {/* Sections area */}
            {isTwoCol ? (
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 10 }}>
                {/* Main column */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6366f1", marginBottom: 6 }}>Main Column</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {mainSecs.map((sec, i) => (
                      <SectionBox key={sec.id} sec={sec} col="main" idx={i} total={mainSecs.length} />
                    ))}
                    {mainSecs.length === 0 && <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", padding: "8px 0" }}>No sections</p>}
                  </div>
                </div>
                {/* Sidebar column */}
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#3b82f6", marginBottom: 6 }}>Sidebar</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sideSecs.map((sec, i) => (
                      <SectionBox key={sec.id} sec={sec} col="side" idx={i} total={sideSecs.length} />
                    ))}
                    {sideSecs.length === 0 && <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", padding: "8px 0" }}>No sections</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 6 }}>Sections</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {mainSecs.map((sec, i) => (
                    <SectionBox key={sec.id} sec={sec} col="main" idx={i} total={mainSecs.length} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition"
          >
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { useBuilderStore } from "@/store";
import { ResumeDocument } from "./ResumeDocument";
import { EditProvider } from "./EditContext";

// A4 at 96 DPI
const PAGE_W = 794;
const PAGE_H = 1123;

export function PreviewPanel() {
  const {
    resume, sections,
    updateSectionData, updateEntryData, updateSectionTitle,
  } = useBuilderStore();
  const [zoom, setZoom] = useState(72);
  const [innerH, setInnerH] = useState(PAGE_H);
  const innerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userZoomed = useRef(false);

  const template = resume?.template_slug || "two-column-dark";
  const theme = resume?.resume_customizations;

  const scale = zoom / 100;
  const scaledW = PAGE_W * scale;
  const scaledH = innerH * scale;
  const numPages = Math.ceil(innerH / PAGE_H);

  // Auto-fit zoom to container width; manual zoom buttons disable auto-fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (userZoomed.current) return;
      const w = el.clientWidth;
      const ideal = Math.floor((w - 48) / PAGE_W * 100);
      setZoom(Math.max(30, Math.min(150, ideal)));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Track actual resume content height via ResizeObserver
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const h = el.scrollHeight || el.offsetHeight;
      if (h > 0) setInnerH(Math.max(h, PAGE_H));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
      {/* Topbar */}
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 text-xs text-gray-400">
        <span className="font-semibold text-gray-600 hidden sm:inline">Live Preview</span>
        <span className="hidden sm:inline">·</span>
        <span className="capitalize hidden sm:inline">{template} Template</span>
        <span className="hidden sm:inline">·</span>
        <span>{theme?.page_size || "A4"}</span>
        {numPages > 1 && (
          <>
            <span className="hidden sm:inline">·</span>
            <span className="text-teal-600 font-medium">{numPages} pages</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { userZoomed.current = true; setZoom((z) => Math.max(30, z - 10)); }}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 transition"
          >
            <ZoomOut size={13} />
          </button>
          <span className="w-10 text-center font-mono text-xs">{zoom}%</span>
          <button
            onClick={() => { userZoomed.current = true; setZoom((z) => Math.min(150, z + 10)); }}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 transition"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable preview area */}
      <div ref={containerRef} className="no-print flex-1 overflow-auto bg-[#E8EAED]">
        <div
          style={{
            minHeight: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "32px 24px",
          }}
        >
          {/* Outer wrapper: sized to scaled content */}
          <div style={{ width: scaledW, height: scaledH, flexShrink: 0, position: "relative" }}>
            {/* Page break indicators */}
            {Array.from({ length: numPages - 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute", left: 0, right: 0,
                  top: PAGE_H * scale * (i + 1) - 4,
                  height: 8,
                  background: "#E8EAED",
                  zIndex: 30, pointerEvents: "none",
                }}
              />
            ))}

            {/* Inner: full-width A4, auto height, scaled from top-left */}
            <div
              ref={innerRef}
              style={{
                width: PAGE_W,
                minHeight: PAGE_H,
                position: "absolute",
                top: 0,
                left: 0,
                transformOrigin: "top left",
                transform: `scale(${scale})`,
              }}
              className="resume-page resume-capture-target bg-white shadow-[0_8px_40px_rgba(0,0,0,.22),0_2px_6px_rgba(0,0,0,.10)] rounded-sm"
            >
              <EditProvider
                onSectionData={updateSectionData}
                onEntryData={updateEntryData}
                onSectionTitle={updateSectionTitle}
              >
                <ResumeDocument
                  sections={sections}
                  theme={theme}
                  templateSlug={template}
                />
              </EditProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

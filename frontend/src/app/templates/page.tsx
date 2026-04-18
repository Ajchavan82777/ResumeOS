// src/app/templates/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { TemplateThumbnail } from "@/components/builder/TemplateThumbnail";

const TEMPLATES = [
  { slug: "two-column-dark",  name: "Two-Column Pro",    tag: "Popular", color: "#3B6FD4", desc: "Dark sidebar with main content — great for senior roles",  category: "Modern"   },
  { slug: "corporate",        name: "Corporate",         tag: "ATS",     color: "#2C4A7C", desc: "Centered classic style with full-width section dividers",  category: "ATS"      },
  { slug: "sidebar-modern",   name: "Sidebar Modern",    tag: "New",     color: "#3B82F6", desc: "Light sidebar with skill chips and achievements panel",    category: "Modern"   },
];

const FILTERS = ["All", "ATS", "Modern"];

const filterMap: Record<string, string[]> = {
  "All":    TEMPLATES.map(t => t.slug),
  "ATS":    TEMPLATES.filter(t => t.category === "ATS").map(t => t.slug),
  "Modern": TEMPLATES.filter(t => t.category === "Modern").map(t => t.slug),
};

export default function TemplatesPage() {
  const [filter, setFilter] = useState("All");
  const visible = TEMPLATES.filter(t => filterMap[filter]?.includes(t.slug));

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 font-serif text-3xl font-bold text-gray-900">Resume Templates</h1>
        <p className="mb-8 text-sm text-gray-400">Professional, ATS-friendly designs for every career stage. Free and premium options available.</p>

        {/* Filter bar */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-medium transition ${filter === f ? "border-teal-500 bg-teal-500 text-white" : "border-gray-200 text-gray-500 hover:border-teal-400 hover:text-teal-600"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-3 gap-6">
          {visible.map((t) => (
            <div key={t.slug} className="group overflow-hidden rounded-2xl border-2 border-gray-100 transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl">
              {/* Thumbnail - shows actual template structure */}
              <div className="relative bg-white" style={{ height: 220, padding: 8, overflow: "hidden" }}>
                <div className="h-full w-full overflow-hidden rounded border border-gray-100 shadow-sm">
                  <TemplateThumbnail slug={t.slug} color={t.color} />
                </div>
                {/* Tag badge */}
                <span
                  className="absolute right-4 top-4 rounded px-2 py-0.5 text-[9px] font-bold text-white shadow"
                  style={{ background: t.slug === "two-column-dark" || t.slug === "corporate" || t.slug === "sidebar-modern" ? "#10B981" : t.color }}>
                  {t.tag}
                </span>
              </div>

              {/* Card footer */}
              <div className="border-t border-gray-100 bg-white px-4 py-3">
                <div className="mb-0.5 font-semibold text-gray-900">{t.name}</div>
                <div className="mb-3 text-xs text-gray-400">{t.desc}</div>
                <Link
                  href={`/builder/new?template=${t.slug}`}
                  className="block w-full rounded-lg bg-teal-500 py-2 text-center text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 hover:bg-teal-600">
                  Use Template →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

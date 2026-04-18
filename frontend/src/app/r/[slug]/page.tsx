"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { sharedApi } from "@/lib/api";
import { ResumeDocument } from "@/components/builder/ResumeDocument";
import type { Resume, ResumeSection } from "@/types";

export default function SharedResumePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [resume, setResume]   = useState<Resume | null>(null);
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    sharedApi.view(slug)
      .then(({ data }) => {
        const r: Resume = data.resume;
        const secs: ResumeSection[] = (r.resume_sections || [])
          .filter((s: ResumeSection) => s.is_visible)
          .sort((a: ResumeSection, b: ResumeSection) => a.sort_order - b.sort_order)
          .map((s: ResumeSection) => ({
            ...s,
            section_entries: (s.section_entries || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          }));
        setResume(r);
        setSections(secs);
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 404) setError("This resume link doesn't exist or has been deactivated.");
        else if (status === 410) setError("This shared link has expired.");
        else setError("Unable to load this resume. It may be private or no longer available.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
          <p className="text-sm text-gray-400">Loading resume…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <h1 className="mb-2 font-serif text-xl font-bold text-gray-900">Resume Unavailable</h1>
          <p className="mb-6 text-sm text-gray-500">{error}</p>
          <a href="/" className="rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600">
            Build Your Own Resume
          </a>
        </div>
      </div>
    );
  }

  const theme = resume?.resume_customizations;
  const personal = sections.find(s => s.section_type === "personal");
  const pd = personal?.data || {};

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-serif text-base font-bold text-gray-900">{pd.name || "Resume"}</h1>
            <p className="text-xs text-gray-400">{pd.job_title}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-teal-400 hover:text-teal-600">
              🖨 Print
            </button>
            <a href="/" className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
              Build Your Resume →
            </a>
          </div>
        </div>
      </div>

      {/* Resume */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="bg-white shadow-[0_4px_32px_rgba(0,0,0,.14)] rounded-sm overflow-hidden print:shadow-none">
          <ResumeDocument sections={sections} theme={theme} />
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center text-xs text-gray-400">
        Created with{" "}
        <a href="/" className="text-teal-500 hover:underline">ResumeOS</a>
        {" "}· Build your own ATS-optimized resume for free
      </div>
    </div>
  );
}

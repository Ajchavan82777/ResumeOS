"use client";
import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resumeApi, sectionApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ResumeStartModal, type ParsedResume } from "@/components/builder/ResumeStartModal";
import { PLACEHOLDER_SECTIONS } from "@/lib/sampleData";

// ─── Create sections + entries for a resume ───────────────────────────────────

async function populateSections(
  resumeId: string,
  sections: typeof PLACEHOLDER_SECTIONS
): Promise<void> {
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    let sectionId: string | undefined;

    try {
      const res = await sectionApi.create(resumeId, {
        section_type: sec.section_type,
        title: sec.title,
        sort_order: sec.sort_order,
        data: sec.data ?? {},
      });
      sectionId = res.data?.section?.id;
    } catch {
      continue; // skip this section if creation fails
    }

    if (!sectionId || !sec.entries?.length) continue;

    // Create each entry sequentially to avoid rate-limit issues
    for (let j = 0; j < sec.entries.length; j++) {
      try {
        await sectionApi.createEntry(resumeId, sectionId, sec.entries[j]);
      } catch {
        // skip failed entry, continue with next
      }
    }
  }
}

// ─── Map parsed resume data → sections format ─────────────────────────────────

function parsedToSections(parsed: ParsedResume & { projects?: any[] }): typeof PLACEHOLDER_SECTIONS {
  const out: any[] = [];
  let order = 0;

  if (parsed.personal && Object.keys(parsed.personal).length) {
    out.push({ section_type: "personal", title: "Personal Details", sort_order: order++, data: parsed.personal });
  }
  if (parsed.summary) {
    out.push({ section_type: "summary", title: "Summary", sort_order: order++, data: { text: parsed.summary } });
  }
  if (parsed.experience?.length) {
    out.push({ section_type: "experience", title: "Experience", sort_order: order++, data: {}, entries: parsed.experience });
  }
  if (parsed.education?.length) {
    out.push({ section_type: "education", title: "Education", sort_order: order++, data: {}, entries: parsed.education });
  }
  if (parsed.skills?.length) {
    out.push({ section_type: "skills", title: "Skills", sort_order: order++, data: {}, entries: parsed.skills });
  }
  if (parsed.projects?.length) {
    out.push({ section_type: "projects", title: "Projects", sort_order: order++, data: {}, entries: parsed.projects });
  }
  if (parsed.certifications?.length) {
    out.push({ section_type: "certifications", title: "Certifications", sort_order: order++, data: {}, entries: parsed.certifications });
  }
  if (parsed.languages?.length) {
    out.push({ section_type: "languages", title: "Languages", sort_order: order++, data: {}, entries: parsed.languages });
  }
  if (parsed.achievements?.length) {
    out.push({ section_type: "achievements", title: "Achievements", sort_order: order++, data: {}, entries: parsed.achievements });
  }
  return out;
}

// ─── Inner page component (needs Suspense for useSearchParams) ────────────────

function NewResumeInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template") || "two-column-dark";
  const [loading, setLoading] = useState(false);

  const createAndPopulate = useCallback(async (sectionsData: typeof PLACEHOLDER_SECTIONS) => {
    setLoading(true);
    const toastId = toast.loading("Creating your resume…");
    try {
      // Step 1: create the resume record
      const { data: createData } = await resumeApi.create({
        title: "My Resume",
        template_slug: templateSlug,
      });

      const resumeId = createData?.resume?.id;
      if (!resumeId) {
        throw new Error("Server did not return a resume ID");
      }

      // Step 2: populate sections
      toast.loading("Adding sections…", { id: toastId });
      await populateSections(resumeId, sectionsData);

      toast.success("Resume ready!", { id: toastId });
      router.replace(`/builder/${resumeId}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        "Failed to create resume";
      toast.error(msg, { id: toastId });
      console.error("createAndPopulate failed:", err?.response?.data ?? err);
      setLoading(false);
    }
  }, [templateSlug, router]);

  const handleStartFresh = useCallback(() => {
    createAndPopulate(PLACEHOLDER_SECTIONS);
  }, [createAndPopulate]);

  const handleParsed = useCallback((parsed: ParsedResume) => {
    const sections = parsedToSections(parsed as any);
    if (!sections.length) {
      // Nothing was parsed — fall back to placeholder content
      createAndPopulate(PLACEHOLDER_SECTIONS);
      return;
    }
    const count = sections.length;
    toast.success(`Extracted ${count} section${count !== 1 ? "s" : ""}. Filling template…`);
    createAndPopulate(sections as any);
  }, [createAndPopulate]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
          <p className="text-sm font-medium text-gray-600">Setting up your resume…</p>
          <p className="mt-1 text-xs text-gray-400">This may take a few seconds</p>
        </div>
      )}
      <ResumeStartModal
        templateSlug={templateSlug}
        onStartFresh={handleStartFresh}
        onParsed={handleParsed}
        loading={loading}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewResumePage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
      </div>
    }>
      <NewResumeInner />
    </Suspense>
  );
}

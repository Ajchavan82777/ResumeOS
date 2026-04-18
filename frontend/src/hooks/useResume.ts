import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { resumeApi, sectionApi } from "@/lib/api";
import { useBuilderStore } from "@/store";
import type { Resume, ResumeSection } from "@/types";

// ── useResumes: dashboard list ────────────────────────────────────────────────
export function useResumes() {
  return useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await resumeApi.list();
      return data.resumes as Resume[];
    },
    staleTime: 30_000,
  });
}

// ── useResume: single resume + seed builder store ─────────────────────────────
export function useResume(id: string) {
  const { setResume, setSections, setAtsScore, pushHistory, reset } = useBuilderStore();

  return useQuery({
    queryKey: ["resume", id],
    queryFn: async () => {
      const { data } = await resumeApi.get(id);
      const resume: Resume = data.resume;

      // Sort sections by sort_order; attach section_entries onto each section
      const sections: ResumeSection[] = (resume.resume_sections || [])
        .sort((a: ResumeSection, b: ResumeSection) => a.sort_order - b.sort_order)
        .map((s: ResumeSection) => ({
          ...s,
          section_entries: (s.section_entries || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          ),
        }));

      setResume(resume);
      setSections(sections);
      setAtsScore(resume.ats_score || 0);
      pushHistory();
      return resume;
    },
    enabled: !!id,
    // Don't refetch on window focus — autosave handles persistence
    refetchOnWindowFocus: false,
  });
}

// ── useAutoSave: debounced 2s save of ALL dirty state ─────────────────────────
// FIX: now saves section_entries too, not just section metadata
export function useAutoSave(resumeId: string) {
  const { sections, resume, isDirty, setSaving, setDirty } = useBuilderStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false); // prevent concurrent saves
  const qc = useQueryClient();

  const save = useCallback(async () => {
    if (!isDirty || !resumeId || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      // 1. Save customization
      if (resume?.resume_customizations) {
        await resumeApi.updateCustomization(resumeId, resume.resume_customizations).catch(() => null);
      }

      // 2. Save template_slug if it changed
      if (resume?.template_slug) {
        await resumeApi.update(resumeId, { template_slug: resume.template_slug }).catch(() => null);
      }

      // 3. Save each section: metadata + data + entries
      await Promise.all(
        sections.map(async (sec, idx) => {
          // Update section metadata and data field
          await sectionApi.update(resumeId, sec.id, {
            title: sec.title,
            is_visible: sec.is_visible,
            is_locked: sec.is_locked,
            sort_order: idx,
            data: sec.data,
          }).catch(() => null);

          // Update each entry's data
          if (sec.section_entries?.length) {
            await Promise.all(
              sec.section_entries.map((entry, eIdx) =>
                sectionApi.updateEntry(resumeId, sec.id, entry.id, {
                  data: entry.data,
                  sort_order: eIdx,
                }).catch(() => null)
              )
            );
          }
        })
      );

      setDirty(false);
      // Invalidate but don't refetch immediately to avoid UI reset
      qc.invalidateQueries({ queryKey: ["resumes"] });
    } catch {
      toast.error("Auto-save failed. Check your connection.");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [sections, resume, isDirty, resumeId]);

  useEffect(() => {
    if (!isDirty) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isDirty, save]);

  // Expose manual save
  return { save };
}

// ── usePersistReorder: called immediately after drag-drop ─────────────────────
// FIX: drag-drop order was never persisted to backend
export function usePersistReorder() {
  const { sections } = useBuilderStore();

  const persistOrder = useCallback(async (resumeId: string, reorderedSections: ResumeSection[]) => {
    try {
      const order = reorderedSections.map((sec, idx) => ({ id: sec.id, sort_order: idx }));
      await sectionApi.reorder(resumeId, order);
    } catch {
      // Non-critical — autosave will retry
      console.warn("Reorder persist failed, autosave will retry");
    }
  }, []);

  return { persistOrder };
}

// ── useCreateResume ───────────────────────────────────────────────────────────
export function useCreateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; template_slug?: string }) => resumeApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resumes"] }),
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to create resume");
    },
  });
}

// ── useDeleteResume ───────────────────────────────────────────────────────────
export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume deleted");
    },
    onError: () => toast.error("Failed to delete resume"),
  });
}

// ── useDuplicateResume ────────────────────────────────────────────────────────
export function useDuplicateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumeApi.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume duplicated!");
    },
    onError: () => toast.error("Failed to duplicate resume"),
  });
}

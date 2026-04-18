import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Profile, Subscription, Resume, ResumeSection, ResumeTheme } from "@/types";
import { sectionApi } from "@/lib/api";

const _debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

// ── Auth Store ────────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, profile: Profile, subscription: Subscription, token: string) => void;
  updateProfile: (profile: Partial<Profile>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, profile: null, subscription: null,
      accessToken: null, isAuthenticated: false,
      setAuth: (user, profile, subscription, accessToken) =>
        set({ user, profile, subscription, accessToken, isAuthenticated: true }),
      updateProfile: (data) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, ...data } : null })),
      clearAuth: () =>
        set({ user: null, profile: null, subscription: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: "resumeos-auth", partialize: (s) => ({ accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }) }
  )
);

// ── Resume Builder Store ──────────────────────────────────────────────────────
interface BuilderState {
  resume: Resume | null;
  sections: ResumeSection[];
  activeSectionId: string | null;
  activePanel: "sections" | "templates" | "design" | "score" | "jd" | "ai";
  isDirty: boolean;
  isSaving: boolean;
  atsScore: number;
  history: ResumeSection[][];
  historyIndex: number;

  setResume: (resume: Resume) => void;
  setSections: (sections: ResumeSection[]) => void;
  updateSection: (id: string, data: Partial<ResumeSection>) => void;
  addSection: (section: ResumeSection) => void;
  removeSection: (id: string) => void;
  reorderSections: (sections: ResumeSection[]) => void;
  updateSectionData: (sectionId: string, data: Record<string, any>) => void;
  updateEntryData: (sectionId: string, entryId: string, data: Record<string, any>) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  moveSectionUp: (sectionId: string) => void;
  moveSectionDown: (sectionId: string) => void;
  setActiveSectionId: (id: string | null) => void;
  setActivePanel: (panel: BuilderState["activePanel"]) => void;
  setTheme: (theme: Partial<ResumeTheme>) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setAtsScore: (score: number) => void;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>()((set, get) => ({
  resume: null, sections: [], activeSectionId: null,
  activePanel: "sections", isDirty: false, isSaving: false,
  atsScore: 0, history: [], historyIndex: -1,

  setResume: (resume) => set({ resume, isDirty: false }),
  setSections: (sections) => set({ sections }),

  updateSection: (id, data) =>
    set((s) => ({
      sections: s.sections.map((sec) => sec.id === id ? { ...sec, ...data } : sec),
      isDirty: true,
    })),

  addSection: (section) =>
    set((s) => ({ sections: [...s.sections, section], isDirty: true })),

  removeSection: (id) =>
    set((s) => ({
      sections: s.sections.filter((sec) => sec.id !== id),
      activeSectionId: s.activeSectionId === id ? null : s.activeSectionId,
      isDirty: true,
    })),

  reorderSections: (sections) => set({ sections, isDirty: true }),

  updateSectionData: (sectionId, data) => {
    set((s) => ({
      sections: s.sections.map(sec => sec.id === sectionId ? { ...sec, data } : sec),
      isDirty: true,
    }));
    const resumeId = get().resume?.id;
    if (!resumeId) return;
    const key = `sec-${sectionId}`;
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      try { await sectionApi.update(resumeId, sectionId, { data }); }
      catch (e) { console.warn("[store] section save failed:", e); }
    }, 800);
  },

  updateEntryData: (sectionId, entryId, data) => {
    set((s) => ({
      sections: s.sections.map(sec =>
        sec.id !== sectionId ? sec : {
          ...sec,
          section_entries: (sec.section_entries || []).map(e =>
            e.id === entryId ? { ...e, data } : e
          ),
        }
      ),
      isDirty: true,
    }));
    const resumeId = get().resume?.id;
    if (!resumeId) return;
    const key = `entry-${entryId}`;
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      try { await sectionApi.updateEntry(resumeId, sectionId, entryId, { data }); }
      catch (e) { console.warn("[store] entry save failed:", e); }
    }, 800);
  },

  updateSectionTitle: (sectionId, title) => {
    set((s) => ({
      sections: s.sections.map(sec => sec.id === sectionId ? { ...sec, title } : sec),
      isDirty: true,
    }));
    const resumeId = get().resume?.id;
    if (!resumeId) return;
    const key = `title-${sectionId}`;
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      try { await sectionApi.update(resumeId, sectionId, { title }); }
      catch (e) { console.warn("[store] title save failed:", e); }
    }, 800);
  },

  moveSectionUp: (sectionId) => {
    const s = get();
    const sorted = [...s.sections].sort((a, b) => a.sort_order - b.sort_order);
    const movable = sorted.filter(sec => sec.section_type !== "personal");
    const idx = movable.findIndex(sec => sec.id === sectionId);
    if (idx <= 0) return;
    const reordered = [...movable];
    [reordered[idx], reordered[idx - 1]] = [reordered[idx - 1], reordered[idx]];
    const personal = sorted.find(sec => sec.section_type === "personal");
    const full = personal
      ? [{ ...personal, sort_order: 0 }, ...reordered.map((sec, i) => ({ ...sec, sort_order: i + 1 }))]
      : reordered.map((sec, i) => ({ ...sec, sort_order: i }));
    set({ sections: full, isDirty: true });
    const resumeId = s.resume?.id;
    if (!resumeId) return;
    const key = `reorder-${sectionId}`;
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      try { await sectionApi.reorder(resumeId, full.map(sec => ({ id: sec.id, sort_order: sec.sort_order }))); }
      catch (e) { console.warn("[store] reorder failed:", e); }
    }, 500);
  },

  moveSectionDown: (sectionId) => {
    const s = get();
    const sorted = [...s.sections].sort((a, b) => a.sort_order - b.sort_order);
    const movable = sorted.filter(sec => sec.section_type !== "personal");
    const idx = movable.findIndex(sec => sec.id === sectionId);
    if (idx < 0 || idx >= movable.length - 1) return;
    const reordered = [...movable];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const personal = sorted.find(sec => sec.section_type === "personal");
    const full = personal
      ? [{ ...personal, sort_order: 0 }, ...reordered.map((sec, i) => ({ ...sec, sort_order: i + 1 }))]
      : reordered.map((sec, i) => ({ ...sec, sort_order: i }));
    set({ sections: full, isDirty: true });
    const resumeId = s.resume?.id;
    if (!resumeId) return;
    const key = `reorder-${sectionId}`;
    clearTimeout(_debounceTimers[key]);
    _debounceTimers[key] = setTimeout(async () => {
      try { await sectionApi.reorder(resumeId, full.map(sec => ({ id: sec.id, sort_order: sec.sort_order }))); }
      catch (e) { console.warn("[store] reorder failed:", e); }
    }, 500);
  },

  setActiveSectionId: (id) => set({ activeSectionId: id }),
  setActivePanel: (panel) => set({ activePanel: panel }),

  setTheme: (theme) =>
    set((s) => ({
      resume: s.resume
        ? { ...s.resume, resume_customizations: { ...s.resume.resume_customizations!, ...theme } }
        : null,
      isDirty: true,
    })),

  setDirty: (isDirty) => set({ isDirty }),
  setSaving: (isSaving) => set({ isSaving }),
  setAtsScore: (atsScore) => set({ atsScore }),

  pushHistory: () =>
    set((s) => {
      const newHistory = s.history.slice(0, s.historyIndex + 1);
      newHistory.push([...s.sections]);
      return { history: newHistory.slice(-30), historyIndex: newHistory.length - 1 };
    }),

  undo: () =>
    set((s) => {
      if (s.historyIndex <= 0) return s;
      const idx = s.historyIndex - 1;
      return { sections: [...s.history[idx]], historyIndex: idx, isDirty: true };
    }),

  redo: () =>
    set((s) => {
      if (s.historyIndex >= s.history.length - 1) return s;
      const idx = s.historyIndex + 1;
      return { sections: [...s.history[idx]], historyIndex: idx, isDirty: true };
    }),

  reset: () =>
    set({ resume: null, sections: [], activeSectionId: null, isDirty: false, history: [], historyIndex: -1 }),
}));

// ── UI Store ──────────────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  previewZoom: number;
  toggleSidebar: () => void;
  setPreviewZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  previewZoom: 72,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setPreviewZoom: (previewZoom) => set({ previewZoom }),
}));

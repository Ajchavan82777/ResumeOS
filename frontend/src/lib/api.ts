import axios, { AxiosInstance, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request interceptor: attach token + fix FormData uploads ────────────────
api.interceptors.request.use(config => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // For FormData, delete the default Content-Type so the browser sets
  // "multipart/form-data; boundary=..." automatically. Without this,
  // the instance-level "application/json" default overrides it and
  // multer can't find the file boundary.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// ── Response interceptor: auto-refresh token on 401 ────────────────────────
let _refreshing = false;
let _refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const original = err.config as any;
    if (err.response?.status !== 401 || original?._retry || typeof window === "undefined") {
      return Promise.reject(err);
    }
    if (window.location.pathname.startsWith("/auth")) return Promise.reject(err);

    // Already refreshing — queue this request
    if (_refreshing) {
      return new Promise(resolve => {
        _refreshQueue.push((newToken: string) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    _refreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("no refresh token");

      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refresh_token: refreshToken });
      const newToken = data.access_token;

      localStorage.setItem("access_token", newToken);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      // Flush queued requests
      _refreshQueue.forEach(cb => cb(newToken));
      _refreshQueue = [];

      // Retry original request
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      // Refresh failed — redirect to login
      _refreshQueue = [];
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return Promise.reject(err);
    } finally {
      _refreshing = false;
    }
  }
);

export default api;

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string, user_id: string) =>
    api.post("/auth/reset-password", { token, password, user_id }),
};

// ── Resumes ──────────────────────────────────────────────────────────────────
export const resumeApi = {
  list: () => api.get("/resumes"),
  create: (data: { title: string; template_slug?: string }) =>
    api.post("/resumes", data),
  get: (id: string) => api.get(`/resumes/${id}`),
  update: (id: string, data: object) => api.patch(`/resumes/${id}`, data),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  duplicate: (id: string) => api.post(`/resumes/${id}/duplicate`),
  updateCustomization: (id: string, data: object) =>
    api.patch(`/resumes/${id}/customization`, data),
  getScore: (id: string) => api.post(`/resumes/${id}/score`),
};

// ── Sections ─────────────────────────────────────────────────────────────────
export const sectionApi = {
  list: (resumeId: string) =>
    api.get(`/resumes/${resumeId}/sections`),
  create: (resumeId: string, data: object) =>
    api.post(`/resumes/${resumeId}/sections`, data),
  update: (resumeId: string, sectionId: string, data: object) =>
    api.patch(`/resumes/${resumeId}/sections/${sectionId}`, data),
  delete: (resumeId: string, sectionId: string) =>
    api.delete(`/resumes/${resumeId}/sections/${sectionId}`),
  reorder: (resumeId: string, order: { id: string; sort_order: number }[]) =>
    api.put(`/resumes/${resumeId}/sections/reorder`, { order }),
  createEntry: (resumeId: string, sectionId: string, data: object) =>
    api.post(`/resumes/${resumeId}/sections/${sectionId}/entries`, { data }),
  updateEntry: (resumeId: string, sectionId: string, entryId: string, data: object) =>
    api.patch(`/resumes/${resumeId}/sections/${sectionId}/entries/${entryId}`, data),
  deleteEntry: (resumeId: string, sectionId: string, entryId: string) =>
    api.delete(`/resumes/${resumeId}/sections/${sectionId}/entries/${entryId}`),
};

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  /** Check if AI features are enabled on the backend */
  status: () => api.get("/ai/status"),
  /** Admin-only: read full AI settings */
  adminGetSettings: () => api.get("/ai/admin/settings"),
  /** Admin-only: update provider / api_key / model / ai_enabled */
  adminSaveSettings: (data: object) => api.patch("/ai/admin/settings", data),
  /** Admin-only: test the configured key */
  adminTestConnection: () => api.post("/ai/admin/test"),
  /** Admin-only: fetch AI usage logs */
  adminGetUsage: () => api.get("/ai/admin/usage"),
  generateSummary: (data: {
    job_title: string;
    experience_years?: number;
    skills?: string[];
    resume_id?: string;
  }) => api.post("/ai/generate-summary", data),
  improveBullets: (data: {
    bullets: string[];
    job_title: string;
    resume_id?: string;
  }) => api.post("/ai/improve-bullets", data),
  suggestSkills: (data: {
    job_title: string;
    existing_skills?: string[];
    resume_id?: string;
  }) => api.post("/ai/suggest-skills", data),
  keywordMatch: (data: {
    job_description: string;
    resume_text: string;
    resume_id?: string;
  }) => api.post("/ai/keyword-match", data),
  tailorResume: (data: {
    job_description: string;
    summary?: string;
    resume_id?: string;
  }) => api.post("/ai/tailor-resume", data),
  generateCoverLetter: (data: {
    job_title: string;
    company: string;
    job_description?: string;
    applicant_name?: string;
    key_skills?: string[];
  }) => api.post("/ai/generate-cover-letter", data),
};

// ── Export ───────────────────────────────────────────────────────────────────
export const exportApi = {
  pdf: (resumeId: string) =>
    api.post(`/export/${resumeId}/pdf`, {}, { responseType: "blob", timeout: 60000 }),
  docx: (resumeId: string) =>
    api.post(`/export/${resumeId}/docx`),
};

// ── Templates ────────────────────────────────────────────────────────────────
export const templateApi = {
  list: () => api.get("/templates"),
  get: (slug: string) => api.get(`/templates/${slug}`),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => api.get("/profile"),
  update: (data: object) => api.patch("/profile", data),
};

// ── Cover Letters ────────────────────────────────────────────────────────────
export const coverLetterApi = {
  list: () => api.get("/cover-letters"),
  create: (data: object) => api.post("/cover-letters", data),
  get: (id: string) => api.get(`/cover-letters/${id}`),
  update: (id: string, data: object) => api.patch(`/cover-letters/${id}`, data),
  delete: (id: string) => api.delete(`/cover-letters/${id}`),
};

// ── Shared Links ─────────────────────────────────────────────────────────────
export const sharedApi = {
  create: (resumeId: string) => api.post(`/shared/${resumeId}`),
  view: (slug: string) => api.get(`/shared/view/${slug}`),
  list: () => api.get("/shared"),
  deactivate: (id: string) => api.delete(`/shared/${id}`),
};

// ── Subscriptions ────────────────────────────────────────────────────────────
export const subscriptionApi = {
  get: () => api.get("/subscriptions"),
  upgrade: (plan: string) => api.post("/subscriptions/upgrade", { plan }),
};

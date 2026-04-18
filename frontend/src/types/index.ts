// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  job_title?: string;
  location?: string;
  phone?: string;
  linkedin_url?: string;
  website_url?: string;
  github_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "cancelled" | "past_due" | "trialing";
  current_period_end?: string;
}

// ─── Resume ──────────────────────────────────────────────────────────────────
export interface ResumeTheme {
  accent_color: string;
  font_family: string;
  font_size: number;
  line_spacing: number;
  section_spacing: number;
  margins: number;
  density: "compact" | "standard" | "spacious";
  page_size: "A4" | "Letter";
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  template_slug: string;
  is_public: boolean;
  is_deleted: boolean;
  ats_score: number;
  version: number;
  created_at: string;
  updated_at: string;
  resume_customizations?: ResumeTheme;
  resume_sections?: ResumeSection[];
}

// ─── Sections ────────────────────────────────────────────────────────────────
export type SectionType =
  | "personal" | "summary" | "experience" | "education"
  | "skills" | "projects" | "certifications" | "achievements"
  | "languages" | "references" | "custom";

export interface ResumeSection {
  id: string;
  resume_id: string;
  section_type: SectionType;
  title: string;
  is_visible: boolean;
  is_locked: boolean;
  sort_order: number;
  data: Record<string, any>;
  section_entries?: SectionEntry[];
  created_at: string;
  updated_at: string;
}

export interface SectionEntry {
  id: string;
  section_id: string;
  sort_order: number;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ─── Personal Section Data ────────────────────────────────────────────────────
export interface PersonalData {
  name: string;
  job_title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
}

// ─── Entry Data Types ─────────────────────────────────────────────────────────
export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  notes: string;
}

export interface SkillEntry {
  category: string;
  skills: string[];
}

export interface ProjectEntry {
  name: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  bullets: string[];
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

// ─── Templates ────────────────────────────────────────────────────────────────
export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url?: string;
  category: string;
  is_premium: boolean;
  sort_order: number;
}

// ─── Cover Letter ─────────────────────────────────────────────────────────────
export interface CoverLetter {
  id: string;
  user_id: string;
  resume_id?: string;
  title: string;
  content: string;
  job_title: string;
  company: string;
  template_slug: string;
  created_at: string;
  updated_at: string;
}

// ─── Shared Links ─────────────────────────────────────────────────────────────
export interface SharedLink {
  id: string;
  resume_id: string;
  slug: string;
  is_active: boolean;
  view_count: number;
  expires_at?: string;
  created_at: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  errors?: { msg: string; param: string }[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User & { profile: Profile; subscription: Subscription };
}

export interface ATSScore {
  score: number;
  breakdown: {
    contact: number;
    summary: number;
    experience: number;
    education: number;
    skills: number;
    formatting: number;
  };
  suggestions: string[];
}

export interface KeywordMatch {
  match_percentage: number;
  found_keywords: string[];
  missing_keywords: string[];
  recommendations: string[];
}

-- ============================================================
-- ResumeOS — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  job_title     TEXT,
  location      TEXT,
  phone         TEXT,
  linkedin_url  TEXT,
  website_url   TEXT,
  github_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBSCRIPTIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due','trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEMPLATES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  category      TEXT DEFAULT 'general',
  is_premium    BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESUMES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT 'My Resume',
  template_id     UUID REFERENCES templates(id),
  template_slug   TEXT DEFAULT 'classic',
  is_public       BOOLEAN DEFAULT FALSE,
  is_deleted      BOOLEAN DEFAULT FALSE,
  ats_score       INTEGER DEFAULT 0,
  last_ats_check  TIMESTAMPTZ,
  version         INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESUME CUSTOMIZATIONS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_customizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id       UUID NOT NULL UNIQUE REFERENCES resumes(id) ON DELETE CASCADE,
  accent_color    TEXT DEFAULT '#57CDA4',
  font_family     TEXT DEFAULT 'Georgia, serif',
  font_size       NUMERIC DEFAULT 11,
  line_spacing    NUMERIC DEFAULT 1.55,
  section_spacing INTEGER DEFAULT 16,
  margins         INTEGER DEFAULT 36,
  density         TEXT DEFAULT 'standard' CHECK (density IN ('compact','standard','spacious')),
  page_size       TEXT DEFAULT 'A4' CHECK (page_size IN ('A4','Letter')),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESUME SECTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id   UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  title       TEXT NOT NULL,
  is_visible  BOOLEAN DEFAULT TRUE,
  is_locked   BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER DEFAULT 0,
  data        JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SECTION ENTRIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS section_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id  UUID NOT NULL REFERENCES resume_sections(id) ON DELETE CASCADE,
  sort_order  INTEGER DEFAULT 0,
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── COVER LETTERS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cover_letters (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id   UUID REFERENCES resumes(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Cover Letter',
  content     TEXT,
  job_title   TEXT,
  company     TEXT,
  template_slug TEXT DEFAULT 'classic',
  is_deleted  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── EXPORT LOGS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id   UUID REFERENCES resumes(id) ON DELETE SET NULL,
  format      TEXT NOT NULL CHECK (format IN ('pdf','docx')),
  file_name   TEXT,
  file_size   INTEGER,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI USAGE LOGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id   UUID REFERENCES resumes(id) ON DELETE SET NULL,
  feature     TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SHARED RESUME LINKS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS shared_resume_links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id       UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug            TEXT UNIQUE NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  password_hash   TEXT,
  view_count      INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── RESUME VERSION HISTORY ─────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_versions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id   UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  snapshot    JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id     UUID REFERENCES subscriptions(id),
  amount_cents        INTEGER NOT NULL,
  currency            TEXT DEFAULT 'usd',
  status              TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded')),
  stripe_payment_id   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── ADMIN SETTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_deleted ON resumes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_sections_resume ON resume_sections(resume_id);
CREATE INDEX IF NOT EXISTS idx_entries_section ON section_entries(section_id);
CREATE INDEX IF NOT EXISTS idx_shared_slug ON shared_resume_links(slug);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_export_logs_user ON export_logs(user_id, created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cover_letters       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_resume_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this script is safely re-runnable
DROP POLICY IF EXISTS "profiles_own"   ON profiles;
DROP POLICY IF EXISTS "resumes_own"    ON resumes;
DROP POLICY IF EXISTS "sections_own"   ON resume_sections;
DROP POLICY IF EXISTS "entries_own"    ON section_entries;
DROP POLICY IF EXISTS "custom_own"     ON resume_customizations;
DROP POLICY IF EXISTS "cl_own"         ON cover_letters;
DROP POLICY IF EXISTS "shared_own"     ON shared_resume_links;
DROP POLICY IF EXISTS "sub_own"        ON subscriptions;
DROP POLICY IF EXISTS "templates_read" ON templates;

-- Profiles: users can read/write their own
CREATE POLICY "profiles_own" ON profiles FOR ALL USING (auth.uid() = id);

-- Resumes: users own their resumes
CREATE POLICY "resumes_own" ON resumes FOR ALL USING (auth.uid() = user_id);

-- Sections: via resume ownership
CREATE POLICY "sections_own" ON resume_sections FOR ALL
  USING (resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid()));

-- Entries: via section → resume ownership
CREATE POLICY "entries_own" ON section_entries FOR ALL
  USING (section_id IN (
    SELECT rs.id FROM resume_sections rs
    JOIN resumes r ON rs.resume_id = r.id
    WHERE r.user_id = auth.uid()
  ));

-- Customizations: via resume ownership
CREATE POLICY "custom_own" ON resume_customizations FOR ALL
  USING (resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid()));

-- Cover letters: own
CREATE POLICY "cl_own" ON cover_letters FOR ALL USING (auth.uid() = user_id);

-- Shared links: own
CREATE POLICY "shared_own" ON shared_resume_links FOR ALL USING (auth.uid() = user_id);

-- Subscriptions: own
CREATE POLICY "sub_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Templates: everyone can read
CREATE POLICY "templates_read" ON templates FOR SELECT USING (true);

-- ============================================================
-- TRIGGERS — auto-update updated_at (drop first to re-run safely)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
DROP TRIGGER IF EXISTS trg_resumes_updated  ON resumes;
DROP TRIGGER IF EXISTS trg_sections_updated ON resume_sections;
DROP TRIGGER IF EXISTS trg_custom_updated   ON resume_customizations;
DROP TRIGGER IF EXISTS trg_cl_updated       ON cover_letters;
DROP TRIGGER IF EXISTS trg_shared_updated   ON shared_resume_links;
DROP TRIGGER IF EXISTS trg_sub_updated      ON subscriptions;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_resumes_updated  BEFORE UPDATE ON resumes             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sections_updated BEFORE UPDATE ON resume_sections     FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_custom_updated   BEFORE UPDATE ON resume_customizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cl_updated       BEFORE UPDATE ON cover_letters       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shared_updated   BEFORE UPDATE ON shared_resume_links FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sub_updated      BEFORE UPDATE ON subscriptions       FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA — Templates
-- ============================================================
INSERT INTO templates (name, slug, description, category, is_premium, sort_order) VALUES
  ('Classic', 'classic', 'Clean single-column ATS-optimized layout', 'ats', false, 1),
  ('Modern', 'modern', 'Contemporary design with accent colors', 'modern', false, 2),
  ('Executive', 'executive', 'Bold header for senior professionals', 'executive', true, 3),
  ('Technical', 'technical', 'Optimized for engineers and developers', 'ats', false, 4),
  ('Creative', 'creative', 'Expressive layout for creative roles', 'creative', true, 5),
  ('Minimal', 'minimal', 'Ultra-clean one-page layout', 'simple', false, 6)
ON CONFLICT (slug) DO NOTHING;

-- Default admin settings
INSERT INTO admin_settings (key, value) VALUES
  ('ai_monthly_limit_free', '20'),
  ('ai_monthly_limit_pro', '500'),
  ('exports_monthly_limit_free', '5'),
  ('watermark_free_users', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- AI SETTINGS TABLE (admin-configurable AI provider)
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text NOT NULL DEFAULT 'anthropic',
  api_key     text NOT NULL DEFAULT '',
  model       text NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  ai_enabled  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS ai_settings_singleton ON ai_settings ((true));

-- Insert default (AI disabled, no key)
INSERT INTO ai_settings (provider, api_key, model, ai_enabled)
VALUES ('anthropic', '', 'claude-3-5-sonnet-20241022', false)
ON CONFLICT DO NOTHING;

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
-- Only service role (backend) can access this table

-- Add provider and model columns to ai_usage_logs if not present
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS provider text DEFAULT 'anthropic';
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS model    text DEFAULT '';

-- Update admin_settings with AI feature flags
INSERT INTO admin_settings (key, value) VALUES
  ('feature_ai_assistant',  'false'),
  ('feature_docx_export',   'true'),
  ('feature_cover_letter',  'true'),
  ('maintenance_mode',      'false')
ON CONFLICT (key) DO NOTHING;


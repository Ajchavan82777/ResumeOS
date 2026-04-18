-- ═══════════════════════════════════════════════════════════════════════
-- ResumeOS AI Settings Migration
-- Run this in Supabase SQL Editor AFTER the main schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── ai_settings table ────────────────────────────────────────────────────────
-- Stores admin-configurable AI provider settings (one row, managed by admin)
CREATE TABLE IF NOT EXISTS ai_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text NOT NULL DEFAULT 'anthropic',   -- 'anthropic' | 'openai' | 'openrouter'
  api_key         text NOT NULL DEFAULT '',            -- encrypted key entered by admin
  model           text NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  ai_enabled      boolean NOT NULL DEFAULT false,      -- global on/off for ALL users
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Only one row allowed
CREATE UNIQUE INDEX IF NOT EXISTS ai_settings_singleton ON ai_settings ((true));

-- Insert default disabled row
INSERT INTO ai_settings (provider, api_key, model, ai_enabled)
VALUES ('anthropic', '', 'claude-3-5-sonnet-20241022', false)
ON CONFLICT DO NOTHING;

-- RLS: only service role can touch this (backend uses service key)
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
-- No user-facing RLS policies — only backend service role accesses this

-- ── ai_usage_logs: ensure table exists ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resume_id   uuid REFERENCES resumes(id) ON DELETE SET NULL,
  feature     text,
  provider    text DEFAULT 'anthropic',
  model       text,
  tokens_used integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_idx ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_idx ON ai_usage_logs(created_at DESC);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
-- Users can see their own logs
CREATE POLICY IF NOT EXISTS "Users see own AI logs"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ── admin_settings: ensure feature flags table exists ────────────────────────
CREATE TABLE IF NOT EXISTS admin_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
-- No public access — service role only

-- Seed default feature flags
INSERT INTO admin_settings (key, value) VALUES
  ('feature_ai_assistant',   'false'),
  ('feature_docx_export',    'true'),
  ('feature_cover_letter',   'true'),
  ('ai_monthly_limit_free',  '0'),
  ('ai_monthly_limit_pro',   '0'),
  ('maintenance_mode',       'false')
ON CONFLICT (key) DO NOTHING;

-- ── Update trigger for ai_settings ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_ai_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_settings_updated_at ON ai_settings;
CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_ai_settings_timestamp();

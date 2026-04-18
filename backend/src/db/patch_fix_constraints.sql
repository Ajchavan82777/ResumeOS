-- ═══════════════════════════════════════════════════════════════════════
-- ResumeOS — Database Patch (run if you get seed errors)
-- ═══════════════════════════════════════════════════════════════════════
--
-- Run this in Supabase SQL Editor if you see this error:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--
-- This patch adds the missing UNIQUE constraint to the subscriptions table
-- and ensures the ai_settings table exists.
-- ═══════════════════════════════════════════════════════════════════════

-- Fix 1: Add unique constraint on subscriptions.user_id (required for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscriptions_user_id_key'
      AND conrelid = 'subscriptions'::regclass
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint to subscriptions.user_id';
  ELSE
    RAISE NOTICE 'Unique constraint on subscriptions.user_id already exists';
  END IF;
END $$;

-- Fix 2: Ensure ai_settings table exists
CREATE TABLE IF NOT EXISTS ai_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text NOT NULL DEFAULT 'anthropic',
  api_key     text NOT NULL DEFAULT '',
  model       text NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  ai_enabled  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_settings_singleton ON ai_settings ((true));

INSERT INTO ai_settings (provider, api_key, model, ai_enabled)
VALUES ('anthropic', '', 'claude-3-5-sonnet-20241022', false)
ON CONFLICT DO NOTHING;

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Fix 3: Add missing columns to ai_usage_logs
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS provider text DEFAULT 'anthropic';
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS model    text DEFAULT '';

-- Fix 4: Ensure admin_settings has AI flags
INSERT INTO admin_settings (key, value) VALUES
  ('feature_ai_assistant', 'false'),
  ('feature_docx_export',  'true'),
  ('feature_cover_letter', 'true'),
  ('maintenance_mode',     'false')
ON CONFLICT (key) DO NOTHING;

-- Done
SELECT 'Database patch applied successfully!' AS result;

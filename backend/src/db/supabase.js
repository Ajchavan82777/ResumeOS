const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️  Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env");
}

// Admin client (bypasses RLS) — server-side only
const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceKey || "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Public client (respects RLS)
const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

module.exports = { supabase, supabaseAdmin };

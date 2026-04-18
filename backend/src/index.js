require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resumes");
const sectionRoutes = require("./routes/sections");
const templateRoutes = require("./routes/templates");
const exportRoutes = require("./routes/export");
const aiRoutes = require("./routes/ai");
const profileRoutes = require("./routes/profile");
const coverLetterRoutes = require("./routes/coverLetters");
const sharedRoutes = require("./routes/shared");
const subscriptionRoutes = require("./routes/subscriptions");
const parseResumeRoutes  = require("./routes/parseResume");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "AI request limit reached. Please wait a minute." },
});
app.use("/api/ai/", aiLimiter);

// ── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// ── Diagnostic (helps debug login issues) ─────────────────────────────────
app.get("/debug", async (req, res) => {
  const { supabase, supabaseAdmin } = require("./db/supabase");
  const results = {};

  // 1. Check Supabase URL is set
  results.supabase_url = process.env.SUPABASE_URL
    ? `✅ Set (${process.env.SUPABASE_URL})`
    : "❌ MISSING — set SUPABASE_URL in backend/.env";

  results.service_key = process.env.SUPABASE_SERVICE_KEY
    ? "✅ Set"
    : "❌ MISSING — set SUPABASE_SERVICE_KEY in backend/.env";

  results.anon_key = process.env.SUPABASE_ANON_KEY
    ? "✅ Set"
    : "❌ MISSING — set SUPABASE_ANON_KEY in backend/.env";

  // 2. Check if admin user exists in Supabase Auth
  try {
    const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (error) {
      results.admin_user = `❌ Cannot list users: ${error.message}`;
    } else {
      const admin = list?.users?.find(u => u.email === "admin@resumeos.com");
      results.admin_user = admin
        ? `✅ Found (id: ${admin.id.slice(0, 8)}…, confirmed: ${admin.email_confirmed_at ? "yes" : "NO — not confirmed"})`
        : "❌ NOT FOUND — run SEED_ADMIN.bat to create it";
    }
  } catch (e) {
    results.admin_user = `❌ Error: ${e.message}`;
  }

  // 3. Check profiles table
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    results.profiles_table = error
      ? `❌ Error: ${error.message} — did you run schema.sql in Supabase?`
      : "✅ Exists";
  } catch (e) {
    results.profiles_table = `❌ Exception: ${e.message}`;
  }

  // 4. Check subscriptions table
  try {
    const { error } = await supabaseAdmin.from("subscriptions").select("id").limit(1);
    results.subscriptions_table = error
      ? `❌ Error: ${error.message} — did you run schema.sql in Supabase?`
      : "✅ Exists";
  } catch (e) {
    results.subscriptions_table = `❌ Exception: ${e.message}`;
  }

  // 5. Test sign-in + get token
  let testToken = null;
  let testUserId = null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "admin@resumeos.com",
      password: "Admin@123456",
    });
    if (error) {
      results.login_test = `❌ Sign-in failed: ${error.message}`;
    } else if (!data.session) {
      results.login_test = "❌ Sign-in returned no session (anon key may be wrong)";
    } else {
      testToken  = data.session.access_token;
      testUserId = data.user.id;
      results.login_test = `✅ Login works! user_id=${testUserId.slice(0,8)}…`;
    }
  } catch (e) {
    results.login_test = `❌ Exception: ${e.message}`;
  }

  // 6. Verify token with getUser (same check as authenticate middleware)
  if (testToken) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(testToken);
      results.token_verify = error
        ? `❌ getUser failed: ${error.message}`
        : `✅ Token valid — user ${user?.email}`;
    } catch (e) {
      results.token_verify = `❌ Exception: ${e.message}`;
    }
  } else {
    results.token_verify = "⏭ Skipped (no token)";
  }

  // 7. Profile exists for admin?
  if (testUserId) {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles").select("id,email").eq("id", testUserId).maybeSingle();
      results.admin_profile = error
        ? `❌ Error: ${error.message}`
        : (profile ? `✅ EXISTS (email: ${profile.email})` : "❌ MISSING — this causes FK error on resume create");
    } catch (e) {
      results.admin_profile = `❌ Exception: ${e.message}`;
    }
  }

  // 8. Try inserting a test resume
  if (testUserId) {
    try {
      const { data: resume, error } = await supabaseAdmin
        .from("resumes")
        .insert({ user_id: testUserId, title: "__debug_test__", template_slug: "classic" })
        .select().single();
      if (error) {
        results.resume_insert = `❌ Error: ${error.message} (code: ${error.code})`;
      } else {
        results.resume_insert = `✅ Insert OK — id=${resume.id.slice(0,8)}…`;
        try { await supabaseAdmin.from("resumes").delete().eq("id", resume.id); } catch {}
      }
    } catch (e) {
      results.resume_insert = `❌ Exception: ${e.message}`;
    }
  }

  // 9. Summary
  const allOk = Object.values(results).every(v => String(v).startsWith("✅") || String(v).startsWith("⏭"));
  results._summary = allOk
    ? "✅ Everything looks good — resume creation should work."
    : "❌ Issues found — fix the ❌ items above, then restart the backend.";

  res.json(results);
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/resumes", sectionRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cover-letters", coverLetterRoutes);
app.use("/api/shared", sharedRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/resumes",       parseResumeRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ ResumeOS API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;

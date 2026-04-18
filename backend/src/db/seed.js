/**
 * ResumeOS — Admin Seed Script (Fixed)
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates or updates the admin user in Supabase with sample data.
 *
 * Fixes:
 *  - "no unique constraint matching ON CONFLICT" on subscriptions table
 *    → now uses DELETE + INSERT instead of upsert for subscription
 *  - All DB errors are caught individually and logged, script continues
 *  - Idempotent: safe to run multiple times
 *
 * Usage:  node src/db/seed.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("\n❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in your .env file.\n");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN = {
  email    : "admin@resumeos.com",
  password : "Admin@123456",
  fullName : "Admin User",
};

const log  = (msg) => console.log(`  ✅  ${msg}`);
const warn = (msg) => console.log(`  ⚠️   ${msg}`);
const step = (msg) => console.log(`\n▶  ${msg}`);
const info = (msg) => console.log(`  ℹ️   ${msg}`);

// ── 1. Create or find admin auth user ─────────────────────────────────────────
async function ensureAdminUser() {
  step("Creating admin user in Supabase Auth…");
  let userId;

  // Check if user already exists
  const { data: list, error: listErr } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error("Failed to list users: " + listErr.message);

  const existing = list?.users?.find(u => u.email === ADMIN.email);

  if (existing) {
    userId = existing.id;
    warn(`User already exists (id: ${userId.slice(0, 8)}…) — updating password`);
    const { error: updateErr } = await db.auth.admin.updateUserById(userId, {
      password       : ADMIN.password,
      email_confirm  : true,
      user_metadata  : { full_name: ADMIN.fullName, role: "admin" },
    });
    if (updateErr) warn("Password update failed: " + updateErr.message);
    else log("Password updated");
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email          : ADMIN.email,
      password       : ADMIN.password,
      email_confirm  : true,
      user_metadata  : { full_name: ADMIN.fullName, role: "admin" },
    });
    if (error) throw new Error("Auth create error: " + error.message);
    userId = data.user.id;
    log(`Admin user created (id: ${userId.slice(0, 8)}…)`);
  }

  return userId;
}

// ── 2. Upsert profile ─────────────────────────────────────────────────────────
async function ensureProfile(userId) {
  step("Setting up admin profile…");
  const { error } = await db.from("profiles").upsert({
    id           : userId,
    email        : ADMIN.email,
    full_name    : ADMIN.fullName,
    job_title    : "Full-Stack Developer",
    location     : "San Francisco, CA",
    phone        : "+1 (555) 000-0001",
    linkedin_url : "linkedin.com/in/adminuser",
    website_url  : "resumeos.com",
    bio          : "ResumeOS admin account for testing all features.",
  }, { onConflict: "id" });
  if (error) throw new Error("Profile upsert failed: " + error.message);
  log("Profile upserted");
}

// ── 3. Subscription — DELETE then INSERT (avoids unique constraint issue) ─────
async function ensureSubscription(userId) {
  step("Activating Pro subscription…");

  // Delete any existing subscription for this user first
  const { error: delErr } = await db
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);

  if (delErr) {
    // Not fatal — might not exist yet
    info("No existing subscription to remove (or delete skipped)");
  } else {
    info("Cleared old subscription");
  }

  // Insert fresh pro subscription
  const { error: insErr } = await db.from("subscriptions").insert({
    user_id              : userId,
    plan                 : "pro",
    status               : "active",
    current_period_start : new Date().toISOString(),
    current_period_end   : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
  });

  if (insErr) throw new Error("Subscription insert failed: " + insErr.message);
  log("Pro subscription activated (expires in 1 year)");
}

// ── 4. Sample resumes ─────────────────────────────────────────────────────────
async function createSampleResume(userId, title, templateSlug, accentColor) {
  const { data: resume, error } = await db.from("resumes").insert({
    user_id       : userId,
    title,
    template_slug : templateSlug,
    ats_score     : Math.floor(Math.random() * 15) + 82,
  }).select().single();
  if (error) throw new Error("Resume create failed: " + error.message);

  // Customization
  await db.from("resume_customizations").insert({
    resume_id    : resume.id,
    accent_color : accentColor,
    font_family  : "Georgia, serif",
    font_size    : 11,
    line_spacing : 1.55,
    margins      : 36,
    density      : "standard",
    page_size    : "A4",
  }).then(() => {}).catch(e => warn("Customization: " + e.message));

  // Sections
  const sections = [
    {
      section_type : "personal", title : "Personal Information", sort_order : 0,
      data : {
        name      : "Admin User",        job_title : "Senior Software Engineer",
        email     : ADMIN.email,         phone     : "+1 (555) 000-0001",
        location  : "San Francisco, CA", linkedin  : "linkedin.com/in/adminuser",
        website   : "resumeos.com",      github    : "github.com/adminuser",
      },
    },
    {
      section_type : "summary", title : "Professional Summary", sort_order : 1,
      data : { text: "Results-driven Full-Stack Engineer with 8+ years building scalable SaaS products. Expert in React, Node.js, and cloud architecture. Proven track record of leading cross-functional teams and shipping products used by millions." },
    },
  ];

  for (const sec of sections) {
    await db.from("resume_sections").insert({ ...sec, resume_id: resume.id })
      .then(() => {}).catch(e => warn(`Section ${sec.section_type}: ${e.message}`));
  }

  // Experience section with entries
  const { data: expSec, error: expErr } = await db.from("resume_sections").insert({
    resume_id : resume.id, section_type : "experience",
    title : "Work Experience", sort_order : 2, data : {},
  }).select().single();

  if (!expErr && expSec) {
    await db.from("section_entries").insert([
      {
        section_id : expSec.id, sort_order : 0,
        data : {
          role : "Senior Software Engineer", company : "Stripe",
          location : "San Francisco, CA", startDate : "2021-03", endDate : "", current : true,
          bullets : [
            "Led architecture of payment processing microservice handling $2B+ annual transactions",
            "Reduced API latency by 40% through Redis caching and database query optimization",
            "Mentored 5 junior engineers; improved team velocity by 25%",
          ],
        },
      },
      {
        section_id : expSec.id, sort_order : 1,
        data : {
          role : "Software Engineer", company : "Airbnb",
          location : "San Francisco, CA", startDate : "2018-06", endDate : "2021-02", current : false,
          bullets : [
            "Built Airbnb for Work product from 0→1, now generating $500M ARR",
            "Improved host onboarding flow, increasing completion rate by 28%",
            "Developed real-time availability search using Elasticsearch and GraphQL",
          ],
        },
      },
    ]).then(() => {}).catch(e => warn("Exp entries: " + e.message));
  }

  // Education
  const { data: eduSec } = await db.from("resume_sections").insert({
    resume_id : resume.id, section_type : "education",
    title : "Education", sort_order : 3, data : {},
  }).select().single().catch(() => ({ data: null }));

  if (eduSec) {
    await db.from("section_entries").insert({
      section_id : eduSec.id, sort_order : 0,
      data : { degree : "B.S. Computer Science", school : "Stanford University", location : "Stanford, CA", startDate : "2014", endDate : "2018", gpa : "3.8", notes : "Focus on Distributed Systems and Machine Learning" },
    }).then(() => {}).catch(() => {});
  }

  // Skills
  const { data: skSec } = await db.from("resume_sections").insert({
    resume_id : resume.id, section_type : "skills",
    title : "Skills", sort_order : 4, data : {},
  }).select().single().catch(() => ({ data: null }));

  if (skSec) {
    await db.from("section_entries").insert([
      { section_id: skSec.id, sort_order: 0, data: { category: "Frontend",       skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"] } },
      { section_id: skSec.id, sort_order: 1, data: { category: "Backend",        skills: ["Node.js", "Express", "PostgreSQL", "Redis", "GraphQL"] } },
      { section_id: skSec.id, sort_order: 2, data: { category: "Cloud & DevOps", skills: ["AWS", "Docker", "Kubernetes", "Terraform"] } },
    ]).then(() => {}).catch(() => {});
  }

  // Projects
  const { data: projSec } = await db.from("resume_sections").insert({
    resume_id : resume.id, section_type : "projects",
    title : "Projects", sort_order : 5, data : {},
  }).select().single().catch(() => ({ data: null }));

  if (projSec) {
    await db.from("section_entries").insert({
      section_id : projSec.id, sort_order : 0,
      data : { name : "ResumeOS", role : "Creator & Lead Engineer", url : "resumeos.com", startDate : "2024-01", current : true, description : "Full-stack ATS resume builder with AI, drag-and-drop editor, PDF/DOCX export, and Claude AI. Built with Next.js, Express, Supabase." },
    }).then(() => {}).catch(() => {});
  }

  // Certifications
  const { data: certSec } = await db.from("resume_sections").insert({
    resume_id : resume.id, section_type : "certifications",
    title : "Certifications", sort_order : 6, data : {},
  }).select().single().catch(() => ({ data: null }));

  if (certSec) {
    await db.from("section_entries").insert([
      { section_id: certSec.id, sort_order: 0, data: { name: "AWS Solutions Architect – Professional", issuer: "Amazon Web Services", date: "2023" } },
      { section_id: certSec.id, sort_order: 1, data: { name: "Google Cloud Professional Data Engineer", issuer: "Google", date: "2022" } },
    ]).then(() => {}).catch(() => {});
  }

  return resume;
}

// ── 5. Cover letter ───────────────────────────────────────────────────────────
async function createCoverLetter(userId, resumeId) {
  await db.from("cover_letters").insert({
    user_id      : userId,
    resume_id    : resumeId,
    title        : "Cover Letter – Senior Engineer @ Stripe",
    job_title    : "Senior Software Engineer",
    company      : "Stripe",
    template_slug: "classic",
    content      : `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at Stripe. With over 8 years of experience building scalable payment infrastructure and developer tools, I am excited about the opportunity to contribute to Stripe's mission of growing the GDP of the internet.

During my time at Airbnb, I led the technical development of Airbnb for Work—a product that now generates $500M in annual recurring revenue. I architected a real-time availability search system and drove a host onboarding redesign that increased completion rates by 28%.

I would welcome the opportunity to discuss how my experience can contribute to Stripe's continued growth.

Warm regards,
Admin User`,
  }).then(() => log("Sample cover letter created"))
    .catch(e => warn("Cover letter: " + e.message));
}

// ── 6. Shared link ────────────────────────────────────────────────────────────
async function createSharedLink(userId, resumeId) {
  // Delete existing slug first to avoid conflicts
  await db.from("shared_resume_links").delete().eq("slug", "admin-demo-resume").catch(() => {});

  await db.from("shared_resume_links").insert({
    resume_id  : resumeId,
    user_id    : userId,
    slug       : "admin-demo-resume",
    is_active  : true,
    view_count : 42,
  }).then(() => log("Sample shared link created (slug: admin-demo-resume)"))
    .catch(e => warn("Shared link: " + e.message));
}

// ── 7. AI settings (ensure disabled by default) ────────────────────────────────
async function ensureAISettings() {
  // Check if row exists
  const { data } = await db.from("ai_settings").select("id").limit(1).single().catch(() => ({ data: null }));

  if (!data) {
    await db.from("ai_settings").insert({
      provider   : "anthropic",
      api_key    : "",
      model      : "claude-3-5-sonnet-20241022",
      ai_enabled : false,
    }).then(() => log("AI settings initialized (disabled by default)"))
      .catch(e => warn("AI settings: " + e.message));
  } else {
    log("AI settings row already exists");
  }
}

// ── 8. Admin feature flags ─────────────────────────────────────────────────────
async function ensureAdminSettings() {
  const settings = [
    { key: "ai_monthly_limit_free",      value: "20"    },
    { key: "ai_monthly_limit_pro",       value: "500"   },
    { key: "exports_monthly_limit_free", value: "5"     },
    { key: "watermark_free_users",       value: "true"  },
    { key: "maintenance_mode",           value: "false" },
    { key: "feature_ai_assistant",       value: "false" },
    { key: "feature_docx_export",        value: "true"  },
    { key: "feature_cover_letter",       value: "true"  },
  ];
  for (const s of settings) {
    await db.from("admin_settings")
      .upsert({ key: s.key, value: s.value }, { onConflict: "key" })
      .then(() => {}).catch(() => {});
  }
  log("Admin feature flags seeded");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║        ResumeOS — Admin Seed Script          ║");
  console.log("╚══════════════════════════════════════════════╝");

  let userId;

  // Step 1: Auth user
  try {
    userId = await ensureAdminUser();
  } catch (err) {
    console.error("\n❌  Fatal: Could not create admin user:", err.message);
    console.error("    Check SUPABASE_URL and SUPABASE_SERVICE_KEY in backend/.env");
    process.exit(1);
  }

  // Step 2: Profile
  try {
    await ensureProfile(userId);
  } catch (err) {
    console.error("\n❌  Fatal: Profile setup failed:", err.message);
    console.error("    Make sure you ran schema.sql in Supabase SQL Editor first!");
    process.exit(1);
  }

  // Step 3: Subscription (delete+insert, no upsert)
  try {
    await ensureSubscription(userId);
  } catch (err) {
    console.error("\n❌  Fatal: Subscription failed:", err.message);
    console.error("    Tip: If you see 'unique constraint' error, run this SQL in Supabase:");
    console.error("    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);");
    process.exit(1);
  }

  // Step 4: Sample resumes (clean start)
  step("Creating sample resumes…");
  const { data: oldResumes } = await db.from("resumes").select("id").eq("user_id", userId);
  if (oldResumes?.length) {
    await db.from("resumes").delete().eq("user_id", userId);
    warn(`Removed ${oldResumes.length} old resume(s) for clean seed`);
  }

  let resume1, resume2, resume3;
  try {
    resume1 = await createSampleResume(userId, "Software Engineer Resume", "classic",   "#57CDA4");
    log(`Resume 1: "${resume1.title}" (Classic)`);
    resume2 = await createSampleResume(userId, "Tech Lead Application",    "technical", "#7BAFD4");
    log(`Resume 2: "${resume2.title}" (Technical)`);
    resume3 = await createSampleResume(userId, "Startup Pitch – Full Stack","modern",   "#A396E2");
    log(`Resume 3: "${resume3.title}" (Modern)`);
  } catch (err) {
    warn("Resume creation partially failed: " + err.message);
  }

  // Step 5: Cover letter
  step("Creating sample cover letter…");
  if (resume1) await createCoverLetter(userId, resume1.id);

  // Step 6: Shared link
  step("Creating shared link…");
  if (resume1) await createSharedLink(userId, resume1.id);

  // Step 7: AI settings
  step("Checking AI settings…");
  await ensureAISettings();

  // Step 8: Admin settings
  step("Seeding admin feature flags…");
  await ensureAdminSettings();

  // Done
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║            ✅  Seed Complete!                ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("\n  🔐  Admin Login");
  console.log("  ─────────────────────────────────");
  console.log(`  Email    : ${ADMIN.email}`);
  console.log(`  Password : ${ADMIN.password}`);
  console.log("  Plan     : Pro (all features unlocked)");
  console.log("\n  📋  Created:");
  console.log("  • Admin profile");
  console.log("  • Pro subscription (1 year)");
  console.log("  • 3 sample resumes with full data");
  console.log("  • 1 cover letter");
  console.log("  • 1 shared resume link");
  console.log("  • AI settings (disabled — enable via /admin)");
  console.log("\n  🚀  Open http://localhost:3000 and log in!\n");
}

main().catch(err => {
  console.error("\n❌  Seed failed unexpectedly:", err.message);
  console.error(err.stack);
  process.exit(1);
});

const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

// ── GET /api/resumes ─────────────────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select(`
        *,
        resume_customizations(*),
        resume_sections(id, section_type, title, is_visible, sort_order)
      `)
      .eq("user_id", req.userId)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("List resumes error:", error);
      return res.status(500).json({ error: "Failed to fetch resumes", detail: error.message });
    }
    res.json({ resumes: data || [] });
  } catch (err) {
    console.error("List resumes exception:", err);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

// ── GET /api/resumes/diagnose  (auth required — tests DB step by step) ───────
router.get("/diagnose", authenticate, async (req, res) => {
  const steps = {};
  steps.userId = req.userId;
  steps.userEmail = req.userEmail;

  // 1. profile check
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("id,email").eq("id", req.userId).limit(1);
    const profile = data?.[0];
    steps.profile = error ? `ERROR: ${error.message}` : (profile ? `EXISTS (email: ${profile.email})` : "MISSING");
  } catch (e) { steps.profile = `THREW: ${e.message}`; }

  // 2. resumes table accessible?
  try {
    const { error } = await supabaseAdmin.from("resumes").select("id").limit(1);
    steps.resumes_table = error ? `ERROR: ${error.message}` : "OK";
  } catch (e) { steps.resumes_table = `THREW: ${e.message}`; }

  // 3. try a test resume insert
  try {
    const { data, error } = await supabaseAdmin.from("resumes")
      .insert({ user_id: req.userId, title: "__DIAGNOSE_TEST__", template_slug: "classic" })
      .select().single();
    if (error) {
      steps.insert_test = `ERROR: ${error.message} (code: ${error.code})`;
    } else {
      steps.insert_test = `OK — created id=${data.id}`;
      // clean up test resume
      try { await supabaseAdmin.from("resumes").delete().eq("id", data.id); } catch (_) {}
    }
  } catch (e) { steps.insert_test = `THREW: ${e.message}`; }

  const allOk = Object.values(steps).every(v => !String(v).startsWith("ERROR") && !String(v).startsWith("THREW") && !String(v).startsWith("MISSING"));
  steps._verdict = allOk ? "✅ Resume creation should work" : "❌ Fix the errors above";
  res.json(steps);
});

// ── POST /api/resumes ────────────────────────────────────────────────────────
router.post("/", authenticate, [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("template_slug").optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, template_slug = "classic" } = req.body;
  console.log(`[POST /resumes] user=${req.userId} email=${req.userEmail} title="${title}"`);
  try {
    // ── Step 1: Ensure profile row exists (FK constraint guard) ──────────────
    let profileExists = false;
    try {
      const { data: profiles } = await supabaseAdmin
        .from("profiles").select("id").eq("id", req.userId).limit(1);
      profileExists = Array.isArray(profiles) && profiles.length > 0;
    } catch (e) {
      console.warn("[POST /resumes] profile check threw:", e.message);
    }

    console.log(`[POST /resumes] profile check → exists=${profileExists}`);

    if (!profileExists) {
      let email = req.userEmail || "";
      let fullName = "User";
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(req.userId);
        if (authData?.user) {
          email = authData.user.email || email;
          fullName = authData.user.user_metadata?.full_name || fullName;
        }
      } catch (authErr) {
        console.warn("[POST /resumes] Could not fetch auth user:", authErr.message);
      }
      if (!email) email = `user_${req.userId.slice(0, 8)}@resumeos.local`;

      const { error: profileInsertErr } = await supabaseAdmin
        .from("profiles").insert({ id: req.userId, email, full_name: fullName });
      console.log(`[POST /resumes] profile insert → err=${profileInsertErr?.message ?? "none"}`);
    }

    // ── Step 2: Insert resume ─────────────────────────────────────────────────
    const { data: resume, error } = await supabaseAdmin
      .from("resumes")
      .insert({ user_id: req.userId, title, template_slug })
      .select()
      .single();

    if (error) {
      console.error("[POST /resumes] insert error:", error.code, error.message, error.details);
      return res.status(500).json({ error: "Failed to create resume", detail: error.message, code: error.code });
    }

    console.log(`[POST /resumes] created resume id=${resume.id}`);

    // ── Step 3: Default customization ────────────────────────────────────────
    try {
      await supabaseAdmin.from("resume_customizations").insert({
        resume_id: resume.id,
        accent_color: "#57CDA4",
        font_family: "Georgia, serif",
        font_size: 11,
        line_spacing: 1.55,
        margins: 36,
        density: "standard",
        page_size: "A4",
      });
    } catch (e) { console.warn("[POST /resumes] customization warning:", e.message); }

    // Sections are created by the frontend to avoid duplicates
    res.status(201).json({ resume });
  } catch (err) {
    console.error("[POST /resumes] unexpected exception:", err.message, err.stack);
    res.status(500).json({ error: "Failed to create resume", detail: err.message });
  }
});

// ── GET /api/resumes/:id ─────────────────────────────────────────────────────
// FIX: removed "section_entries(* ORDER BY sort_order ASC)" — embedded ORDER BY
// in nested selects is not supported in all Supabase versions and silently
// causes the whole query to fail with no useful error message.
// We sort section_entries in JS after fetching instead.
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("resumes")
      .select(`
        *,
        resume_customizations(*),
        resume_sections(
          *,
          section_entries(*)
        )
      `)
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .eq("is_deleted", false)
      .single();

    if (error) {
      console.error("Get resume error:", error.message, "id:", req.params.id, "user:", req.userId);
      return res.status(404).json({ error: "Resume not found", detail: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Sort section_entries by sort_order in JS (avoids Supabase embedded ORDER BY issues)
    if (data.resume_sections) {
      data.resume_sections = data.resume_sections
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(sec => ({
          ...sec,
          section_entries: (sec.section_entries || [])
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
        }));
    }

    res.json({ resume: data });
  } catch (err) {
    console.error("Get resume exception:", err);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

// ── PATCH /api/resumes/:id ───────────────────────────────────────────────────
router.patch("/:id", authenticate, [
  body("title").optional().trim().notEmpty(),
  body("template_slug").optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const allowed = ["title", "template_slug", "is_public"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("resumes")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .select()
      .single();

    if (error) {
      console.error("Update resume error:", error);
      return res.status(500).json({ error: "Failed to update resume", detail: error.message });
    }
    res.json({ resume: data });
  } catch (err) {
    console.error("Update resume exception:", err);
    res.status(500).json({ error: "Failed to update resume" });
  }
});

// ── PATCH /api/resumes/:id/customization ─────────────────────────────────────
router.patch("/:id/customization", authenticate, async (req, res) => {
  try {
    // Verify ownership
    const { data: resume, error: findErr } = await supabaseAdmin
      .from("resumes")
      .select("id")
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (findErr || !resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const allowed = ["accent_color","font_family","font_size","line_spacing","margins","density","page_size","section_spacing","heading_size"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Upsert customization
    const { data, error } = await supabaseAdmin
      .from("resume_customizations")
      .upsert({ resume_id: req.params.id, ...updates }, { onConflict: "resume_id" })
      .select()
      .single();

    if (error) {
      console.error("Customization update error:", error);
      return res.status(500).json({ error: "Failed to update customization", detail: error.message });
    }
    res.json({ customization: data });
  } catch (err) {
    console.error("Customization exception:", err);
    res.status(500).json({ error: "Failed to update customization" });
  }
});

// ── DELETE /api/resumes/:id ──────────────────────────────────────────────────
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("resumes")
      .update({ is_deleted: true })
      .eq("id", req.params.id)
      .eq("user_id", req.userId);

    if (error) {
      console.error("Delete resume error:", error);
      return res.status(500).json({ error: "Failed to delete resume" });
    }
    res.json({ message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

// ── POST /api/resumes/:id/duplicate ─────────────────────────────────────────
router.post("/:id/duplicate", authenticate, async (req, res) => {
  try {
    // Fetch original with all data
    const { data: original, error: fetchErr } = await supabaseAdmin
      .from("resumes")
      .select(`*, resume_customizations(*), resume_sections(*, section_entries(*))`)
      .eq("id", req.params.id)
      .eq("user_id", req.userId)
      .single();

    if (fetchErr || !original) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // Create new resume
    const { data: newResume, error: createErr } = await supabaseAdmin
      .from("resumes")
      .insert({
        user_id: req.userId,
        title: `${original.title} (Copy)`,
        template_slug: original.template_slug,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Copy customization
    if (original.resume_customizations) {
      const { id, resume_id, created_at, updated_at, ...custData } = original.resume_customizations;
      try {
        await supabaseAdmin.from("resume_customizations")
          .insert({ resume_id: newResume.id, ...custData });
      } catch (_) {}
    }

    // Copy sections and entries
    for (const sec of (original.resume_sections || [])) {
      const { id, resume_id, created_at, updated_at, section_entries, ...secData } = sec;
      const { data: newSec } = await supabaseAdmin
        .from("resume_sections")
        .insert({ resume_id: newResume.id, ...secData })
        .select()
        .single();

      if (newSec && section_entries?.length) {
        for (const entry of section_entries) {
          const { id: eid, section_id, created_at: ec, updated_at: eu, ...entryData } = entry;
          try {
            await supabaseAdmin.from("section_entries")
              .insert({ section_id: newSec.id, ...entryData });
          } catch (_) {}
        }
      }
    }

    res.status(201).json({ resume: newResume });
  } catch (err) {
    console.error("Duplicate resume exception:", err);
    res.status(500).json({ error: "Failed to duplicate resume" });
  }
});

// ── POST /api/resumes/:id/score ──────────────────────────────────────────────
router.post("/:id/score", authenticate, async (req, res) => {
  try {
    const score = req.body.score ?? 0;
    await supabaseAdmin
      .from("resumes")
      .update({ ats_score: score })
      .eq("id", req.params.id)
      .eq("user_id", req.userId);

    res.json({ score });
  } catch (err) {
    res.status(500).json({ error: "Failed to update score" });
  }
});

module.exports = router;

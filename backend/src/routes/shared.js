// shared.js
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { supabaseAdmin } = require("../db/supabase");
const { authenticate, optionalAuth } = require("../middleware/auth");

// Create shared link
router.post("/:resumeId", authenticate, async (req, res) => {
  const slug = uuidv4().slice(0, 12);
  const { data, error } = await supabaseAdmin.from("shared_resume_links")
    .insert({ resume_id: req.params.resumeId, user_id: req.userId, slug }).select().single();
  if (error) return res.status(500).json({ error: "Failed to create link" });
  res.status(201).json({ link: data, url: `${process.env.FRONTEND_URL}/r/${slug}` });
});

// Get shared resume publicly
router.get("/view/:slug", async (req, res) => {
  const { data: link, error } = await supabaseAdmin
    .from("shared_resume_links").select("*").eq("slug", req.params.slug).eq("is_active", true).single();
  if (error || !link) return res.status(404).json({ error: "Link not found or inactive" });

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date())
    return res.status(410).json({ error: "Link expired" });

  // Increment view count
  await supabaseAdmin.from("shared_resume_links").update({ view_count: link.view_count + 1 }).eq("id", link.id);

  const { data: resume } = await supabaseAdmin.from("resumes")
    .select("*, resume_customizations(*), resume_sections(*, section_entries(*))")
    .eq("id", link.resume_id).single();

  res.json({ resume });
});

// Deactivate link
router.delete("/:id", authenticate, async (req, res) => {
  await supabaseAdmin.from("shared_resume_links")
    .update({ is_active: false }).eq("id", req.params.id).eq("user_id", req.userId);
  res.json({ message: "Link deactivated" });
});

module.exports = router;

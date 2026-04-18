const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("cover_letters").select("*").eq("user_id", req.userId).eq("is_deleted", false).order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch cover letters" });
  res.json({ cover_letters: data });
});

router.post("/", authenticate, [
  body("title").trim().notEmpty(),
  body("job_title").optional().trim(),
  body("company").optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { title, content, job_title, company, resume_id, template_slug } = req.body;
  const { data, error } = await supabaseAdmin
    .from("cover_letters").insert({ user_id: req.userId, title, content, job_title, company, resume_id, template_slug }).select().single();
  if (error) return res.status(500).json({ error: "Failed to create cover letter" });
  res.status(201).json({ cover_letter: data });
});

router.patch("/:id", authenticate, async (req, res) => {
  const allowed = ["title","content","job_title","company","template_slug"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  const { data, error } = await supabaseAdmin
    .from("cover_letters").update(updates).eq("id", req.params.id).eq("user_id", req.userId).select().single();
  if (error) return res.status(500).json({ error: "Failed to update" });
  res.json({ cover_letter: data });
});

router.delete("/:id", authenticate, async (req, res) => {
  await supabaseAdmin.from("cover_letters").update({ is_deleted: true }).eq("id", req.params.id).eq("user_id", req.userId);
  res.json({ message: "Deleted" });
});

module.exports = router;

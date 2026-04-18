const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles").select("*").eq("id", req.userId).single();
  if (error) return res.status(500).json({ error: "Failed to fetch profile" });
  res.json({ profile: data });
});

router.patch("/", authenticate, [
  body("full_name").optional().trim().notEmpty(),
  body("job_title").optional().trim(),
  body("location").optional().trim(),
  body("phone").optional().trim(),
  body("linkedin_url").optional().trim(),
  body("website_url").optional().trim(),
  body("bio").optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const allowed = ["full_name","job_title","location","phone","linkedin_url","website_url","github_url","bio","avatar_url"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const { data, error } = await supabaseAdmin
    .from("profiles").update(updates).eq("id", req.userId).select().single();
  if (error) return res.status(500).json({ error: "Failed to update profile" });
  res.json({ profile: data });
});

module.exports = router;

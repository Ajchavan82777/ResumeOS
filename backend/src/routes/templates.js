// templates.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db/supabase");

router.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("templates").select("*").eq("is_active", true).order("sort_order");
  if (error) return res.status(500).json({ error: "Failed to fetch templates" });
  res.json({ templates: data });
});

router.get("/:slug", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("templates").select("*").eq("slug", req.params.slug).single();
  if (error || !data) return res.status(404).json({ error: "Template not found" });
  res.json({ template: data });
});

module.exports = router;

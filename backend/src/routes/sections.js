const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

const ownsResume = async (userId, resumeId) => {
  const { data } = await supabaseAdmin.from("resumes").select("id")
    .eq("id", resumeId).eq("user_id", userId).single();
  return !!data;
};

// ── GET /api/resumes/:resumeId/sections ────────────────────
router.get("/:resumeId/sections", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .select("*, section_entries(*)")
    .eq("resume_id", req.params.resumeId)
    .order("sort_order", { ascending: true });

  if (error) return res.status(500).json({ error: "Failed to fetch sections" });
  res.json({ sections: data });
});

// ── POST /api/resumes/:resumeId/sections ───────────────────
router.post("/:resumeId/sections", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { section_type, title, data: sData = {}, sort_order = 999 } = req.body;
  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .insert({ resume_id: req.params.resumeId, section_type, title, data: sData, sort_order })
    .select().single();

  if (error) return res.status(500).json({ error: "Failed to create section" });
  res.status(201).json({ section: data });
});

// ── PATCH /api/resumes/:resumeId/sections/:id ──────────────
router.patch("/:resumeId/sections/:id", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const allowed = ["title", "is_visible", "is_locked", "sort_order", "data"];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .update(updates)
    .eq("id", req.params.id)
    .eq("resume_id", req.params.resumeId)
    .select().single();

  if (error) return res.status(500).json({ error: "Failed to update section" });
  res.json({ section: data });
});

// ── DELETE /api/resumes/:resumeId/sections/:id ─────────────
router.delete("/:resumeId/sections/:id", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { error } = await supabaseAdmin
    .from("resume_sections")
    .delete()
    .eq("id", req.params.id)
    .eq("resume_id", req.params.resumeId);

  if (error) return res.status(500).json({ error: "Failed to delete section" });
  res.json({ message: "Section deleted" });
});

// ── PUT /api/resumes/:resumeId/sections/reorder ────────────
router.put("/:resumeId/sections/reorder", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { order } = req.body; // Array of { id, sort_order }
  try {
    await Promise.all(order.map(({ id, sort_order }) =>
      supabaseAdmin.from("resume_sections").update({ sort_order }).eq("id", id)
    ));
    res.json({ message: "Sections reordered" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reorder sections" });
  }
});

// ── ENTRIES ────────────────────────────────────────────────

// POST /api/resumes/:resumeId/sections/:sectionId/entries
router.post("/:resumeId/sections/:sectionId/entries", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { data: entryData, sort_order = 999 } = req.body;
  const { data, error } = await supabaseAdmin
    .from("section_entries")
    .insert({ section_id: req.params.sectionId, data: entryData, sort_order })
    .select().single();

  if (error) return res.status(500).json({ error: "Failed to create entry" });
  res.status(201).json({ entry: data });
});

// PATCH /api/resumes/:resumeId/sections/:sectionId/entries/:id
router.patch("/:resumeId/sections/:sectionId/entries/:id", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { data, error } = await supabaseAdmin
    .from("section_entries")
    .update({ data: req.body.data, sort_order: req.body.sort_order })
    .eq("id", req.params.id)
    .eq("section_id", req.params.sectionId)
    .select().single();

  if (error) return res.status(500).json({ error: "Failed to update entry" });
  res.json({ entry: data });
});

// DELETE /api/resumes/:resumeId/sections/:sectionId/entries/:id
router.delete("/:resumeId/sections/:sectionId/entries/:id", authenticate, async (req, res) => {
  if (!await ownsResume(req.userId, req.params.resumeId))
    return res.status(403).json({ error: "Access denied" });

  const { error } = await supabaseAdmin
    .from("section_entries")
    .delete()
    .eq("id", req.params.id)
    .eq("section_id", req.params.sectionId);

  if (error) return res.status(500).json({ error: "Failed to delete entry" });
  res.json({ message: "Entry deleted" });
});

module.exports = router;

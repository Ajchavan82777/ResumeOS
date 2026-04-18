const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("subscriptions").select("*").eq("user_id", req.userId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch subscription" });
  res.json({ subscriptions: data });
});

// Upgrade plan (stub — integrate Stripe in production)
router.post("/upgrade", authenticate, async (req, res) => {
  const { plan } = req.body;
  if (!["pro","enterprise"].includes(plan))
    return res.status(400).json({ error: "Invalid plan" });

  const { data, error } = await supabaseAdmin.from("subscriptions")
    .upsert({ user_id: req.userId, plan, status: "active", current_period_start: new Date().toISOString() }, { onConflict: "user_id" })
    .select().single();

  if (error) return res.status(500).json({ error: "Failed to upgrade" });
  res.json({ subscription: data, message: "Upgraded successfully" });
});

module.exports = router;

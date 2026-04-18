const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { supabase, supabaseAdmin } = require("../db/supabase");
const { authenticate } = require("../middleware/auth");

// ── POST /api/auth/register ────────────────────────────────
router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, full_name } = req.body;
  try {
    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Create profile record
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name,
    });

    // Create free subscription
    await supabaseAdmin.from("subscriptions").insert({
      user_id: data.user.id,
      plan: "free",
      status: "active",
    });

    res.status(201).json({ message: "Account created successfully", user: { id: data.user.id, email } });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    // Use anon client for sign-in — service role client returns session:null
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Login sign-in error:", error.message);
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!data.session) {
      console.error("Login: sign-in succeeded but session is null");
      return res.status(500).json({ error: "Auth session error — check SUPABASE_ANON_KEY in backend/.env" });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles").select("*").eq("id", data.user.id).single();

    if (profileErr) {
      console.warn("Login: profile fetch failed:", profileErr.message, "— schema.sql may not have been run");
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions").select("*").eq("user_id", data.user.id).eq("status", "active").single();

    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { ...data.user, profile: profile ?? null, subscription: subscription ?? null },
    });
  } catch (err) {
    console.error("Login unexpected error:", err);
    res.status(500).json({ error: `Login error: ${err.message}` });
  }
});

// ── POST /api/auth/refresh ─────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "refresh_token required" });
  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error || !data.session) {
      return res.status(401).json({ error: "Session expired — please log in again" });
    }
    res.json({
      access_token:  data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────
router.post("/logout", authenticate, async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ── POST /api/auth/forgot-password ────────────────────────
router.post("/forgot-password", [
  body("email").isEmail().normalizeEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });
    res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────
router.post("/reset-password", [
  body("token").notEmpty(),
  body("password").isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      req.body.user_id,
      { password }
    );
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("*").eq("id", req.userId).single();

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions").select("*").eq("user_id", req.userId).eq("status", "active").single();

    res.json({ user: req.user, profile, subscription });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;

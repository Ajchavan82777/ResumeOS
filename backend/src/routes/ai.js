"use strict";
const express   = require("express");
const router    = express.Router();
const axios     = require("axios");
const { body, validationResult } = require("express-validator");
const { supabaseAdmin }  = require("../db/supabase");
const { authenticate }   = require("../middleware/auth");

// ─────────────────────────────────────────────────────────────────────────────
// AI Settings: read from DB (admin-configured)
// Cached for 60 seconds to avoid hitting DB on every request
// ─────────────────────────────────────────────────────────────────────────────
let _settingsCache = null;
let _settingsCacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function getAISettings() {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheAt < CACHE_TTL_MS) {
    return _settingsCache;
  }
  const { data, error } = await supabaseAdmin
    .from("ai_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return { provider: "anthropic", api_key: "", model: "", ai_enabled: false };
  }
  _settingsCache = data;
  _settingsCacheAt = now;
  return data;
}

// Invalidate cache (called after admin updates settings)
function invalidateSettingsCache() {
  _settingsCache = null;
  _settingsCacheAt = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified AI call — supports Anthropic, OpenAI, OpenRouter
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt, maxTokens = 800) {
  const s = await getAISettings();

  if (!s.ai_enabled) {
    const err = new Error("AI features are currently disabled by the administrator.");
    err.code = "AI_DISABLED";
    throw err;
  }
  if (!s.api_key || s.api_key.trim().length < 10) {
    const err = new Error("No AI API key configured. Please contact your administrator.");
    err.code = "NO_API_KEY";
    throw err;
  }

  const provider = s.provider || "anthropic";
  const model    = s.model    || defaultModel(provider);
  const key      = s.api_key.trim();

  if (provider === "anthropic") {
    return callAnthropic(key, model, prompt, maxTokens);
  } else if (provider === "openai") {
    return callOpenAI(key, model, prompt, maxTokens, "https://api.openai.com/v1");
  } else if (provider === "openrouter") {
    return callOpenAI(key, model, prompt, maxTokens, "https://openrouter.ai/api/v1");
  } else {
    throw new Error(`Unknown AI provider: ${provider}`);
  }
}

function defaultModel(provider) {
  if (provider === "openai")      return "gpt-4o-mini";
  if (provider === "openrouter")  return "openai/gpt-4o-mini";
  return "claude-3-5-sonnet-20241022";
}

async function callAnthropic(apiKey, model, prompt, maxTokens) {
  // Use raw HTTP instead of the SDK to avoid version issues
  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 30_000,
    }
  );
  const text   = response.data.content?.[0]?.text || "";
  const tokens = (response.data.usage?.input_tokens || 0) + (response.data.usage?.output_tokens || 0);
  return { text, tokens, model };
}

async function callOpenAI(apiKey, model, prompt, maxTokens, baseURL) {
  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      timeout: 30_000,
    }
  );
  const text   = response.data.choices?.[0]?.message?.content || "";
  const tokens = (response.data.usage?.total_tokens || 0);
  return { text, tokens, model };
}

// Log AI usage
async function logUsage(userId, resumeId, feature, tokens, model) {
  const s = await getAISettings().catch(() => ({}));
  await supabaseAdmin.from("ai_usage_logs")
    .insert({
      user_id: userId,
      resume_id: resumeId || null,
      feature,
      provider: s.provider || "anthropic",
      model: model || s.model || "",
      tokens_used: tokens,
    })
    .then(() => {}).catch(() => {});
}

// Standard error handler for AI routes
function handleAIError(err, res) {
  console.error("AI error:", err.message);
  if (err.code === "AI_DISABLED") {
    return res.status(503).json({ error: err.message, disabled: true });
  }
  if (err.code === "NO_API_KEY") {
    return res.status(503).json({ error: err.message, no_key: true });
  }
  if (err.response?.status === 401) {
    return res.status(503).json({ error: "AI API key is invalid. Please check settings.", invalid_key: true });
  }
  if (err.response?.status === 429) {
    return res.status(429).json({ error: "AI rate limit reached. Please try again later." });
  }
  return res.status(500).json({ error: "AI request failed: " + err.message });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/status  — frontend uses this to decide whether to show AI UI
// ─────────────────────────────────────────────────────────────────────────────
router.get("/status", authenticate, async (req, res) => {
  try {
    const s = await getAISettings();
    res.json({
      enabled:   s.ai_enabled && !!s.api_key,
      provider:  s.provider,
      model:     s.model,
      has_key:   !!s.api_key,
      message:   !s.ai_enabled
        ? "AI features are disabled by the administrator."
        : !s.api_key
        ? "AI API key not configured. Contact your administrator."
        : `AI active (${s.provider} / ${s.model})`,
    });
  } catch (err) {
    res.json({ enabled: false, message: "Could not load AI settings." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/ai/admin/settings  — read full settings (admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/settings", authenticate, async (req, res) => {
  // Verify admin
  if (req.userEmail !== "admin@resumeos.com" && !req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  try {
    const s = await getAISettings();
    // Mask API key: show only last 6 chars
    const masked = s.api_key
      ? "•".repeat(Math.max(0, s.api_key.length - 6)) + s.api_key.slice(-6)
      : "";
    res.json({
      settings: {
        ...s,
        api_key_masked: masked,
        api_key:        "",  // never return plaintext key over API
        has_key:        !!s.api_key,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PATCH /api/ai/admin/settings  — update provider / key / model / toggle
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/admin/settings", authenticate, [
  body("provider").optional().isIn(["anthropic", "openai", "openrouter"]),
  body("model").optional().isString().trim(),
  body("ai_enabled").optional().isBoolean(),
  body("api_key").optional().isString().trim(),
], async (req, res) => {
  if (req.userEmail !== "admin@resumeos.com" && !req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const updates = {};
    const { provider, model, ai_enabled, api_key } = req.body;

    if (provider    !== undefined) updates.provider   = provider;
    if (model       !== undefined) updates.model      = model;
    if (ai_enabled  !== undefined) updates.ai_enabled = ai_enabled;

    // Only update key if a non-empty value was sent (don't wipe key when just toggling)
    if (api_key !== undefined && api_key.trim().length > 0) {
      updates.api_key = api_key.trim();
    }

    // Ensure row exists (upsert)
    const existing = await supabaseAdmin.from("ai_settings").select("id").limit(1).single();
    let result;
    if (existing.data?.id) {
      const { data, error } = await supabaseAdmin
        .from("ai_settings")
        .update(updates)
        .eq("id", existing.data.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("ai_settings")
        .insert({ provider: "anthropic", model: "claude-3-5-sonnet-20241022", ai_enabled: false, api_key: "", ...updates })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    invalidateSettingsCache();

    res.json({
      success: true,
      settings: {
        ...result,
        api_key:        "",            // never return plaintext
        api_key_masked: result.api_key
          ? "•".repeat(Math.max(0, result.api_key.length - 6)) + result.api_key.slice(-6)
          : "",
        has_key: !!result.api_key,
      },
    });
  } catch (err) {
    console.error("AI settings update error:", err.message);
    res.status(500).json({ error: "Failed to update settings: " + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: POST /api/ai/admin/test  — test the configured API key
// ─────────────────────────────────────────────────────────────────────────────
router.post("/admin/test", authenticate, async (req, res) => {
  if (req.userEmail !== "admin@resumeos.com" && !req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  try {
    const { text, model } = await callAI("Say 'API connection successful!' in exactly 4 words.", 30);
    res.json({ success: true, response: text.trim(), model });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/ai/admin/usage  — usage stats
// ─────────────────────────────────────────────────────────────────────────────
router.get("/admin/usage", authenticate, async (req, res) => {
  if (req.userEmail !== "admin@resumeos.com" && !req.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  try {
    const { data: logs } = await supabaseAdmin
      .from("ai_usage_logs")
      .select("feature, tokens_used, provider, model, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(100);

    const totalTokens = (logs || []).reduce((s, l) => s + (l.tokens_used || 0), 0);
    const totalCalls  = (logs || []).length;

    res.json({
      logs:         logs || [],
      total_calls:  totalCalls,
      total_tokens: totalTokens,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch usage logs" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AI FEATURE ROUTES (all use callAI which reads settings from DB)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/ai/generate-summary
router.post("/generate-summary", authenticate, [
  body("job_title").trim().notEmpty().withMessage("job_title required"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { job_title, experience_years = 5, skills = [], resume_id } = req.body;
  try {
    const prompt = `Write a professional resume summary for a ${job_title} with ${experience_years}+ years of experience.
${skills.length ? `Key skills: ${skills.join(", ")}.` : ""}
Requirements:
- 3-4 sentences, 60-90 words
- ATS-friendly with relevant keywords
- Strong action verbs, no first-person "I"
- Quantifiable achievements where possible
Return ONLY the summary text, no preamble or explanation.`;

    const { text, tokens, model } = await callAI(prompt, 600);
    logUsage(req.userId, resume_id, "generate_summary", tokens, model);
    res.json({ summary: text.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
});

// POST /api/ai/improve-bullets
router.post("/improve-bullets", authenticate, [
  body("bullets").isArray().notEmpty(),
  body("job_title").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { bullets, job_title, resume_id } = req.body;
  try {
    const prompt = `Improve these resume bullet points for a ${job_title} position.

Original bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Rules:
- Start each with a strong action verb (Led, Built, Drove, Increased, Reduced, etc.)
- Add quantifiable metrics where missing (%, $, X times, number of people)
- Keep each bullet to 1-2 lines max
- Make them ATS-keyword rich
- Return EXACTLY ${bullets.length} improved bullets, numbered 1-${bullets.length}
- No extra explanation, just the numbered bullets`;

    const { text, tokens, model } = await callAI(prompt, 800);
    logUsage(req.userId, resume_id, "improve_bullets", tokens, model);

    const improved = text
      .split("\n")
      .filter(l => /^\d+[\.\)]\s/.test(l.trim()))
      .map(l => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter(Boolean);

    res.json({ bullets: improved.length ? improved : bullets });
  } catch (err) {
    handleAIError(err, res);
  }
});

// POST /api/ai/suggest-skills
router.post("/suggest-skills", authenticate, [
  body("job_title").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { job_title, existing_skills = [], resume_id } = req.body;
  try {
    const prompt = `List 15 in-demand skills for a ${job_title} in 2025.
${existing_skills.length ? `Exclude these (already listed): ${existing_skills.join(", ")}.` : ""}
Return ONLY a JSON array of strings, no explanation. Example: ["Skill 1", "Skill 2"]`;

    const { text, tokens, model } = await callAI(prompt, 400);
    logUsage(req.userId, resume_id, "suggest_skills", tokens, model);

    let skills;
    try {
      const match = text.match(/\[[\s\S]*?\]/);
      skills = match ? JSON.parse(match[0]) : [];
    } catch {
      skills = text.split(",").map(s => s.replace(/["'\[\]]/g, "").trim()).filter(Boolean);
    }
    res.json({ skills });
  } catch (err) {
    handleAIError(err, res);
  }
});

// POST /api/ai/keyword-match
router.post("/keyword-match", authenticate, [
  body("job_description").trim().notEmpty(),
  body("resume_text").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { job_description, resume_text, resume_id } = req.body;
  try {
    const prompt = `Analyze this job description and resume for ATS keyword matching.

JOB DESCRIPTION:
${job_description.slice(0, 2000)}

RESUME TEXT:
${resume_text.slice(0, 2000)}

Return a JSON object (no markdown, no backticks) with:
{
  "match_percentage": <number 0-100>,
  "found_keywords": ["keyword1", ...],
  "missing_keywords": ["keyword1", ...],
  "recommendations": ["action item 1", ...]
}`;

    const { text, tokens, model } = await callAI(prompt, 800);
    logUsage(req.userId, resume_id, "keyword_match", tokens, model);

    let result;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : {};
    } catch {
      result = { match_percentage: 0, found_keywords: [], missing_keywords: [], recommendations: [] };
    }
    res.json(result);
  } catch (err) {
    handleAIError(err, res);
  }
});

// POST /api/ai/tailor-resume
router.post("/tailor-resume", authenticate, [
  body("job_description").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { job_description, summary, resume_id } = req.body;
  try {
    const prompt = `Tailor this resume summary for the job below.

JOB DESCRIPTION:
${job_description.slice(0, 1500)}

CURRENT SUMMARY:
${summary || "No summary yet — write one from scratch"}

Write a tailored 3-4 sentence summary that:
- Uses keywords directly from the job description
- Highlights the most relevant experience and skills
- Is ATS-optimized with strong action verbs
Return ONLY the summary text.`;

    const { text, tokens, model } = await callAI(prompt, 600);
    logUsage(req.userId, resume_id, "tailor_resume", tokens, model);
    res.json({ tailored_summary: text.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
});

// POST /api/ai/generate-cover-letter
router.post("/generate-cover-letter", authenticate, [
  body("job_title").trim().notEmpty(),
  body("company").trim().notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { job_title, company, job_description, applicant_name, key_skills = [] } = req.body;
  try {
    const prompt = `Write a professional cover letter for:
Position: ${job_title} at ${company}
Applicant: ${applicant_name || "the applicant"}
${job_description ? `Job Description: ${job_description.slice(0, 1000)}` : ""}
${key_skills.length ? `Key skills: ${key_skills.join(", ")}` : ""}

Write a compelling 3-paragraph cover letter body (no date, address, or signature):
1. Opening: Express enthusiasm, reference the role
2. Middle: Highlight 2-3 relevant achievements with metrics
3. Closing: Call to action

Keep it 250-350 words, professional tone, ATS-friendly.
Return ONLY the letter body.`;

    const { text, tokens, model } = await callAI(prompt, 1000);
    logUsage(req.userId, null, "cover_letter", tokens, model);
    res.json({ cover_letter: text.trim() });
  } catch (err) {
    handleAIError(err, res);
  }
});

module.exports = router;
module.exports.invalidateSettingsCache = invalidateSettingsCache;

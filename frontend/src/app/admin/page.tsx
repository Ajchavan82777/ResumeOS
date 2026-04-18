"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, FileText, BarChart2, Settings, Shield,
  Zap, RefreshCw, Eye, Trash2, ToggleLeft, ToggleRight,
  Download, Key, CheckCircle, XCircle, Loader, Copy,
  AlertTriangle, Layout, Plus, X
} from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import toast from "react-hot-toast";

const ADMIN_EMAIL = "admin@resumeos.com";

// ── Subcomponents ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}

type TabId = "overview" | "ai" | "users" | "exports" | "templates" | "settings";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",    icon: BarChart2 },
  { id: "ai",         label: "AI Settings", icon: Zap       },
  { id: "users",      label: "Users",       icon: Users     },
  { id: "exports",    label: "Exports",     icon: Download  },
  { id: "templates",  label: "Templates",   icon: Layout    },
  { id: "settings",   label: "App Settings",icon: Settings  },
];

const MASTER_TEMPLATES = [
  { slug: "two-column-dark", name: "Two-Column Pro", layout: "two-column", color: "#3B6FD4", desc: "Dark sidebar with main content" },
  { slug: "corporate",       name: "Corporate",       layout: "single",     color: "#2C4A7C", desc: "Centered classic style with dividers" },
  { slug: "sidebar-modern",  name: "Sidebar Modern",  layout: "sidebar",    color: "#3B82F6", desc: "Light sidebar with skill chips" },
];

const PROVIDERS = [
  {
    value: "anthropic",
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-…",
    models: [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
    ],
    link: "https://console.anthropic.com/settings/keys",
    hint: "Get your key from console.anthropic.com",
  },
  {
    value: "openai",
    label: "OpenAI (ChatGPT)",
    placeholder: "sk-…",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
    ],
    link: "https://platform.openai.com/api-keys",
    hint: "Get your key from platform.openai.com",
  },
  {
    value: "openrouter",
    label: "OpenRouter (Multi-model)",
    placeholder: "sk-or-…",
    models: [
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3-haiku",
      "google/gemini-pro-1.5",
      "meta-llama/llama-3.1-8b-instruct",
    ],
    link: "https://openrouter.ai/keys",
    hint: "Get your key from openrouter.ai — access 100+ models",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AI Settings Tab
// ─────────────────────────────────────────────────────────────────────────────
function AISettingsTab() {
  const [settings, setSettings]       = useState<any>(null);
  const [loading,  setLoading]        = useState(true);
  const [saving,   setSaving]         = useState(false);
  const [testing,  setTesting]        = useState(false);
  const [testResult, setTestResult]   = useState<any>(null);

  const [form, setForm] = useState({
    provider:   "anthropic",
    api_key:    "",
    model:      "claude-3-5-sonnet-20241022",
    ai_enabled: false,
  });

  const [showKey, setShowKey] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ai/admin/settings");
      const s = data.settings;
      setSettings(s);
      setForm({
        provider:   s.provider   || "anthropic",
        api_key:    "",            // never pre-fill the key
        model:      s.model      || "claude-3-5-sonnet-20241022",
        ai_enabled: s.ai_enabled || false,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currentProvider = PROVIDERS.find(p => p.value === form.provider) || PROVIDERS[0];

  const handleProviderChange = (v: string) => {
    const prov = PROVIDERS.find(p => p.value === v)!;
    setForm(f => ({ ...f, provider: v, model: prov.models[0] }));
    setTestResult(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        provider:   form.provider,
        model:      form.model,
        ai_enabled: form.ai_enabled,
      };
      // Only send key if user typed something
      if (form.api_key.trim()) payload.api_key = form.api_key.trim();

      const { data } = await api.patch("/ai/admin/settings", payload);
      setSettings(data.settings);
      setForm(f => ({ ...f, api_key: "" })); // clear key input after save
      toast.success("AI settings saved!");
      setTestResult(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post("/ai/admin/test");
      setTestResult(data);
      if (data.success) {
        toast.success(`Connection successful! Model: ${data.model}`);
      } else {
        toast.error("Connection failed: " + data.error);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err?.response?.data?.error || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const toggleAI = async () => {
    const newVal = !form.ai_enabled;
    setForm(f => ({ ...f, ai_enabled: newVal }));
    try {
      await api.patch("/ai/admin/settings", { ai_enabled: newVal });
      toast.success(`AI features ${newVal ? "enabled" : "disabled"} for all users`);
    } catch {
      setForm(f => ({ ...f, ai_enabled: !newVal }));
      toast.error("Failed to toggle AI");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-400">
        <Loader size={16} className="animate-spin" /> Loading AI settings…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5">

      {/* ── Left: Configuration ── */}
      <div className="space-y-4">

        {/* Master Toggle */}
        <div className={`rounded-2xl border-2 p-5 ${form.ai_enabled ? "border-teal-300 bg-teal-50" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900">AI Features</div>
              <div className="text-sm text-gray-500">
                {form.ai_enabled
                  ? "Active — users can use AI tools"
                  : "Disabled — AI panel hidden from all users"}
              </div>
            </div>
            <button
              onClick={toggleAI}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                form.ai_enabled
                  ? "bg-teal-500 text-white hover:bg-teal-600"
                  : "bg-gray-200 text-gray-500 hover:bg-gray-300"
              }`}>
              {form.ai_enabled ? <><ToggleRight size={16} /> Enabled</> : <><ToggleLeft size={16} /> Disabled</>}
            </button>
          </div>
          {!settings?.has_key && form.ai_enabled && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-700">
              <AlertTriangle size={13} />
              AI is enabled but no API key is configured. Add a key below.
            </div>
          )}
        </div>

        {/* Provider Selection */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 font-semibold text-gray-900 flex items-center gap-2"><Key size={15} /> API Configuration</div>

          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">AI Provider</label>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.value}
                onClick={() => handleProviderChange(p.value)}
                className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold transition ${
                  form.provider === p.value
                    ? "border-teal-400 bg-teal-50 text-teal-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {p.label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Provider info */}
          <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-700">
            <strong>{currentProvider.label}</strong> — {currentProvider.hint}{" "}
            <a href={currentProvider.link} target="_blank" rel="noreferrer" className="underline hover:text-blue-900">
              Get API Key →
            </a>
          </div>

          {/* Model */}
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Model</label>
          <select
            value={form.model}
            onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
            className="mb-4 w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-teal-400">
            {currentProvider.models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* API Key */}
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            API Key{settings?.has_key ? " (key is saved — enter new key to replace)" : " (required)"}
          </label>
          <div className="mb-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? "text" : "password"}
                value={form.api_key}
                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                placeholder={settings?.has_key
                  ? `Current: ${settings.api_key_masked || "••••••••••••"}`
                  : currentProvider.placeholder}
                className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm font-mono outline-none focus:border-teal-400 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye size={14} />
              </button>
            </div>
          </div>
          {settings?.has_key && (
            <p className="mb-3 text-[11px] text-green-600">
              ✓ Key saved: {settings.api_key_masked}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-xl bg-teal-500 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60">
              {saving ? "Saving…" : "Save Settings"}
            </button>
            <button
              onClick={testConnection}
              disabled={testing || !settings?.has_key}
              title={!settings?.has_key ? "Save an API key first" : "Test the connection"}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-teal-400 hover:text-teal-600 disabled:opacity-50">
              {testing ? <Loader size={14} className="animate-spin" /> : "Test"}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-3 flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
              testResult.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {testResult.success
                ? <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
                : <XCircle size={15} className="mt-0.5 flex-shrink-0" />}
              <div>
                {testResult.success
                  ? <><strong>Connection successful!</strong><br />{testResult.response} <span className="text-xs opacity-70">(via {testResult.model})</span></>
                  : <><strong>Connection failed</strong><br />{testResult.error}</>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Status & Usage ── */}
      <div className="space-y-4">

        {/* Current Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 font-semibold text-gray-900">Current Status</div>
          <div className="space-y-3">
            <StatusRow label="AI Enabled" value={settings?.ai_enabled ? "Yes" : "No"} ok={settings?.ai_enabled} />
            <StatusRow label="API Key"    value={settings?.has_key ? `Saved (${settings.api_key_masked})` : "Not set"} ok={settings?.has_key} />
            <StatusRow label="Provider"   value={PROVIDERS.find(p => p.value === settings?.provider)?.label || settings?.provider || "—"} neutral />
            <StatusRow label="Model"      value={settings?.model || "—"} neutral />
          </div>
        </div>

        {/* Quick Guide */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 font-semibold text-gray-900">Quick Setup Guide</div>
          <ol className="space-y-2.5 text-sm text-gray-600">
            {[
              ["Choose a provider", "Anthropic (Claude), OpenAI (ChatGPT), or OpenRouter (100+ models)"],
              ["Get an API key", "Click the link above to get a key from your chosen provider"],
              ["Select a model", "Pick a model — gpt-4o-mini and claude-3-5-haiku are fast & affordable"],
              ["Paste & Save", "Paste your API key and click Save Settings"],
              ["Test connection", "Click Test to verify the key works"],
              ["Enable AI", "Toggle AI Features ON to activate it for all users"],
            ].map(([step, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{i + 1}</span>
                <div><strong className="text-gray-800">{step}</strong> — {desc}</div>
              </li>
            ))}
          </ol>
        </div>

        {/* Cost Guide */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 font-semibold text-gray-900">Approximate API Costs</div>
          <div className="space-y-2 text-xs text-gray-500">
            {[
              ["claude-3-5-haiku",   "$0.0008", "per 1K tokens", "Fastest / cheapest"],
              ["gpt-4o-mini",        "$0.0006", "per 1K tokens", "OpenAI fast option"],
              ["claude-3-5-sonnet",  "$0.003",  "per 1K tokens", "Best quality / recommended"],
              ["gpt-4o",             "$0.005",  "per 1K tokens", "Highest quality OpenAI"],
            ].map(([model, price, unit, note]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="font-mono">{model}</span>
                <span><strong className="text-gray-700">{price}</strong> {unit}</span>
                <span className="text-gray-400 italic">{note}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">Each AI action uses ~300-800 tokens on average.</p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok, neutral }: { label: string; value: string; ok?: boolean; neutral?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`flex items-center gap-1.5 text-sm font-medium ${
        neutral ? "text-gray-700" : ok ? "text-green-600" : "text-red-500"
      }`}>
        {!neutral && (ok ? <CheckCircle size={13} /> : <XCircle size={13} />)}
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Admin Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Templates management
  const getCustomTemplates = () => {
    try { return JSON.parse(localStorage.getItem("resumeos_custom_templates") || "[]"); } catch { return []; }
  };
  const [customTemplates, setCustomTemplates] = useState<any[]>(getCustomTemplates);
  const [newTpl, setNewTpl] = useState({ name: "", layout: "single", color: "#57CDA4", desc: "" });
  const [showNewTplForm, setShowNewTplForm] = useState(false);

  const saveCustomTemplate = () => {
    if (!newTpl.name.trim()) { toast.error("Template name required"); return; }
    const slug = "custom-" + newTpl.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const tpl = { slug, name: newTpl.name, layout: newTpl.layout, color: newTpl.color, desc: newTpl.desc, tag: "Custom" };
    const updated = [...customTemplates, tpl];
    setCustomTemplates(updated);
    localStorage.setItem("resumeos_custom_templates", JSON.stringify(updated));
    setNewTpl({ name: "", layout: "single", color: "#57CDA4", desc: "" });
    setShowNewTplForm(false);
    toast.success(`Template "${tpl.name}" created!`);
  };

  const deleteCustomTemplate = (slug: string) => {
    const updated = customTemplates.filter((t: any) => t.slug !== slug);
    setCustomTemplates(updated);
    localStorage.setItem("resumeos_custom_templates", JSON.stringify(updated));
    toast.success("Template deleted");
  };

  // Simulated analytics
  const stats = [
    { label: "Total Users",     value: "1,284", icon: Users,    color: "text-teal-600",   bg: "bg-teal-50"   },
    { label: "Total Resumes",   value: "4,921", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "PDF Exports",     value: "8,732", icon: Download, color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "AI Calls Today",  value: "—",     icon: Zap,      color: "text-pink-600",   bg: "bg-pink-50"   },
  ];

  const users = [
    { name: "Admin User",      email: "admin@resumeos.com", plan: "Pro",  resumes: 3, joined: "Today",   admin: true },
    { name: "Sarah Johnson",   email: "sarah@example.com",  plan: "Pro",  resumes: 5, joined: "2 days"  },
    { name: "Marcus Lee",      email: "marcus@example.com", plan: "Free", resumes: 2, joined: "3 days"  },
    { name: "Priya Sharma",    email: "priya@example.com",  plan: "Pro",  resumes: 7, joined: "1 week"  },
    { name: "James Wilson",    email: "james@example.com",  plan: "Free", resumes: 1, joined: "1 week"  },
  ];

  const [flags, setFlags] = useState({
    feature_docx_export:   true,
    feature_cover_letter:  true,
    shared_links:          true,
    premium_templates:     true,
    maintenance_mode:      false,
  });

  const toggleFlag = (k: keyof typeof flags) => {
    setFlags(f => ({ ...f, [k]: !f[k] }));
    toast.success(`Feature ${flags[k] ? "disabled" : "enabled"}: ${k.replace(/_/g, " ")}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-400">
          <Loader size={16} className="animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (!isAuthenticated || profile?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
          <Shield size={32} className="text-gray-300" />
          <p className="text-base font-medium">Admin access required</p>
          <p className="text-sm text-gray-400">Sign in as admin@resumeos.com to access this page.</p>
          <button onClick={() => router.push("/auth/login")}
            className="mt-2 rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      {/* Admin banner */}
      <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 text-sm text-yellow-800">
          <Shield size={14} className="text-yellow-600" />
          <strong>Admin Panel</strong> — {profile?.full_name || "Admin"}
          <span className="ml-2 rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-bold text-yellow-800">PRO</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage users, AI settings, feature flags, and monitor usage</p>
          </div>
          <button onClick={() => toast.success("Data refreshed")}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-white p-1.5 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === id ? "bg-teal-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            <div className="mb-6 grid grid-cols-4 gap-4">
              {stats.map(s => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Quick cards */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                {
                  title: "AI Settings",
                  desc: "Configure your AI provider, API key, and model",
                  icon: "🤖",
                  bg: "bg-purple-50 border-purple-200",
                  btn: "Configure AI",
                  onClick: () => setActiveTab("ai"),
                },
                {
                  title: "Admin Credentials",
                  desc: `Email: admin@resumeos.com\nPassword: Admin@123456`,
                  icon: "🔐",
                  bg: "bg-teal-50 border-teal-200",
                  btn: "Copy Credentials",
                  onClick: () => {
                    navigator.clipboard.writeText("Email: admin@resumeos.com\nPassword: Admin@123456");
                    toast.success("Credentials copied!");
                  },
                },
                {
                  title: "Database",
                  desc: "Supabase connection active\nRLS policies enabled",
                  icon: "🗄️",
                  bg: "bg-green-50 border-green-200",
                  btn: "View Schema",
                  onClick: () => toast.success("Schema: see backend/src/db/schema.sql"),
                },
              ].map(c => (
                <div key={c.title} className={`rounded-2xl border-2 ${c.bg} p-5`}>
                  <div className="text-2xl mb-3">{c.icon}</div>
                  <div className="font-semibold text-gray-900 mb-1">{c.title}</div>
                  <div className="text-xs text-gray-500 whitespace-pre-line mb-4">{c.desc}</div>
                  <button onClick={c.onClick}
                    className="rounded-lg border border-white bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
                    {c.btn}
                  </button>
                </div>
              ))}
            </div>

            {/* Recent users preview */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Recent Users</span>
                <button onClick={() => setActiveTab("users")} className="text-xs text-teal-500 hover:underline">View all →</button>
              </div>
              <div className="divide-y divide-gray-50">
                {users.slice(0, 4).map(u => (
                  <div key={u.email} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700 flex-shrink-0">
                      {u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.plan === "Pro" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.plan}
                    </span>
                    {u.admin && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">ADMIN</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── AI SETTINGS TAB ── */}
        {activeTab === "ai" && (
          <AISettingsTab />
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="font-semibold text-sm text-gray-900">All Users ({users.length})</span>
              <button onClick={() => toast.success("CSV export (demo)")}
                className="rounded-lg bg-teal-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-600 transition">
                Export CSV
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["User", "Email", "Plan", "Resumes", "Joined", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.email} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-teal-50/20 transition`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{u.name[0]}</div>
                        <span className="text-sm font-medium text-gray-800">{u.name}</span>
                        {u.admin && <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[9px] font-bold text-yellow-700">ADMIN</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.plan === "Pro" ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{u.resumes}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{u.joined}</td>
                    <td className="px-5 py-3.5">
                      {!u.admin && (
                        <button onClick={() => toast.error("Delete user (demo)")}
                          className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-red-100 hover:text-red-500 transition">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── EXPORTS TAB ── */}
        {activeTab === "exports" && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4">
              <span className="font-semibold text-sm text-gray-900">Export Logs</span>
            </div>
            {[
              { user: "admin@resumeos.com",  file: "Software_Engineer_Resume.pdf",   format: "PDF",  time: "5 min ago"  },
              { user: "sarah@example.com",   file: "Product_Manager_CV.docx",        format: "DOCX", time: "23 min ago" },
              { user: "marcus@example.com",  file: "Marketing_Resume.pdf",           format: "PDF",  time: "1 hr ago"   },
              { user: "priya@example.com",   file: "Data_Scientist_Resume.pdf",      format: "PDF",  time: "2 hr ago"   },
            ].map((e, i) => (
              <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-b border-gray-50`}>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ${e.format === "PDF" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {e.format}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 truncate">{e.file}</span>
                <span className="text-sm text-gray-400">{e.user}</span>
                <span className="text-sm text-gray-400">{e.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── APP SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-2 gap-5">
            {/* Feature Flags */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <SectionHeader title="Feature Flags" subtitle="Toggle features for all users" />
              <div className="space-y-3">
                {(Object.entries(flags) as [keyof typeof flags, boolean][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <div>
                      <div className="text-sm font-medium text-gray-800 capitalize">{k.replace(/_/g, " ")}</div>
                    </div>
                    <button onClick={() => toggleFlag(k)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        v ? "bg-teal-100 text-teal-700 hover:bg-teal-200" : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                      }`}>
                      {v ? <><ToggleRight size={13} /> On</> : <><ToggleLeft size={13} /> Off</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-5">
                <div className="text-2xl mb-3">🔐</div>
                <div className="font-semibold text-teal-900 mb-2">Admin Credentials</div>
                <div className="text-sm text-teal-800 space-y-1 font-mono">
                  <div>Email: admin@resumeos.com</div>
                  <div>Password: Admin@123456</div>
                  <div>Plan: Pro (all features)</div>
                </div>
                <p className="mt-3 text-xs text-teal-600">
                  ⚠️ Change before deploying to production.
                  Re-seed: <code className="bg-teal-200 px-1 rounded">cd backend && npm run seed</code>
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("Email: admin@resumeos.com\nPassword: Admin@123456");
                    toast.success("Copied!");
                  }}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600 transition">
                  <Copy size={12} /> Copy Credentials
                </button>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="font-semibold text-gray-900 mb-3">AI Note</div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  AI features are <strong>disabled by default</strong> and fully managed from the{" "}
                  <button onClick={() => setActiveTab("ai")} className="text-teal-500 underline">AI Settings</button> tab.
                  No API key is required to run the app — AI simply won't be shown to users until you configure and enable it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Master templates */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <SectionHeader title="Master Templates" subtitle="Built-in layouts available to all users" />
              <div className="space-y-3">
                {MASTER_TEMPLATES.map(tpl => (
                  <div key={tpl.slug} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: tpl.color, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{tpl.name}</div>
                      <div className="text-xs text-gray-400">{tpl.desc} · layout: {tpl.layout}</div>
                    </div>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom templates */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader title="Custom Templates" subtitle="Admin-created templates visible to users" />
                <button onClick={() => setShowNewTplForm(s => !s)}
                  className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition">
                  <Plus size={14} /> New Template
                </button>
              </div>

              {showNewTplForm && (
                <div className="mb-4 rounded-xl border-2 border-teal-200 bg-teal-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-teal-800">Create New Template</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Template Name *</label>
                      <input value={newTpl.name} onChange={e => setNewTpl(t => ({ ...t, name: e.target.value }))}
                        placeholder="My Custom Template"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Base Layout</label>
                      <select value={newTpl.layout} onChange={e => setNewTpl(t => ({ ...t, layout: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400 bg-white">
                        <option value="single">Single Column</option>
                        <option value="two-column">Two Column</option>
                        <option value="sidebar">Sidebar</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <input value={newTpl.desc} onChange={e => setNewTpl(t => ({ ...t, desc: e.target.value }))}
                      placeholder="Brief description of this template"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-teal-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Accent Color:</label>
                    <input type="color" value={newTpl.color} onChange={e => setNewTpl(t => ({ ...t, color: e.target.value }))}
                      className="h-8 w-8 cursor-pointer rounded border border-gray-200" />
                    <span className="text-xs text-gray-400">{newTpl.color}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveCustomTemplate}
                      className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition">
                      Create Template
                    </button>
                    <button onClick={() => setShowNewTplForm(false)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {customTemplates.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Layout size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No custom templates yet. Create one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customTemplates.map((tpl: any) => (
                    <div key={tpl.slug} className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: tpl.color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{tpl.name}</div>
                        <div className="text-xs text-gray-400">{tpl.desc || "No description"} · layout: {tpl.layout} · slug: {tpl.slug}</div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Custom</span>
                      <button onClick={() => deleteCustomTemplate(tpl.slug)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Custom templates use the base layout's rendering engine (Single → Corporate style, Two Column → Two-Column Pro style, Sidebar → Sidebar Modern style).
                Templates appear in the builder's template picker immediately after creation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { profile, subscription, updateProfile, isPro, logout } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "", job_title: "", location: "",
    phone: "", linkedin_url: "", website_url: "", github_url: "", bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [pwForm, setPwForm] = useState({ email: "", current: "", newPw: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  // Load fresh profile on mount
  useEffect(() => {
    profileApi.get().then(({ data }) => {
      const p = data.profile;
      setForm({
        full_name:    p.full_name    || "",
        job_title:    p.job_title    || "",
        location:     p.location     || "",
        phone:        p.phone        || "",
        linkedin_url: p.linkedin_url || "",
        website_url:  p.website_url  || "",
        github_url:   p.github_url   || "",
        bio:          p.bio          || "",
      });
      setPwForm(prev => ({ ...prev, email: p.email || "" }));
    }).catch(() => {
      // Fallback to stored profile
      if (profile) {
        setForm({
          full_name:    profile.full_name    || "",
          job_title:    profile.job_title    || "",
          location:     profile.location     || "",
          phone:        profile.phone        || "",
          linkedin_url: profile.linkedin_url || "",
          website_url:  profile.website_url  || "",
          github_url:   profile.github_url   || "",
          bio:          profile.bio          || "",
        });
        setPwForm(prev => ({ ...prev, email: profile.email || "" }));
      }
    }).finally(() => setLoadingProfile(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error("Full name is required"); return; }
    setSaving(true);
    try {
      const { data } = await profileApi.update(form);
      updateProfile(data.profile);
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!pwForm.newPw || pwForm.newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await authApi.forgotPassword(pwForm.email);
      toast.success("Password reset email sent. Check your inbox.");
      setPwForm(p => ({ ...p, current: "", newPw: "", confirm: "" }));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send reset email");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you absolutely sure? This will permanently delete your account and ALL resumes. This cannot be undone."
    );
    if (!confirmed) return;
    const reconfirm = prompt('Type "DELETE" to confirm:');
    if (reconfirm !== "DELETE") { toast.error("Cancelled"); return; }
    toast.error("Account deletion requires contacting support@resumeos.com (safety measure)");
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNav />
        <div className="flex h-64 items-center justify-center gap-2 text-sm text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-teal-500" />
          Loading settings…
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white";

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-8 font-serif text-2xl font-bold text-gray-900">Account Settings</h1>

        {/* Profile Info */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-base font-semibold text-gray-800">Profile Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["full_name",    "Full Name",    "text",  "Alexandra Chen"],
              ["job_title",    "Job Title",    "text",  "Senior Designer"],
              ["location",     "Location",     "text",  "San Francisco, CA"],
              ["phone",        "Phone",        "tel",   "+1 (555) 000-0000"],
              ["linkedin_url", "LinkedIn URL", "url",   "linkedin.com/in/…"],
              ["website_url",  "Website",      "url",   "yoursite.com"],
              ["github_url",   "GitHub",       "url",   "github.com/…"],
            ].map(([k, label, type, ph]) => (
              <div key={k}>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {label}
                </label>
                <input
                  type={type}
                  value={(form as any)[k]}
                  onChange={set(k)}
                  placeholder={ph}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Bio</label>
            <textarea
              value={form.bio}
              onChange={set("bio")}
              rows={3}
              placeholder="Brief professional bio…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Subscription</h2>
          <div className={`flex items-center justify-between rounded-xl border p-4 ${
            isPro ? "border-teal-200 bg-teal-50" : "border-gray-100 bg-gray-50"
          }`}>
            <div>
              <div className="font-semibold text-gray-900">
                {isPro ? "Pro Plan" : "Free Plan"}
              </div>
              <div className="text-sm text-gray-500">
                {isPro
                  ? `Active · Renews ${subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : "monthly"}`
                  : "Upgrade to unlock AI assistant, unlimited resumes, and DOCX export"}
              </div>
            </div>
            {isPro ? (
              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">Active ✓</span>
            ) : (
              <button
                onClick={() => router.push("/pricing")}
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {/* Password Change */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-gray-800">Change Password</h2>
          <p className="mb-4 text-sm text-gray-400">
            We'll send a password reset link to your email address.
          </p>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</label>
              <input
                type="email"
                value={pwForm.email}
                readOnly
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePasswordChange}
              disabled={pwSaving}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60">
              {pwSaving ? "Sending…" : "Send Reset Email"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border-2 border-red-200 bg-white p-6">
          <h2 className="mb-3 text-base font-semibold text-red-600">Danger Zone</h2>
          <div className="mb-4 flex items-start justify-between rounded-xl border border-red-100 bg-red-50 p-4">
            <div>
              <div className="font-medium text-gray-800">Sign Out</div>
              <div className="text-sm text-gray-500">Sign out of your account on this device</div>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100">
              Sign Out
            </button>
          </div>
          <div className="flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4">
            <div>
              <div className="font-medium text-red-700">Delete Account</div>
              <div className="text-sm text-red-500">Permanently delete your account and all data</div>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-100">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

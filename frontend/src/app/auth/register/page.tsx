"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) return toast.error("Fill in all fields");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-2xl font-bold text-gray-900">
            ResumeOS<span className="ml-1 inline-block h-2 w-2 rounded-full bg-teal-500 align-middle" />
          </Link>
          <p className="mt-2 text-sm text-gray-400">Create your free account</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "full_name", label: "Full Name", type: "text", ph: "Alexandra Chen" },
              { key: "email", label: "Email", type: "email", ph: "you@example.com" },
              { key: "password", label: "Password", type: "password", ph: "Min 8 characters" },
              { key: "confirm", label: "Confirm Password", type: "password", ph: "Repeat password" },
            ].map(({ key, label, type, ph }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={set(key)} placeholder={ph}
                  className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:bg-white" required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50">
              {loading ? "Creating account…" : "Create Free Account"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-teal-500 hover:underline">Sign in</Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}

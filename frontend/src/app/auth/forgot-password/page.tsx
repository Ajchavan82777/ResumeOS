"use client";
import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch { toast.error("Failed to send reset email"); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-2xl font-bold text-gray-900">
            ResumeOS<span className="ml-1 inline-block h-2 w-2 rounded-full bg-teal-500 align-middle" />
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          {sent ? (
            <div className="text-center">
              <div className="mb-4 text-5xl">📧</div>
              <h2 className="mb-2 font-serif text-xl font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-400">If an account exists for {email}, we&apos;ve sent a password reset link.</p>
              <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-teal-500 hover:underline">Back to login</Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 font-serif text-xl font-bold text-gray-900">Reset Password</h2>
              <p className="mb-6 text-sm text-gray-400">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:bg-white"
                    placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50 transition">
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/auth/login" className="text-sm text-gray-400 hover:text-gray-600">Back to login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

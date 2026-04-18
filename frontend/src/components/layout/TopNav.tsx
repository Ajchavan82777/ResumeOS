"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ChevronDown, Settings, LayoutDashboard, FileText } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/templates",      label: "Templates"    },
  { href: "/pricing",        label: "Pricing"      },
  { href: "/dashboard",      label: "Dashboard",   authRequired: true },
  { href: "/cover-letters",  label: "Cover Letters", authRequired: true },
];

const ADMIN_EMAIL = "admin@resumeos.com";

export function TopNav() {
  const pathname = usePathname();
  const { isAuthenticated, profile, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.email === ADMIN_EMAIL;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-6 px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 font-serif text-xl font-bold text-gray-900">
          ResumeOS
          <span className="ml-0.5 inline-block h-2 w-2 rounded-full bg-teal-500" />
        </Link>

        {/* Nav */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV_LINKS.map(l => {
            if (l.authRequired && !isAuthenticated) return null;
            return (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}>
                {l.label}
              </Link>
            );
          })}
          {isAuthenticated && isAdmin && (
            <Link href="/admin"
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                pathname.startsWith("/admin")
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
              }`}>
              🛡️ Admin
            </Link>
          )}
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                  {(profile?.full_name || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{profile?.full_name || "Account"}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,.14)]">
                    <div className="border-b border-gray-100 px-4 py-2.5">
                      <p className="text-xs font-semibold text-gray-800 truncate">{profile?.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    </div>
                    <Link href="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link href="/cover-letters"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}>
                      <FileText size={14} /> Cover Letters
                    </Link>
                    <Link href="/settings"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}>
                      <Settings size={14} /> Settings
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-teal-400 hover:text-teal-600">
                Sign in
              </Link>
              <Link href="/auth/register"
                className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

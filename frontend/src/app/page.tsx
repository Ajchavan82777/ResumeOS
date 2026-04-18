import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

const FEATURES = [
  { icon: "🎯", color: "bg-teal-50", title: "ATS-Optimized Templates", desc: "All templates pass modern ATS systems. Get through the screening and land more interviews." },
  { icon: "✨", color: "bg-purple-100", title: "AI Writing Assistant", desc: "Generate summaries, improve bullet points, and tailor your resume for any role with Claude AI." },
  { icon: "⚡", color: "bg-yellow-50", title: "Drag & Drop Builder", desc: "Rearrange sections, add entries, and customize your layout in real-time with instant preview." },
  { icon: "📄", color: "bg-teal-50", title: "PDF & DOCX Export", desc: "Download high-quality, print-ready exports. Selectable text, preserved layout, ATS-readable." },
  { icon: "📊", color: "bg-pink-50", title: "Job Match Scoring", desc: "Paste any job description and get an instant keyword match score with missing skill highlights." },
  { icon: "📋", color: "bg-blue-50", title: "Multiple Versions", desc: "Manage unlimited tailored resume versions for different roles and industries in one place." },
];

const STEPS = [
  { num: "01", title: "Choose a Template", desc: "Pick from ATS-friendly designs crafted for every industry and career stage." },
  { num: "02", title: "Fill In Your Details", desc: "Use our smart editor to add experience, skills, and achievements with AI assistance." },
  { num: "03", title: "Download & Apply", desc: "Export as PDF or DOCX and start applying with a resume that gets you noticed." },
];

const STATS = [
  { value: "50K+", label: "Resumes Created" },
  { value: "95%", label: "ATS Pass Rate" },
  { value: "8", label: "Templates" },
  { value: "4.9★", label: "Average Rating" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white pt-20 pb-16 text-center">
        {/* Blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,#ABE6D1_0%,transparent_70%)] opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-16 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,#E8E5F8_0%,transparent_70%)] opacity-70" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,#FFE0B9_0%,transparent_70%)] opacity-50" />

        <div className="relative mx-auto max-w-3xl px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-xs font-semibold text-teal-700 border border-teal-200">
            ⭐ Trusted by 50,000+ job seekers worldwide
          </div>
          <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight text-gray-900 mb-5">
            Build a Resume That<br /><em className="not-italic text-teal-500">Gets You Hired</em>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-500 leading-relaxed">
            Professional, ATS-optimized resumes in minutes. Choose a template, fill in your details, and land more interviews.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/builder/new" className="rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:-translate-y-0.5 hover:bg-teal-600 hover:shadow-teal-500/40">
              Build My Resume — It&apos;s Free
            </Link>
            <Link href="/templates" className="rounded-xl border-2 border-gray-200 bg-white px-7 py-3.5 text-sm font-medium text-gray-700 transition hover:border-teal-400 hover:text-teal-600">
              Browse Templates
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span>★★★★★ 4.9 rating</span>
            <span>· 50K+ resumes created</span>
            <span>· 95% ATS pass rate</span>
            <span>· Free to start</span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="mx-auto grid max-w-4xl grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="border-r border-gray-100 px-8 py-8 text-center last:border-r-0">
              <div className="font-serif text-3xl font-bold text-teal-500 mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-3xl font-bold text-center text-gray-900 mb-3">Everything You Need to Land the Job</h2>
          <p className="text-center text-gray-400 text-sm mb-12">A complete toolkit for every career stage</p>
          <div className="grid grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border-2 border-gray-100 bg-white p-6 transition hover:border-teal-200 hover:shadow-card-md">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.color}`}>{f.icon}</div>
                <h3 className="mb-2 text-[15px] font-semibold text-gray-900">{f.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl font-bold text-center text-gray-900 mb-3">How It Works</h2>
          <p className="text-center text-gray-400 text-sm mb-14">From blank page to polished resume in 3 simple steps</p>
          <div className="grid grid-cols-3 gap-10">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 font-serif text-xl font-bold text-teal-500">{s.num}</div>
                <h3 className="mb-2 text-[15px] font-semibold text-gray-900">{s.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-500 to-teal-600 text-center text-white">
        <h2 className="font-serif text-3xl font-bold mb-4">Ready to Build Your Resume?</h2>
        <p className="mb-8 text-teal-100 text-sm">Join 50,000+ professionals who landed their dream job with ResumeOS</p>
        <Link href="/builder/new" className="inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-teal-600 shadow-lg transition hover:bg-teal-50">
          Get Started Free →
        </Link>
      </section>

      <Footer />
    </div>
  );
}

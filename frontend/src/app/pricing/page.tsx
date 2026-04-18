import Link from "next/link";
import { Check } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

const PLANS = [
  {
    name: "Free", price: "$0", per: "forever", popular: false,
    desc: "Perfect for getting started",
    features: ["3 resumes", "6 ATS templates", "PDF export", "ATS score checker", "Job match tool", "Basic customization"],
    cta: "Get Started Free", href: "/auth/register",
  },
  {
    name: "Pro", price: "$9", per: "/month", popular: true,
    desc: "For serious job seekers",
    features: ["Unlimited resumes", "All 8 premium templates", "PDF + DOCX export", "AI writing assistant (Claude)", "Advanced job matching", "No watermarks", "Cover letter builder", "Version history", "Priority support"],
    cta: "Start 7-Day Trial", href: "/auth/register?plan=pro",
  },
];

const FAQS = [
  { q: "Is the free plan really free?", a: "Yes — no credit card required. Create up to 3 resumes, export as PDF, and use our ATS scoring tool completely free." },
  { q: "Can I cancel my Pro subscription anytime?", a: "Absolutely. Cancel with one click from your account settings. You keep Pro access until the end of your billing period." },
  { q: "Does the AI assistant work in the free plan?", a: "The AI writing assistant (powered by Claude) is a Pro feature. Free users can still use ATS scoring and job match tools." },
  { q: "Are the resumes really ATS-friendly?", a: "Yes. All templates use clean single-column layouts, standard section headings, and selectable text — exactly what ATS systems require." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="mb-3 font-serif text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
        <p className="mb-12 text-gray-400">Start free, upgrade when you need more power</p>

        <div className="mx-auto mb-16 grid max-w-2xl grid-cols-2 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl p-7 text-left ${
              plan.popular ? "border-2 border-teal-500 bg-teal-50/30 shadow-card-md" : "border-2 border-gray-200 bg-white"
            }`}>
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
                  MOST POPULAR
                </div>
              )}
              <div className="mb-1 text-base font-bold text-gray-900">{plan.name}</div>
              <div className="mb-1">
                <span className="font-serif text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-400">{plan.per}</span>
              </div>
              <div className="mb-5 text-sm text-gray-400">{plan.desc}</div>
              <div className="mb-6 h-px bg-gray-100" />
              <ul className="mb-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Check size={15} className="flex-shrink-0 text-teal-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                  plan.popular ? "bg-teal-500 text-white hover:bg-teal-600" : "border-2 border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-600"
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto max-w-2xl text-left">
          <h2 className="mb-6 font-serif text-2xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <div className="mb-2 font-semibold text-gray-900">{q}</div>
                <div className="text-sm text-gray-500 leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

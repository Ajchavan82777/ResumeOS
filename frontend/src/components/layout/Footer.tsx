import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-900 py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-4 gap-8 mb-10">
          <div>
            <div className="font-serif text-lg font-bold text-white mb-3">
              ResumeOS<span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-400 align-middle" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">Build professional resumes that pass ATS systems and impress recruiters.</p>
          </div>
          {[
            { title: "Product", links: [["Templates","/templates"],["Pricing","/pricing"],["Dashboard","/dashboard"]] },
            { title: "Resources", links: [["Blog","/blog"],["FAQ","/faq"],["Support","/support"]] },
            { title: "Legal", links: [["Privacy Policy","/privacy"],["Terms of Service","/terms"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">{title}</div>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-gray-400 hover:text-white transition">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">© 2026 ResumeOS. All rights reserved.</span>
          <span className="text-sm text-gray-500">Made with ♥ for job seekers</span>
        </div>
      </div>
    </footer>
  );
}

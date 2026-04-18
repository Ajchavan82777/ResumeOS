"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { SectionType } from "@/types";

interface SectionOption {
  type: SectionType | string;
  label: string;
  preview: React.ReactNode;
}

// Mini preview cards that show what each section looks like with sample data
function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none select-none rounded border border-gray-100 bg-white p-3 text-[8px] leading-tight font-sans overflow-hidden" style={{ minHeight: 90 }}>
      {children}
    </div>
  );
}

const LINE_BLUE = "#3B82F6";
const DOT_FILLED = "●";
const DOT_EMPTY  = "○";

const SECTION_OPTIONS: SectionOption[] = [
  {
    type: "custom",
    label: "Custom Title",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">CUSTOM TITLE</div>
        <div className="flex gap-1 items-start mb-1">
          <span className="text-blue-500">⚙</span>
          <div>
            <div className="font-semibold text-gray-800">Inspired &amp; Challenged</div>
            <div className="text-gray-400 text-[7px]">10/2014 – 06/2015</div>
            <div className="text-gray-500 mt-0.5">more than 1 million children to love science, nature…</div>
          </div>
        </div>
        <div className="flex gap-1 items-start">
          <span className="text-blue-500">⚙</span>
          <div>
            <div className="font-semibold text-gray-800">Inspired &amp; Challenged</div>
            <div className="text-gray-400 text-[7px]">10/2014 – 06/2015</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "languages",
    label: "Languages",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">LANGUAGES</div>
        <div className="flex justify-between mb-1">
          <div>
            <div className="font-semibold text-gray-800">English</div>
            <div className="text-gray-400">Proficient</div>
          </div>
          <div className="text-blue-500 text-[10px]">{DOT_FILLED}{DOT_FILLED}{DOT_FILLED}{DOT_FILLED}{DOT_EMPTY}</div>
        </div>
        <div className="flex justify-between">
          <div>
            <div className="font-semibold text-gray-800">Spanish</div>
            <div className="text-gray-400">Advanced</div>
          </div>
          <div className="text-blue-500 text-[10px]">{DOT_FILLED}{DOT_FILLED}{DOT_FILLED}{DOT_EMPTY}{DOT_EMPTY}</div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "courses",
    label: "Training / Courses",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">TRAINING / COURSES</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="font-semibold text-gray-800">Creative Writing</div>
            <div className="text-gray-500 mt-0.5">An intensive 4 week course for developing creative writing skills</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">Introduction to Photoshop</div>
            <div className="text-gray-500 mt-0.5">Basics of web design using the Adobe Photoshop application</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "projects",
    label: "Projects",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">PROJECTS</div>
        <div className="font-semibold text-gray-800">Tesla Model S for Kids</div>
        <div className="text-gray-400 text-[7px] mb-0.5">📅 11/2015 – 04/2016</div>
        <ul className="list-disc pl-3 text-gray-500">
          <li>Collaboration between Radio Flyer and Tesla to design &amp; create a kid-friendly Model S car</li>
          <li>Shot the demo video and photography for the website</li>
        </ul>
      </PreviewCard>
    ),
  },
  {
    type: "achievements",
    label: "Strengths / Achievements",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">STRENGTHS</div>
        <div className="flex items-start gap-1 mb-1">
          <span className="text-blue-400">↗</span>
          <div>
            <div className="font-semibold text-gray-800">Go-getter</div>
            <div className="text-gray-500">20+ recognitions have taught me that with persistence, one can achieve anything.</div>
          </div>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-blue-400">↗</span>
          <div>
            <div className="font-semibold text-gray-800">Go-getter</div>
            <div className="text-gray-500">20+ recognitions have taught me that with persistence, one can achieve anything.</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "volunteering",
    label: "Volunteering",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">VOLUNTEERING</div>
        <div className="font-semibold text-gray-800">Executive Member</div>
        <div className="text-blue-500">AIESEC</div>
        <div className="text-gray-400 text-[7px] mb-0.5">📅 08/2014 – Present</div>
        <div className="text-gray-500">AIESEC is an international non-governmental organization that provides young people with leadership development and cross-cultural global internship…</div>
      </PreviewCard>
    ),
  },
  {
    type: "skills",
    label: "Industry Expertise",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">INDUSTRY EXPERTISE</div>
        <div className="mb-1.5">
          <div className="text-gray-700 mb-0.5">Leadership</div>
          <div className="h-1.5 w-full rounded bg-gray-200">
            <div className="h-1.5 rounded bg-blue-500" style={{ width: "75%" }} />
          </div>
        </div>
        <div>
          <div className="text-gray-700 mb-0.5">Management</div>
          <div className="h-1.5 w-full rounded bg-gray-200">
            <div className="h-1.5 rounded bg-gray-600" style={{ width: "60%" }} />
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "interests",
    label: "Interests",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">INTERESTS</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1"><span className="text-blue-500">💙</span><span className="font-semibold text-gray-800">TEDxBoston</span></div>
            <div className="text-gray-500">Recruited all speakers in last 3 years, scaled the team from 5 to 12 people</div>
          </div>
          <div>
            <div className="flex items-center gap-1"><span className="text-blue-500">👍</span><span className="font-semibold text-gray-800">My espresso</span></div>
            <div className="text-gray-500">Got certified after Blue Bottle's barista 3-month training</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "references",
    label: "Find Me Online / References",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">FIND ME ONLINE</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1 text-blue-500 font-semibold"><span>f</span><span>Facebook</span></div>
            <div className="text-gray-400">username</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-blue-600 font-semibold"><span>in</span><span>LinkedIn</span></div>
            <div className="text-gray-400">username</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "certifications",
    label: "Certifications",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">CERTIFICATIONS</div>
        <div className="mb-1">
          <div className="font-semibold text-gray-800">Google Analytics Individual Qualification</div>
          <div className="text-blue-500">Google</div>
        </div>
        <div>
          <div className="font-semibold text-gray-800">AWS Solutions Architect</div>
          <div className="text-blue-500">Amazon Web Services</div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "awards",
    label: "Awards",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">AWARDS</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center gap-1"><span>🏆</span><span className="font-semibold text-gray-800">Dean's List</span></div>
            <div className="text-blue-500">Cornell School of…</div>
          </div>
          <div>
            <div className="flex items-center gap-1"><span>🎓</span><span className="font-semibold text-gray-800">Valedictorian</span></div>
            <div className="text-blue-500">South Boston High…</div>
          </div>
        </div>
      </PreviewCard>
    ),
  },
  {
    type: "education",
    label: "Education",
    preview: (
      <PreviewCard>
        <div className="font-bold uppercase tracking-wide text-gray-700 border-b border-gray-300 pb-0.5 mb-1.5">EDUCATION</div>
        <div className="mb-1.5">
          <div className="font-semibold text-gray-800">Degree and Field of Study</div>
          <div className="text-blue-500">School or University</div>
          <div className="text-gray-400 text-[7px]">📅 Date period &nbsp; 📍 Location</div>
        </div>
        <div>
          <div className="font-semibold text-gray-800">Degree and Field of Study</div>
          <div className="text-blue-500">School or University</div>
          <div className="text-gray-400 text-[7px]">📅 Date period</div>
        </div>
      </PreviewCard>
    ),
  },
];

// Map custom label slugs to actual section_types + titles
const SECTION_TYPE_MAP: Record<string, { type: SectionType; title: string }> = {
  custom:        { type: "custom",         title: "Custom Section" },
  languages:     { type: "languages",      title: "Languages" },
  courses:       { type: "certifications", title: "Training / Courses" },
  projects:      { type: "projects",       title: "Projects" },
  achievements:  { type: "achievements",   title: "Key Achievements" },
  volunteering:  { type: "custom",         title: "Volunteering" },
  skills:        { type: "skills",         title: "Industry Expertise" },
  interests:     { type: "custom",         title: "Interests" },
  references:    { type: "references",     title: "References" },
  certifications:{ type: "certifications", title: "Certifications" },
  awards:        { type: "custom",         title: "Awards" },
  education:     { type: "education",      title: "Education" },
  summary:       { type: "summary",        title: "Professional Summary" },
  experience:    { type: "experience",     title: "Work Experience" },
};

interface AddSectionModalProps {
  onAdd: (type: SectionType, title: string) => void;
  onClose: () => void;
  existingSectionTypes: string[];
}

export function AddSectionModal({ onAdd, onClose, existingSectionTypes }: AddSectionModalProps) {
  const [search, setSearch] = useState("");

  const filtered = SECTION_OPTIONS.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt: SectionOption) => {
    const mapped = SECTION_TYPE_MAP[opt.type as string];
    if (mapped) {
      onAdd(mapped.type, mapped.title ?? opt.label);
    } else {
      onAdd(opt.type as SectionType, opt.label);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-10 px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add a new section</h2>
            <p className="text-sm text-gray-400 mt-0.5">Click on a section to add it to your resume</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-8 py-4 border-b border-gray-100">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sections…"
            className="w-full rounded-xl border-2 border-gray-200 px-4 py-2 text-sm outline-none focus:border-teal-400 transition"
            autoFocus
          />
        </div>

        {/* Section grid */}
        <div className="p-6 grid grid-cols-3 gap-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {filtered.map((opt) => (
            <button
              key={`${opt.type}-${opt.label}`}
              onClick={() => handleSelect(opt)}
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-gray-100 text-left transition hover:border-teal-400 hover:shadow-md"
            >
              {/* Preview area */}
              <div className="flex-1 bg-gray-50 p-2 group-hover:bg-teal-50/40 transition">
                {opt.preview}
              </div>
              {/* Label */}
              <div className="border-t border-gray-100 bg-white px-3 py-2.5">
                <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600 transition">{opt.label}</span>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 py-12 text-center text-sm text-gray-400">
              No sections found for "{search}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

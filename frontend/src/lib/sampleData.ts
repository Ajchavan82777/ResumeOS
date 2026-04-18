// Placeholder data that pre-fills a new blank resume so the template looks populated
// Mimics Enhancv-style placeholder text that guides users to fill in their details

export interface PlaceholderSection {
  section_type: string;
  title: string;
  sort_order: number;
  data: Record<string, any>;
  entries?: Record<string, any>[];
}

export const PLACEHOLDER_SECTIONS: PlaceholderSection[] = [
  {
    section_type: "personal",
    title: "Personal Details",
    sort_order: 0,
    data: {
      name: "Your Name",
      job_title: "The role you are applying for?",
      phone: "Phone",
      email: "Email",
      linkedin: "LinkedIn/Portfolio",
      location: "Location",
    },
  },
  {
    section_type: "summary",
    title: "Summary",
    sort_order: 1,
    data: {
      text: "Write two to five phrases to describe your best professional self. What's your unique value? Tailor this summary for each job posting.",
    },
  },
  {
    section_type: "experience",
    title: "Experience",
    sort_order: 2,
    data: {},
    entries: [
      {
        role: "Title",
        company: "Company Name",
        location: "Location",
        startDate: "2022-01",
        endDate: "",
        current: true,
        bullets: [
          "Highlight your accomplishments, using numbers if possible.",
          "Describe the scope of your responsibilities and team size.",
          "Show impact: increased revenue, reduced costs, improved efficiency.",
        ],
      },
      {
        role: "Title",
        company: "Company Name",
        location: "Location",
        startDate: "2019-03",
        endDate: "2021-12",
        current: false,
        bullets: [
          "Highlight your accomplishments, using numbers if possible.",
          "Use strong action verbs to start each bullet point.",
        ],
      },
      {
        role: "Title",
        company: "Company Name",
        location: "Location",
        startDate: "2016-06",
        endDate: "2019-02",
        current: false,
        bullets: [
          "Highlight your accomplishments, using numbers if possible.",
        ],
      },
    ],
  },
  {
    section_type: "education",
    title: "Education",
    sort_order: 3,
    data: {},
    entries: [
      {
        degree: "Degree and Field of Study",
        school: "School or University",
        location: "City",
        startDate: "2012-09",
        endDate: "2016-06",
        gpa: "",
        notes: "",
      },
      {
        degree: "Degree and Field of Study",
        school: "School or University",
        location: "City",
        startDate: "2010-09",
        endDate: "2012-06",
        gpa: "",
        notes: "",
      },
    ],
  },
  {
    section_type: "achievements",
    title: "Key Achievements",
    sort_order: 4,
    data: {},
    entries: [
      {
        text: "Your Achievement",
        title: "Your Achievement",
        description: "Describe what you did and the impact it had.",
      },
      {
        text: "Your Achievement",
        title: "Your Achievement",
        description: "Describe what you did and the impact it had.",
      },
      {
        text: "Your Achievement",
        title: "Your Achievement",
        description: "Describe what you did and the impact it had.",
      },
    ],
  },
  {
    section_type: "skills",
    title: "Skills",
    sort_order: 5,
    data: {},
    entries: [
      { category: "Technical Skills", skills: ["Your Skill", "Your Skill", "Your Skill"] },
      { category: "Soft Skills", skills: ["Communication", "Leadership", "Problem Solving"] },
    ],
  },
];

// Example data injected when user adds a new section from the modal
export const SECTION_EXAMPLE_DATA: Record<string, { data: Record<string, any>; entries?: Record<string, any>[] }> = {
  summary: {
    data: { text: "Write 2–5 sentences describing your professional background, key skills, and career goal." },
  },
  experience: {
    data: {},
    entries: [
      {
        role: "Job Title",
        company: "Company Name",
        location: "City, Country",
        startDate: "2022-01",
        current: true,
        bullets: ["Highlight your accomplishments, using numbers if possible."],
      },
    ],
  },
  education: {
    data: {},
    entries: [
      {
        degree: "Degree and Field of Study",
        school: "School or University",
        location: "City",
        startDate: "2016-09",
        endDate: "2020-06",
        gpa: "",
        notes: "",
      },
    ],
  },
  skills: {
    data: {},
    entries: [
      { category: "Technical", skills: ["Skill 1", "Skill 2", "Skill 3"] },
      { category: "Soft Skills", skills: ["Communication", "Teamwork"] },
    ],
  },
  projects: {
    data: {},
    entries: [
      {
        name: "Project Name",
        role: "Your Role",
        url: "https://github.com/yourproject",
        startDate: "2023-01",
        current: true,
        description: "Describe the project, its purpose, and your contributions.",
        bullets: [
          "Key feature or accomplishment.",
          "Technology or tool used.",
        ],
      },
    ],
  },
  certifications: {
    data: {},
    entries: [
      { name: "Certification Name", issuer: "Issuing Organization", date: "2023-06", url: "" },
    ],
  },
  achievements: {
    data: {},
    entries: [
      { text: "Your Achievement", title: "Your Achievement", description: "Describe what you did and the impact it had." },
      { text: "Your Achievement", title: "Your Achievement", description: "Describe what you did and the impact it had." },
    ],
  },
  languages: {
    data: {},
    entries: [
      { language: "English", proficiency: "Native" },
      { language: "Spanish", proficiency: "Intermediate" },
    ],
  },
  references: {
    data: { text: "Available upon request" },
  },
  custom: {
    data: { text: "" },
    entries: [{ text: "Add your custom content here." }],
  },
  volunteering: {
    data: {},
    entries: [
      { text: "Executive Member — AIESEC (2020–Present). Led cross-functional initiatives and mentored 10+ new volunteers." },
    ],
  },
  courses: {
    data: {},
    entries: [
      { name: "Course Name", issuer: "Platform / Institution", date: "2023-03", url: "" },
      { name: "Course Name", issuer: "Platform / Institution", date: "2022-11", url: "" },
    ],
  },
  awards: {
    data: {},
    entries: [
      { text: "Award Name — Organization (Year). Brief description of the award and what it recognizes." },
    ],
  },
  interests: {
    data: { text: "Travel · Photography · Open Source · Rock Climbing · Coffee Brewing" },
  },
};

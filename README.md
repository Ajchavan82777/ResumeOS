# ResumeOS — Full-Stack Resume Builder

A production-ready, ATS-friendly Resume Builder SaaS application built with:

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database & Auth**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **State Management**: Zustand + React Query
- **Drag & Drop**: Native HTML5 (dnd-kit ready)
- **Export**: PDF (Puppeteer / print) + DOCX

---

## 📁 Project Structure

```
resumeos/
├── backend/               # Express API server
│   ├── src/
│   │   ├── db/            # Supabase client + schema.sql
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/        # All API route handlers
│   │   └── index.js       # Server entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/              # Next.js 14 App Router
    ├── src/
    │   ├── app/           # Pages (App Router)
    │   │   ├── page.tsx           # Landing
    │   │   ├── dashboard/         # Dashboard
    │   │   ├── builder/[id]/      # Resume builder
    │   │   ├── templates/         # Template gallery
    │   │   ├── pricing/           # Pricing page
    │   │   ├── settings/          # Account settings
    │   │   └── auth/              # Login / Register / Forgot
    │   ├── components/
    │   │   ├── builder/           # BuilderShell, EditorPanel, PreviewPanel, SectionForm, ResumeDocument
    │   │   └── layout/            # TopNav, Footer
    │   ├── hooks/         # useAuth, useResume, useAutoSave
    │   ├── lib/           # api.ts (axios), atsScore.ts
    │   ├── store/         # Zustand stores (auth, builder, ui)
    │   ├── types/         # TypeScript types
    │   └── styles/        # globals.css
    ├── .env.example
    └── package.json
```

---

## 🚀 Quick Start

### 1. Clone / Unzip the project

```bash
unzip resumeos.zip
cd resumeos
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → Run the contents of `backend/src/db/schema.sql`
3. Copy your **Project URL**, **anon key**, and **service role key** from Settings → API

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in:
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
# JWT_SECRET (any random string)
# ANTHROPIC_API_KEY (from console.anthropic.com)

npm install
npm run dev
# API running at http://localhost:5000
```

### 4. Configure Frontend

```bash
cd ../frontend
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

npm install
npm run dev
# App running at http://localhost:3000
```

---

## 🔧 Environment Variables

### Backend (.env)
| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | Secret for JWT signing |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:3000) |

### Frontend (.env.local)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## 🌐 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |

### Resumes
| Method | Route | Description |
|---|---|---|
| GET | `/api/resumes` | List all resumes |
| POST | `/api/resumes` | Create resume |
| GET | `/api/resumes/:id` | Get single resume |
| PATCH | `/api/resumes/:id` | Update resume |
| DELETE | `/api/resumes/:id` | Soft delete |
| POST | `/api/resumes/:id/duplicate` | Duplicate resume |
| PATCH | `/api/resumes/:id/customization` | Update theme/design |
| POST | `/api/resumes/:id/score` | Calculate ATS score |

### Sections & Entries
| Method | Route | Description |
|---|---|---|
| GET | `/api/resumes/:id/sections` | List sections |
| POST | `/api/resumes/:id/sections` | Add section |
| PATCH | `/api/resumes/:id/sections/:sid` | Update section |
| DELETE | `/api/resumes/:id/sections/:sid` | Remove section |
| PUT | `/api/resumes/:id/sections/reorder` | Reorder sections |
| POST | `/api/resumes/:id/sections/:sid/entries` | Add entry |
| PATCH | `/api/resumes/:id/sections/:sid/entries/:eid` | Update entry |
| DELETE | `/api/resumes/:id/sections/:sid/entries/:eid` | Delete entry |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/generate-summary` | AI summary generation |
| POST | `/api/ai/improve-bullets` | Improve bullet points |
| POST | `/api/ai/suggest-skills` | Skill suggestions |
| POST | `/api/ai/keyword-match` | JD keyword analysis |
| POST | `/api/ai/tailor-resume` | Tailor for a job |
| POST | `/api/ai/generate-cover-letter` | Cover letter |

### Export
| Method | Route | Description |
|---|---|---|
| POST | `/api/export/:id/pdf` | Export as PDF |
| POST | `/api/export/:id/docx` | Export as DOCX |

---

## 🗄️ Database Schema

The Supabase schema includes these tables:
- `profiles` — User profile data
- `subscriptions` — Free/Pro plan tracking
- `templates` — Resume template metadata
- `resumes` — Resume records
- `resume_customizations` — Theme/design settings
- `resume_sections` — Section definitions (personal, experience, etc.)
- `section_entries` — Individual entries within sections
- `cover_letters` — Cover letter data
- `export_logs` — PDF/DOCX export history
- `ai_usage_logs` — AI feature usage tracking
- `shared_resume_links` — Public share links
- `resume_versions` — Version history snapshots
- `payments` — Payment/billing records
- `admin_settings` — Feature flags and configuration

---

## 📦 Key Features

- ✅ **ATS-Optimized Resume Templates** — Clean, parseable layouts
- ✅ **Real-Time Live Preview** — See changes instantly
- ✅ **Drag & Drop Section Reordering** — Native HTML5 DnD
- ✅ **AI Writing Assistant** — Powered by Claude (summary, bullets, skills)
- ✅ **Job Description Keyword Matching** — AI-powered analysis
- ✅ **ATS Score Calculator** — Live scoring with suggestions
- ✅ **PDF Export** — Server-side Puppeteer or client-side print
- ✅ **DOCX Export** — Structured Word document support
- ✅ **Auto-Save** — Debounced 2-second auto-save
- ✅ **Undo / Redo** — 30-step history
- ✅ **Design Customization** — Colors, fonts, spacing, density
- ✅ **User Authentication** — Supabase Auth with JWT
- ✅ **Multi-Resume Dashboard** — Manage all resumes
- ✅ **Subscription Plans** — Free and Pro tiers
- ✅ **Cover Letter Builder** — Integrated with resume data

---

## 🚢 Deployment

### Backend (Railway / Render / Fly.io)
```bash
cd backend
# Set environment variables in your hosting dashboard
npm start
```

### Frontend (Vercel)
```bash
cd frontend
# Connect GitHub repo to Vercel
# Set NEXT_PUBLIC_* env vars in Vercel dashboard
vercel deploy
```

---

## 🛠️ Tech Stack Details

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| API | Express.js |
| AI | Anthropic Claude API |
| PDF | Puppeteer (server) / window.print (fallback) |
| Icons | Lucide React |
| Notifications | React Hot Toast |

---

## 📄 License

MIT License — Free to use, modify, and deploy.

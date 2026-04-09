# Rezoomind

**AI-powered job search platform** — real-time internship & new grad listings, AI resume analysis, and market intelligence. Built and shipped solo from scratch.

Live app: https://rezoomind.vercel.app

---

## What It Does

Rezoomind helps CS students and new grads cut through the noise of job hunting. It aggregates live internship and full-time postings, surfaces market trends (hiring velocity, peak seasons, role breakdowns), analyzes your resume with AI, and sends weekly email digests — all in one place.

---

## Screenshots

### Job Board — live listings updated daily
<img width="1392" alt="Job board with live internship listings from LinkedIn, Glassdoor, and more" src="https://github.com/user-attachments/assets/68dcdbef-eb77-41f9-bade-b8476b6fe651" />

### Market Intelligence Dashboard
<img width="1407" alt="Market intelligence dashboard showing hiring trends and peak seasons" src="https://github.com/user-attachments/assets/3bfcd6f7-677c-449d-a346-c2c62c673d2e" />

---

## Key Features

- **Live Job Aggregation** — Pulls internship and new grad postings daily from SimplifyJobs, LinkedIn, Glassdoor, and Indeed. Always fresh, no stale listings.
- **Market Intelligence** — Hiring trend charts (3M / 6M / ALL), peak season signals, 30-day velocity by role (SWE, DS/ML, Hardware, PM), and "what to do next" guidance.
- **AI Resume Analysis** — Upload a PDF or DOCX resume; the app extracts text and uses LLMs (OpenAI + Google Gemini) to give targeted feedback and tailor suggestions per job.
- **Role Filtering** — Filter by SWE, ML/Data, Frontend, Backend, Hardware, PM across USA and International openings.
- **Automated Email Digests** — Scheduled weekly briefings and instant job alerts delivered via Resend API.
- **Chrome Extension** — Companion extension for one-click applying and resume tailoring from any job page.
- **Auth & Profiles** — Secure email/password auth (NextAuth + bcrypt) with per-user resume and profile storage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion |
| Backend | Next.js API Routes, Playwright (web scraping) |
| AI | OpenAI API, Google Gemini (@google/genai) |
| ORM / DB | Prisma 6, PostgreSQL (Supabase) |
| Auth | NextAuth v4, bcryptjs |
| Email | Resend API |
| Deployment | Vercel (25+ deployments), Docker Compose (local dev) |
| Analytics | Vercel Analytics |

---

## Architecture Highlights

- **Scraping pipeline** — Playwright headless browser scrapes job boards on a cron schedule; Cheerio handles HTML parsing. Results are deduped and stored in Postgres.
- **AI resume pipeline** — pdf-parse + mammoth extract raw text from PDF/DOCX uploads, fed to OpenAI/Gemini with job-specific context, streamed feedback to the client.
- **Market snapshot model** — A DashboardSnapshot Prisma model tracks historical hiring data to power trend charts with Recharts.
- **Progressive auth UX** — HomeClientShell renders public market data for anonymous users and unlocks full features on sign-in, no layout shift.

---

## Running Locally

```bash
git clone https://github.com/Kaydenletk/rezoomind.git
cd rezoomind
npm install

# Copy and fill in environment variables
cp .env.example .env.local

npm run dev
```

**Required env vars:** DATABASE_URL, NEXTAUTH_SECRET, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, RESEND_API_KEY

---

## Contact

Built by **Kayden (Khanh) Le** — open to SWE / fullstack / AI engineering roles.

Email: kaydenletk@gmail.com | GitHub: https://github.com/Kaydenletk

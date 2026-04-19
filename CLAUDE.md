# CLAUDE.md — Rezoomind Project Context

> Personal internship command center — real-time job data, AI resume tailoring, and application tracking for students.

---

## UI/UX Design Guard (Production Sync)

Before making ANY changes to landing page components, global CSS, or `page.tsx`:

1. **Protect the Hierarchy:** The "Market Status" bar must remain compact, the trend chart must maintain its current aspect ratio, and the job table must preserve its current column layout.
2. **No Intrusive Elements:** Do not inject prominent sign-up banners, pop-ups, or wide elements that push the primary market data down the page unless explicitly requested.
3. **Verify Before Editing:** If modifying a UI component, assume the production version is correct. Revert any local deviations (like misaligned banners) back to the production state before adding new features.
4. **Warn First:** If a requested feature or data point threatens to break the production grid layout, STOP, warn me exactly how it will break, and propose a non-disruptive alternative placement.

### Protected Landing Page Files

After 2026-04-17 redesign (feed-is-the-hero). Spec: `docs/superpowers/specs/2026-04-17-phase1-landing-design.md`.

| File | What it controls | Rule |
|------|-----------------|------|
| `app/page.tsx` | Homepage server component | DO NOT add heavy computations here; keep thin. Hero count + initial jobs only. |
| `components/landing/LandingShell.tsx` | Client orchestrator | DO NOT add features not in the Phase 1 spec without explicit approval |
| `components/landing/LandingTopbar.tsx` | Sticky topbar + auth-aware nav | Keep logo+dots placement; don't add nav links without approval |
| `components/landing/LandingHero.tsx` | Hero count + one-line sub | Headline must stay under 12 words |
| `components/landing/SearchBar.tsx` | Sticky search + filter chips + Cmd+K | DO NOT add a third filter row or change the prompt `>` cursor style |
| `components/landing/RoleRow.tsx` | Single role row | Tier-color logic is load-bearing — don't change the score thresholds (75/50/30) without approval |
| `components/landing/RoleList.tsx` | Filter + skeleton + empty state | Filtering is client-side on the loaded array (Phase 3 will change this) |
| `components/landing/copy.ts` | Locked copy strings | Any copy change goes through this file, not inline |

**Retired from `/` (kept for `(app)` layout):** `HomeClientShell.tsx`, `SummaryStrip.tsx`, `MainInsightCard.tsx`, `MarketBanner.tsx`, `InsightCards.tsx`, `JobsTable.tsx`.

### Protected Smart-Feed Files (Phase 3 — 2026-04-19)

Spec: `docs/superpowers/specs/2026-04-19-phase3-feed-redesign-design.md`.
Plan: `docs/superpowers/plans/2026-04-19-phase3-feed-redesign.md`.

| File | Rule |
|------|------|
| `components/smart-feed/JobCard.tsx` | Compact layout is load-bearing. Do not expand padding or add a 4th row without approval. |
| `components/smart-feed/DetailPanel.tsx` | No tab bar. Cover letter is a single inline expand-button. |
| `components/smart-feed/FilterBar.tsx` | Single-row layout. Only H1B lives behind `more…`; new filters must be added to the popover, not the main row. |
| `components/smart-feed/TrustStrip.tsx` | Items are data-driven. Never show placeholders or zero-values. |
| `components/smart-feed/OnboardingStrip.tsx` | Three steps locked: resume → preferences → first_apply. |
| `components/smart-feed/StatusPill.tsx` | NEW/SAVED/APPLIED only. APPLIED stays dormant until Phase 5 wires real data. |
| `components/smart-feed/copy.ts` | Source of truth for feed copy. All display strings live here. |
| `hooks/useFeedKeyboard.ts` | Keyboard map is load-bearing. New shortcuts must not shadow `j/k/s/t/a///?/esc`. |
| `lib/feed-derivations.ts` | Pure. No side effects. Tests live next to it at `lib/feed-derivations.test.ts`. |

### Smart Feed Components (Separate from Production)

The `components/smart-feed/` directory contains components for the upcoming unified dashboard rebuild. These are NOT used by the production homepage. They live alongside production code and must NOT replace or interfere with the files listed above until explicitly approved.

---

## Project Overview

Rezoomind is a **personal** Next.js application that aggregates internship/new-grad job postings, displays market trends, and (will) help the user boost their interview win rate to 80% through AI-powered resume tailoring, real match scoring, and interview prep.

**Owner**: Khanh Le (solo developer)
**Deployed at**: https://rezoomind.vercel.app
**Local dev**: `npm run dev` on port 3000

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Fonts | Inter (sans), Geist Mono (mono) — loaded via `next/font` |
| Auth | NextAuth v4, Credentials provider, JWT sessions |
| ORM | Prisma |
| Database | PostgreSQL on **Neon** (serverless) |
| AI | Vercel AI SDK v6 (`ai`, `@ai-sdk/google`), Google Gemini, OpenAI (fallback) |
| Email | Resend |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Design System — "Terminal Control Panel"

This is the **core identity** of the app. Every new page, component, or feature MUST follow this aesthetic.

### Visual Language

| Element | Rule |
|---------|------|
| **Palette core** | **Warm stone + orange.** No pure black anywhere. Primary = warm stone-50 (light) / stone-900 (dark). Pure `bg-black`, `bg-stone-950`, `bg-[#0c0c0c]`, `bg-[#000]` are banned — use semantic tokens. |
| **Background** | `bg-surface` (primary), `bg-surface-raised` (cards), `bg-surface-sunken` (wells/chrome). These auto-swap light/dark and are the warm-stone palette, not black. |
| **Brand color** | Orange — `text-orange-600`, `border-orange-600`, `bg-orange-600/10`. For body text legibility use `text-orange-700 dark:text-orange-400`. |
| **Font** | Monospace (`font-mono` / Geist Mono) for headings, nav, labels, data. Inter for body text where readability matters. |
| **Brand text** | `rezoomind` — always lowercase, `tracking-wider`, `text-orange-700 dark:text-orange-400`, `font-bold`. |
| **Terminal dots** | Three dots in the nav: `●` `bg-brand-primary` → `○` `border-orange-600/40` → `○` `border-line`. |
| **Nav links** | `~/jobs`, `~/insights`, `~/home` — mono, lowercase, `text-fg-subtle`, hover `text-orange-600 dark:text-orange-400`. |
| **Borders** | `border-line` (primary) / `border-line-subtle` (secondary). Sharp 1px, NO rounded corners on cards. |
| **Cards** | `bg-surface-raised border border-line`, flat — NO shadows, NO rounded-xl. |
| **Buttons** | Primary: `border border-orange-600/60 bg-orange-600/10 text-orange-700 dark:text-orange-400`. Secondary: `border border-line bg-surface-sunken/60 text-fg-muted`. |
| **Labels** | `text-[10px] uppercase tracking-[0.2em] text-fg-muted`. |
| **Input fields** | Transparent bg, `border-b border-line focus:border-orange-600`, mono, preceded by `>` cursor. |
| **Status messages** | `▸` success (`text-status-success`), `✗` error (`text-status-error`), `⋯` loading (`text-fg-muted`). |
| **Grid overlay** | Subtle 40px background grid using `currentColor` at `opacity-[0.035]` light / `opacity-[0.05]` dark. |
| **Window chrome** | Faux title bar with 3 dots + `.exe` label (e.g., `auth.exe`, `register.exe`). Use `bg-surface-sunken` for the bar, `bg-fg-subtle/40` for the dots. |
| **Theme default** | Light (warm stone-50). Dark toggle available. Use semantic tokens; avoid hand-coded `dark:` classes where a semantic token already swaps. |

### What to AVOID

- ❌ Dark-only designs — all new pages must support both light and dark via Tailwind `dark:` variants
- ❌ Rounded-full / pill buttons (except the old `(app)` layout pages not yet migrated)
- ❌ Generic blue/green/red — use the token colors
- ❌ Sans-serif headings — use mono
- ❌ Drop shadows on cards
- ❌ Single-theme designs — always support both light and dark

### Reference Components

- **DashboardHeader** (`components/dashboard/DashboardHeader.tsx`) — canonical nav bar
- **Auth layout** (`app/(auth)/layout.tsx`) — canonical full-page dark shell
- **LoginClient** (`app/(auth)/login/LoginClient.tsx`) — canonical form card
- **InsightCards** (`components/dashboard/InsightCards.tsx`) — canonical data cards

---

## Route Architecture

```
app/
├── page.tsx                    # Public dashboard (DashboardHeader, dark terminal UI)
├── insights/                   # Market insights page
├── (auth)/                     # Auth pages — own dark terminal layout, NO Header/Footer
│   ├── layout.tsx              # Terminal nav + dark bg + minimal footer
│   ├── login/
│   └── signup/
├── (app)/                      # Old layout — white Header + Footer (legacy)
│   ├── layout.tsx              # Wraps children in Header + Footer
│   ├── dashboard/              # Authenticated dashboard (3-col layout)
│   ├── resume/                 # Resume upload/management
│   ├── jobs/                   # Job browsing
│   ├── preferences/            # User preferences
│   ├── about/, contact/, pricing/
│   └── sign-in/, sign-up/      # Redirects to /login, /signup
└── api/
    ├── auth/
    │   ├── [...nextauth]/route.ts   # NextAuth handler
    │   ├── signup/route.ts          # POST: create user with bcrypt hash
    │   └── sign-up/route.ts         # Legacy duplicate
    ├── quick-tailor/route.ts        # POST: AI resume analysis (no auth required)
    ├── chat/route.ts                # POST: RezoomAI copilot chat
    ├── resume/
    │   ├── data/route.ts            # GET/POST: resume CRUD
    │   └── analyze/route.ts         # POST: AI resume analysis
    ├── dashboard/data/route.ts      # GET: matched jobs for dashboard
    └── cron/                        # Scheduled jobs (Vercel cron)
```

### Layout Migration Note

The `(app)` layout still uses the old white `<Header />` + `<Footer />`. New pages should be created in new route groups with terminal-style layouts, or the `(app)` layout should eventually be migrated to the dark terminal aesthetic.

---

## Database Schema (Key Models)

| Model | Purpose |
|-------|---------|
| `User` | Auth user — email, hashed password, linked accounts |
| `Resume` | User's resume text, file URL, extracted keywords, embedding |
| `CandidateProfile` | Detailed profile for auto-apply (name, links, demographics) |
| `job_postings` | Scraped jobs — company, role, location, description, keywords, embedding |
| `DashboardSnapshot` | Daily job market counts (USA/Intl × Intern/NewGrad) |
| `CompanyData` | Enriched company info (industry, funding, H1B, leadership) |
| `SavedJob` | User's saved/bookmarked jobs |
| `email_subscribers` | Free-tier newsletter subscribers |

---

## Environment Variables

`.env.local` is populated via `vercel env pull .env.local` (Vercel CLI). Key vars:
```
DATABASE_URL=            # Neon PostgreSQL (pooled) — from Vercel
DATABASE_URL_UNPOOLED=   # Neon PostgreSQL (direct) — from Vercel
OPENAI_API_KEY=          # For AI features
GEMINI_API_KEY=          # For Quick Tailor + resume analysis
NEXTAUTH_SECRET=         # JWT signing — generate: openssl rand -base64 32
NEXTAUTH_URL=            # http://localhost:3000 (dev) or https://rezoomind.vercel.app (prod)
GOOGLE_CLIENT_ID=        # Google OAuth — from console.cloud.google.com
GOOGLE_CLIENT_SECRET=    # Google OAuth — starts with GOCSPX-
RESEND_API_KEY=          # Email sending
CRON_SECRET=             # Secures cron job endpoints
```
Google OAuth redirect URIs (must be set in Google Cloud Console OAuth client):
- `http://localhost:3000/api/auth/callback/google`
- `https://rezoomind.vercel.app/api/auth/callback/google`

---

## Common Commands

```bash
npm run dev              # Start dev server on :3000
npm run build            # Production build (runs prisma generate first)
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Run pending migrations
npx prisma db push       # Push schema changes without migration
```

---

## Product Roadmap — Path to 80% Interview Win Rate

### Phase 1: Real Resume Matching (HIGHEST PRIORITY)
**Status: NOT STARTED — current match scores are `Math.random()`**

1. **Resume keyword extraction** — Upload resume → Gemini extracts skills, tools, frameworks → store in `resume_keywords` + `embedding`
2. **Job description parsing** — Extract required/preferred skills from JD → store in `job_keywords`
3. **Real match scoring** — Replace `Math.random()` in `/dashboard` with actual keyword overlap + cosine similarity on embeddings
4. **Gap analysis** — Show which JD keywords are missing from resume, highlighted visually

### Phase 2: Resume Tailoring Engine
5. **One-click tailor** — Given a JD, Gemini rewrites resume bullet points to match required keywords. Before/after diff view.
6. **ATS score preview** — Show estimated ATS pass-through rate before and after tailoring
7. **Quick Tailor panel** — Already built (`QuickTailorPanel.tsx`), needs to use real resume data instead of pasted text

### Phase 3: Application Tracking
8. **Status pipeline** — Track each application: Bookmarked → Applied → Phone Screen → Interview → Offer/Rejected
9. **Follow-up reminders** — "Applied 5 days ago, no response — send follow-up"
10. **Analytics** — Response rate, time-to-response, conversion funnel

### Phase 4: Interview Prep
11. **Company intel** — Pull from `CompanyData` model (leadership, funding, culture)
12. **AI mock questions** — Gemini generates behavioral + technical questions specific to the JD
13. **Answer coach** — Practice STAR-format answers with AI feedback

---

## ✅ Completed Features

| Feature | Location | Notes |
|---------|----------|-------|
| Streaming match explanation | `app/api/matches/explain/stream/` | Uses Vercel AI SDK v6 + Gemini, streams word-by-word |
| Streaming cover letter | `app/api/resume/cover-letter/stream/` | Uses Vercel AI SDK v6 + Gemini, 4 tone options |
| useStreamingText hook | `hooks/useStreamingText.ts` | Reusable hook for streaming text consumption |
| MatchExplanationStream | `components/smart-feed/MatchExplanationStream.tsx` | Terminal-styled streaming UI |
| CoverLetterStream | `components/smart-feed/CoverLetterStream.tsx` | Terminal-styled with tone selector + copy button |

---

## Known Issues & Tech Debt

| Issue | Location | Notes |
|-------|----------|-------|
| Match scores are fake | `app/(app)/dashboard/page.tsx:174` | Uses `Math.random()` — Phase 1 replaces this |
| Skills checklist hardcoded | `app/(app)/dashboard/page.tsx:706` | `["Python", "Django", ...]` — should come from resume analysis |
| `GEMINI_API_KEY` missing | `.env.local` | Quick Tailor falls back to mock data — add to Vercel env dashboard if missing |
| Old white UI on `/resume` | `app/(app)/resume/page.tsx` | Needs migration to terminal aesthetic |
| `setState` in `useEffect` | `components/dashboard/JobsTable.tsx` | Lint warning — potential cascade renders |
| Duplicate signup route | `api/auth/signup/` + `api/auth/sign-up/` | Consolidate to one |

---

## Code Style

- **Imports**: Absolute imports with `@/` prefix
- **Components**: Functional components, no class components
- **State**: React hooks (`useState`, `useEffect`, `useMemo`)
- **Animation**: Framer Motion for transitions and micro-interactions
- **Naming**: camelCase for functions/variables, PascalCase for components, snake_case for DB fields
- **Files**: Components in `components/`, utilities in `lib/`, API routes in `app/api/`

---

## 🚧 IN PROGRESS: Unified Dashboard Rebuild

**Branch:** `feat/unified-dashboard`
**Started:** 2026-04-06
**Status:** Paused mid-implementation (Tasks 1–2 of 21 complete)

### How to Resume

Open Claude and paste this prompt:

> Continue the unified dashboard rebuild. Read `docs/superpowers/plans/2026-04-06-unified-dashboard.md` and pick up from Task 3. I'm on the `feat/unified-dashboard` branch. Use the superpowers:subagent-driven-development skill to dispatch fresh subagents per task.

### What's Done ✅

- **Task 1:** Theme infrastructure + CLAUDE.md update (commit `8875be9`)
  - Light mode is now the default
  - Dark mode toggle infrastructure via `localStorage.theme`
  - `app/layout.tsx` has flash-prevention script
- **Task 2:** MatchScoreRing — null state + light mode fix (commit `b7df3b1`)
  - `score: number | null` now supported (null = "—" display)
  - Track circle uses Tailwind `stroke-stone-200 dark:stroke-stone-800`

### What's Remaining (19 tasks)

**Phase A — Layout + Public Mode:**
- Task 3: SmartFeedHeader component (`components/smart-feed/SmartFeedHeader.tsx`)
- Task 4: JobCard component (`components/smart-feed/JobCard.tsx`)
- Task 5: FilterBar component (`components/smart-feed/FilterBar.tsx`)
- Task 6: DetailPanel component (`components/smart-feed/DetailPanel.tsx`)
- Task 7: TabBar component (`components/smart-feed/TabBar.tsx`)
- Task 8: JobFeed component (`components/smart-feed/JobFeed.tsx`)
- Task 9: SummaryStrip — add personal mode (modify existing)
- Task 10: SmartFeedShell — main orchestrator (`components/smart-feed/SmartFeedShell.tsx`)
- Task 11: Rewrite `app/page.tsx` to use SmartFeedShell

**Phase B — Auth Transformation + Matching:**
- Task 12: Auth-aware SmartFeedShell (useSession, fetch resume, batch match)
- Task 13: Save job functionality (wire up ♡ button)
- Task 14: QuickTailor integration (wire up existing panel into DetailPanel)

**Phase C — Tracking + AI Features:**
- Task 15: Schema migration — add `status`, `appliedAt`, `interviewDate`, `notes` to SavedJob
- Task 16: Update saved jobs API (PATCH + return full objects)
- Task 17: Saved / Applied / Tracking tabs
- Task 18: Ask AI contextual chat (`components/smart-feed/AskAIPanel.tsx`)
- Task 19: Update `/insights` page header + move InsightCards/MainInsightCard there
- Task 20: Clean up dead code (delete HomeClientShell, JobsTable, etc.)
- Task 21: Final build + verification checklist

### Key Decisions (locked in)

- **Layout:** Feed + Detail Panel (like Jobright), NOT Command Center
- **Theme:** Light default with dark toggle (NOT dark-only)
- **Signup strategy:** Open browsing, gate AI features (Option B from brainstorming)
- **AI placement:** Contextual buttons per job (Tailor Resume, Ask AI), NO persistent chat panel
- **Navigation:** `/` = smart feed, `/insights` = full market data (chart stays there)
- **New components:** Live in `components/smart-feed/` separate from `components/dashboard/`

### Reference Documents

- **Design spec:** `docs/superpowers/specs/2026-04-06-unified-dashboard-design.md`
- **Implementation plan:** `docs/superpowers/plans/2026-04-06-unified-dashboard.md` (detailed task-by-task)
- **Brainstorm mockups:** `.superpowers/brainstorm/77670-1775522794/` (HTML previews)

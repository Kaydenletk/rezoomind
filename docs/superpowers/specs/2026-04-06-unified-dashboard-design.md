# Unified Dashboard Design Spec

> One page, two modes. Same URL transforms from public job board → personal AI command center after login.

## Context

Rezoomind currently has a fragmented experience: public homepage with market insights, separate `/dashboard` with 3-column layout (sidebar nav, job feed, details+AI copilot). Users must navigate between pages. The goal is to unify into a single smart feed — inspired by Jobright.ai's simplicity but with rezoomind's free AI features as the differentiator.

**Problem:** Too many pages, too much navigation, dark-only theme limits accessibility.
**Solution:** One URL (`/`) that transforms based on auth state. Light default with dark toggle.

---

## Architecture

### Route Structure (After)

```
/ .................. Smart Feed (public browse OR personal dashboard)
/insights .......... Full market data (chart, trends, seasonal analysis)
/login ............. Auth (terminal aesthetic)
/signup ............ Auth (terminal aesthetic)
```

### Auth-Based Transformation

| Element | Public (no auth) | Personal (logged in) |
|---------|-------------------|----------------------|
| **Header** | Logo + Login/Signup buttons | Logo + notifications + theme toggle + avatar dropdown |
| **Summary Strip** | Market stats (job count, new today, market heat) | Personal stats (matches, avg score, applied, interviews) + AI nudge |
| **Tab Bar** | None — single chronological feed | For You / All Jobs / Saved / Applied / Tracking |
| **Job Cards** | Score ring shows "—", no skill tags | Real match scores + skill tags (✓ matched, ✗ gaps) |
| **Detail Panel** | Job info + Apply link. Tailor/AI locked with signup prompt | Full: Apply, Tailor Resume, Ask AI, status tracking |
| **Filters** | Role, Location, Remote, Recency, H1B | Same + "Save filter" presets |

---

## Components

### 1. Header Bar

- **Public:** `rezoomind` logo (orange, monospace, tracking-wider) + "Log in" (ghost) + "Sign up free" (orange filled)
- **Personal:** Logo + sun/moon toggle + avatar circle (first letter). Avatar dropdown: Resume, Preferences, Logout
- Note: Notifications deferred to v2 — adds significant scope (new DB model, polling). For v1, the AI nudge in Summary Strip serves the "what's new" purpose.
- Responsive: collapses to hamburger on mobile

### 2. Summary Strip

Horizontal bar below header.

- **Public:** `847 jobs | +23 today | 🔥 Hot market` + subtle CTA "✦ Sign up for personalized matches"
- **Personal:** `7 matches | 84% avg | 12 applied | 2 interviews` + AI nudge: `"✦ Apply to Intapp — 98% match, early window"`
- Data sources: DashboardSnapshot (public), /api/matches/data (personal)

### 3. Tab Bar (Personal only)

| Tab | Content | Data Source |
|-----|---------|-------------|
| **For You** | AI-ranked by match score (default) | /api/matches/data → sorted by overallScore |
| **All Jobs** | Chronological, all jobs | /api/jobs/data |
| **Saved** | Bookmarked jobs | SavedJob model, filtered |
| **Applied** | Jobs marked as applied | SavedJob with status=applied |
| **Tracking** | Pipeline view (interview dates, follow-ups) | SavedJob with status=interview/offer |

### 4. Filter Bar

Horizontal row of filter chips below tabs.

- Filters: Role type, Location, Remote/Onsite/Hybrid, Recency (past day/week/month), H1B Sponsor
- Active filters shown as dismissible orange chips
- **Personal:** "+ Save filter" button to save current filter combo as a preset
- Persisted in URL params for shareability

### 5. Job Feed (Left side, ~60% width)

List of job cards. Each card shows:

- **Match score ring** (MatchScoreRing component — reuse existing)
  - Public: gray ring with "—"
  - Personal: colored by tier (≥80 orange, ≥60 amber, <60 gray)
- Company name, role title, location
- Salary (if available), posting time ("27m", "2h", "1d")
- **Personal only:** Skill tags inline — `React ✓` `TypeScript ✓` `Docker ✗` (green/red, max 3-4)
- Save button (♡) on each card
- Selected card highlighted with orange-tinted background

### 6. Detail Panel (Right side, ~40% width)

Appears when a job card is selected. Sticky, scrolls independently.

- **Header:** Job title, company, location, salary, posting time, save button
- **Match section (personal):** Large match score ring + matched skills (✓) + missing skills (✗)
- **Actions:**
  - "Apply" — primary CTA, opens job URL in new tab
  - "✦ Tailor Resume" — opens QuickTailorPanel slide-over (🔒 public: shows signup prompt)
  - "Ask AI" — opens contextual chat scoped to this job (🔒 public: shows signup prompt)
- **Status selector (personal):** Dropdown — Save / Mark Applied / Add Interview Date
- **Job description:** Expandable, first 400 chars visible by default
- On mobile: detail panel becomes a bottom sheet or full-screen overlay

### 7. AI Features (Contextual, not persistent)

**No persistent chat panel.** AI surfaces through:

1. **AI Nudge** (Summary Strip) — One-liner proactive advice, rotates based on new high-match jobs
2. **Tailor Resume** (Detail Panel button) — Opens existing QuickTailorPanel as slide-over
3. **Ask AI** (Detail Panel button) — Opens small chat panel scoped to selected job. Quick actions: "Summarize", "Cover letter", "Interview prep". Uses existing /api/chat endpoint

---

## Theme System

**Default: Light mode.** Toggle in header, persisted in localStorage.

| Token | Light | Dark |
|-------|-------|------|
| Background | stone-50 | stone-950 |
| Card bg | white | stone-900 |
| Card border | stone-200 | stone-800 |
| Text primary | stone-900 | stone-100 |
| Text secondary | stone-500 | stone-500 |
| Accent | orange-600 | orange-500 |
| Selected card | orange-50 bg, orange-200 border | orange-950 bg, orange-800 border |
| Filter chip active | orange-100 bg, orange-600 text | orange-900 bg, orange-400 text |

Consistent across both: monospace headings, orange accents, sharp corners (no rounded-xl).

---

## Free vs Gated

### Free (no account)
- Browse all jobs
- Search + filter
- View job descriptions
- Click "Apply" (opens external URL)
- Market stats in summary strip

### Requires signup (free account)
- AI match scores
- Skill gap analysis (✓/✗ tags on cards)
- Tailor Resume
- Ask AI
- Save jobs + filter presets
- Application tracking pipeline
- AI nudge recommendations
- "For You" personalized tab

---

## What We Reuse

### Keep as-is (backend)
- `lib/matching/vector-matching.ts` — match scoring engine
- `lib/matching/batch-match.ts` — batch job matching
- `lib/matching/keywords.ts` — keyword extraction
- `lib/insights.ts` — market trend computation
- `lib/job-priority.ts` — priority badges
- `api/matches/data/` — dashboard data endpoint
- `api/quick-tailor/` — resume tailoring
- `api/chat/` — AI chat
- `api/resume/data/` — resume CRUD
- `api/jobs/data/` — job feed
- NextAuth config

### Keep + adapt (components)
- `MatchScoreRing` — reuse, add "—" state for public
- `QuickTailorPanel` — reuse as slide-over, trigger from detail panel
- `MarketBanner` / `MarketChart` — stay on `/insights` page
- `InsightCards` — stay on `/insights` page

### Rebuild (frontend)
- `app/page.tsx` → unified smart feed with auth-based transformation
- New: `SmartFeedHeader` — responsive header with auth states
- Refactor: `SummaryStrip` — already exists, add personal stats mode + AI nudge
- New: `TabBar` — For You / All Jobs / Saved / Applied / Tracking
- New: `FilterBar` — horizontal filter chips with presets
- New: `JobCard` — individual job card in feed
- New: `JobFeed` — scrollable list of JobCards
- New: `DetailPanel` — right-side job details + actions
- New: `AskAIPanel` — small contextual chat for a specific job
- Refactor: `HomeClientShell` → becomes the main page orchestrator

### Remove / deprecate
- Old 3-column dashboard layout (`app/(app)/dashboard/`)
- Old `Header` + `Footer` components (replaced by SmartFeedHeader)
- Old `JobsTable` (replaced by JobCard + JobFeed)
- Sidebar nav (no longer needed — everything is tabs)

---

## Schema Changes Required

```prisma
// SavedJob — add status + interview tracking
model SavedJob {
  // ... existing fields ...
  status        String   @default("saved")  // saved | applied | phone_screen | interview | offer | rejected
  interviewDate DateTime?
  appliedAt     DateTime?
  notes         String?
}
```

Filter presets: stored in localStorage (v1), not database. Simple and no migration needed.

---

## Edge Cases & States

### Loading States
- Job feed: skeleton cards (gray pulsing rectangles)
- Detail panel: skeleton with placeholder lines
- Summary strip: animated shimmer
- Match scores: show "—" ring while computing, replace with real score when ready

### Empty States
- **No resume uploaded (new user):** "For You" tab shows prompt: "Upload your resume to see match scores" with upload button. Falls back to "All Jobs" tab content underneath.
- **Saved tab empty:** "Save jobs by clicking ♡ on any job card"
- **Applied tab empty:** "Mark jobs as applied to track your progress"
- **Tracking tab empty:** "Jobs with interview dates will appear here"
- **No search results:** "No jobs match your filters. Try broadening your search."

### Error States
- API failure: show last cached data with subtle "Unable to refresh" notice
- AI features fail: show "AI temporarily unavailable" with retry button

### Session Expiry
- If session expires while on personal tab, redirect to `/` which will render public mode

---

## Implementation Phases

### Phase A: Layout + Public Mode
- New page layout (feed + detail panel)
- SmartFeedHeader with auth states
- JobCard + JobFeed components
- DetailPanel component
- FilterBar
- Light/dark theme system
- Public mode fully working

### Phase B: Auth Transformation + Matching
- Auth-based content switching
- SummaryStrip personal mode
- TabBar (For You / All Jobs)
- Match scores in job cards (using existing batch-match)
- Skill tags on cards
- MatchScoreRing "—" state for public

### Phase C: Tracking + AI Features
- SavedJob schema migration (add status field)
- Saved / Applied / Tracking tabs
- Status selector in DetailPanel
- Tailor Resume button → QuickTailorPanel
- Ask AI button → contextual chat
- AI nudge in SummaryStrip

---

## Verification

1. **Public mode:** Visit `/` logged out → see job feed with "—" scores, market stats, login/signup buttons
2. **Login:** Click signup → create account → redirected to `/` → page transforms to personal mode
3. **For You tab:** Shows AI-ranked jobs with real match scores + skill tags
4. **Detail panel:** Click job → details appear on right with Apply, Tailor, Ask AI
5. **Save job:** Click ♡ → job appears in Saved tab
6. **Mark applied:** Use status selector → job moves to Applied tab
7. **Tailor Resume:** Click button → QuickTailorPanel opens with results
8. **Ask AI:** Click button → contextual chat opens
9. **Theme toggle:** Switch light ↔ dark → all components update, preference persists
10. **Mobile:** Feed goes full-width, detail panel becomes bottom sheet
11. **Insights:** Navigate to `/insights` → full market chart + trends still work

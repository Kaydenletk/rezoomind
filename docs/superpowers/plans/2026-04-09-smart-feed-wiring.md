# Smart Feed Build + Real Matching Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the unified smart feed UI (Tasks 3-11 from the original plan) and wire it to the real vector-matching engine (`/api/dashboard/data`) so authenticated users see actual match scores instead of LLM-guessed ones.

**Architecture:** One page (`/`) with auth-aware rendering. Feed + Detail Panel layout. Public users see GitHub-scraped jobs with no scores; authenticated users see DB jobs scored by 60% cosine similarity + 40% keyword overlap via `batchMatchJobs()`. All new components live in `components/smart-feed/`.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, NextAuth, Prisma, existing vector matching + Gemini AI endpoints.

**Design Spec:** `docs/superpowers/specs/2026-04-06-unified-dashboard-design.md`
**Original Plan:** `docs/superpowers/plans/2026-04-06-unified-dashboard.md`

---

## Critical Context: Two Data Pipelines

| Pipeline | Source | Matching | Used By |
|----------|--------|----------|---------|
| **GitHub CSV** | `lib/fetch-github-jobs.ts` → SimplifyJobs README | `POST /api/matches/batch-score` (Gemini LLM prompt, title-only) | Current homepage (`HomeClientShell`) |
| **Database** | `job_postings` table (Neon) | `GET /api/dashboard/data` → `batchMatchJobs()` (vector embeddings + keyword overlap) | Old `/dashboard` page |

**This plan wires the smart feed to use both:** public mode uses GitHub CSV (no scores), authenticated mode uses `/api/dashboard/data` (real matching).

---

## File Structure

### New files (in `components/smart-feed/`)

| File | Responsibility |
|------|---------------|
| `SmartFeedHeader.tsx` | Responsive header: logo, auth buttons or avatar+theme toggle |
| `JobCard.tsx` | Single job card: score ring, company, role, salary, skill tags |
| `FilterBar.tsx` | Search input + horizontal filter chips |
| `DetailPanel.tsx` | Right panel: job details, Apply/Tailor/Ask AI actions |
| `TabBar.tsx` | For You / All Jobs / Saved / Applied / Tracking tabs |
| `JobFeed.tsx` | Scrollable list of JobCards with loading/empty states |
| `SmartFeedShell.tsx` | Main orchestrator: state, data fetching, composition |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Rewrite to render SmartFeedShell with server-fetched data |
| `components/dashboard/SummaryStrip.tsx` | Add `mode: "public" \| "personal"` prop |

### Existing files reused as-is

- `components/dashboard/MatchScoreRing.tsx` (Tasks 1-2 already updated)
- `components/dashboard/QuickTailorPanel.tsx`
- `lib/matching/batch-match.ts` + `lib/matching/vector-matching.ts`
- `app/api/dashboard/data/route.ts` (the real matching API)
- `app/api/resume/data/route.ts`
- `app/api/jobs/saved/route.ts`
- `hooks/useSavedJobs.ts`

---

## Phase A: Layout + Public Mode (Tasks 3-11)

### Task 3: SmartFeedHeader component

**Files:**
- Create: `components/smart-feed/SmartFeedHeader.tsx`

- [ ] **Step 1: Create SmartFeedHeader**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface SmartFeedHeaderProps {
  user: { name?: string | null; email?: string | null } | null;
}

export function SmartFeedHeader({ user }: SmartFeedHeaderProps) {
  // Theme toggle: reads/writes localStorage.theme, toggles 'dark' class on <html>
  // Avatar dropdown: Resume, Preferences, Logout
  // Mobile: hamburger menu
}
```

Key UI rules (from design spec):
- Sticky top: `sticky top-0 z-50 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800`
- Left: `rezoomind` logo — `font-mono font-bold tracking-wider text-orange-600`, links to `/`
- Right (public): "Log in" ghost button (`border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400`) + "Sign up free" filled button (`bg-orange-600 text-white`)
- Right (personal): Sun/moon toggle icon button + avatar circle (first letter, `bg-orange-600 text-white w-8 h-8 font-mono text-sm`) with dropdown (Resume `/resume`, Preferences `/preferences`, Logout)
- Theme toggle: `document.documentElement.classList.toggle('dark')` + `localStorage.setItem('theme', ...)`
- Mobile (< lg): hamburger icon, slide-out panel with same items
- No rounded corners on buttons, monospace for brand text

- [ ] **Step 2: Verify in isolation**

Temporarily render `<SmartFeedHeader user={null} />` in `app/page.tsx` above `<HomeClientShell>` to verify both states. Check light/dark toggle works. Remove after verification.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedHeader.tsx
git commit -m "feat: add SmartFeedHeader with auth states and theme toggle"
```

---

### Task 4: JobCard component

**Files:**
- Create: `components/smart-feed/JobCard.tsx`

- [ ] **Step 1: Create shared types file**

Create `components/smart-feed/types.ts` with shared interfaces used across smart-feed components:

```typescript
export interface SmartFeedJob {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  datePosted: string | null;
  salary?: string | null;
  tags?: string[] | null;
  description?: string | null;
  category?: string;
}

export interface JobMatch {
  matchScore: number | null;
  skillsMatch?: number | null;
  experienceMatch?: number | null;
  matchReasons?: string[] | null;
  missingSkills?: string[] | null;
}
```

- [ ] **Step 2: Build JobCard**

```typescript
"use client";

import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobCardProps {
  job: SmartFeedJob;
  match?: JobMatch | null;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isAuthenticated: boolean;
}
```

Layout:
- Horizontal card, full width, no rounded corners
- Left: `MatchScoreRing` (size=36). Public: `score={null}`. Authenticated: `score={match?.matchScore ?? null}`
- Center column:
  - Row 1: Company name (`font-mono font-semibold text-sm`) + role title (`text-stone-900 dark:text-stone-100 font-medium`)
  - Row 2: Location + salary (if available) + relative time ("2h ago", "1d ago")
  - Row 3 (authenticated only, if match): Up to 4 skill tags inline — matched skills in `text-green-600 bg-green-50 dark:bg-green-950/30` with `✓`, missing skills in `text-red-500 bg-red-50 dark:bg-red-950/30` with `✗`
- Right: Save button — `♡` outline (unsaved) / `♥` filled orange (saved). Click stops propagation.
- Selected state: `bg-orange-50 dark:bg-orange-950/50 border-l-2 border-l-orange-500`
- Normal state: `bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800`
- Hover: `hover:bg-stone-50 dark:hover:bg-stone-800/50`
- Click anywhere on card → `onSelect(job.id)`

Helper: `getRelativeTime(dateStr)` — must handle TWO date formats:
1. **ISO strings** from DB jobs (e.g. `"2026-04-08T14:30:00Z"`) — parse with `new Date(dateStr)` and compute relative time
2. **Human-readable strings** from GitHub CSV (e.g. `"May 02"`, `"2 days ago"`) — if `new Date(dateStr)` produces a valid date, compute relative time; otherwise display the string as-is

Logic: try `new Date(dateStr)` → if valid and not NaN, compute relative (< 1min = "just now", < 60min = "Nm ago", < 24h = "Nh ago", else "Nd ago"). If invalid, return the original string.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/types.ts components/smart-feed/JobCard.tsx
git commit -m "feat: add JobCard component with match scores and skill tags"
```

---

### Task 5: FilterBar component

**Files:**
- Create: `components/smart-feed/FilterBar.tsx`

- [ ] **Step 1: Build FilterBar**

```typescript
"use client";

export interface Filters {
  search: string;
  roleType: string | null;    // "swe" | "pm" | "dsml" | "quant" | "hardware" | null
  location: string | null;
  remote: string | null;       // "remote" | "onsite" | "hybrid" | null
  recency: string | null;      // "day" | "week" | "month" | null
  h1b: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  roleType: null,
  location: null,
  remote: null,
  recency: null,
  h1b: false,
};

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}
```

Layout:
- Search input: `>` cursor prefix (monospace), `border-b border-stone-300 dark:border-stone-700 focus:border-orange-600 bg-transparent font-mono text-sm`, placeholder "search jobs..."
- Row of filter buttons below (or inline if space allows):
  - "Role" dropdown: SWE, PM, DS/ML, Quant, Hardware
  - "Remote" dropdown: Remote, Onsite, Hybrid
  - "Recency" dropdown: Past day, Past week, Past month
  - "H1B" toggle chip
- Active filters: `bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400` with `✕` dismiss
- Inactive: `bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400`
- No rounded corners on chips (use `rounded-none` or very subtle `rounded-sm` max)

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/FilterBar.tsx
git commit -m "feat: add FilterBar with search and filter chips"
```

---

### Task 6: DetailPanel component

**Files:**
- Create: `components/smart-feed/DetailPanel.tsx`

- [ ] **Step 1: Build DetailPanel**

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import type { SmartFeedJob, JobMatch } from "./types";

interface DetailPanelProps {
  job: SmartFeedJob | null;
  match?: JobMatch | null;
  isSaved: boolean;
  isAuthenticated: boolean;
  onToggleSave: (job: SmartFeedJob) => void;
  onTailorClick: (job: SmartFeedJob) => void;
  onAskAI: (job: SmartFeedJob) => void;
  jobDescription?: string | null;
}
```

Layout (sticky, right side, independent scroll):
- **Empty state** (job is null): Centered text "Select a job to see details" with subtle arrow icon
- **Header section:**
  - Role title: `font-mono font-bold text-lg text-stone-900 dark:text-stone-100`
  - Company name, location, salary, posting time
  - Save ♡ button (top-right)
- **Match section** (only if authenticated AND match exists):
  - Large `MatchScoreRing` (size=64)
  - Matched skills list: green `✓` tags
  - Missing skills list: red `✗` tags
  - Skills/experience sub-scores if available
- **Actions row:**
  - "Apply" — primary: `bg-orange-600 hover:bg-orange-700 text-white font-mono text-sm px-4 py-2`, opens `job.url` in new tab
  - "Tailor Resume" — secondary: `border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 font-mono text-sm px-4 py-2`, prefixed with `✦`
    - If not auth: show tooltip "Sign up to unlock"
  - "Ask AI" — secondary: same style as Tailor, prefixed with sparkle icon
    - If not auth: show tooltip "Sign up to unlock"
- **Job description:** First 400 chars visible, "Show more" toggle expands full text. `text-stone-600 dark:text-stone-400 text-sm leading-relaxed`
- **Container:** `sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 p-5`
- **Mobile** (< lg): Render as a slide-up overlay using Framer Motion. Full-screen with close button.

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/DetailPanel.tsx
git commit -m "feat: add DetailPanel with job details and gated AI actions"
```

---

### Task 7: TabBar component

**Files:**
- Create: `components/smart-feed/TabBar.tsx`

- [ ] **Step 1: Build TabBar**

```typescript
"use client";

export type TabId = "for-you" | "all-jobs" | "saved" | "applied" | "tracking";

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs: Tab[];
}
```

Layout:
- Horizontal row: `flex gap-0 border-b border-stone-200 dark:border-stone-800 px-5`
- Each tab: `px-4 py-2.5 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors`
- Active: `text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500 -mb-px`
- Inactive: `text-stone-500 hover:text-stone-700 dark:hover:text-stone-300`
- Count badge: `ml-1.5 text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded-sm font-mono`
- Mobile: horizontally scrollable with `overflow-x-auto scrollbar-hide`

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/TabBar.tsx
git commit -m "feat: add TabBar component for feed navigation"
```

---

### Task 8: JobFeed component

**Files:**
- Create: `components/smart-feed/JobFeed.tsx`

- [ ] **Step 1: Build JobFeed**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { JobCard } from "./JobCard";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobFeedProps {
  jobs: SmartFeedJob[];
  matches?: Record<string, JobMatch>;  // keyed by job id
  selectedJobId: string | null;
  savedJobIds: Set<string>;
  isAuthenticated: boolean;
  onSelectJob: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isLoading: boolean;
}
```

Layout:
- Scrollable container: `overflow-y-auto` with `max-h-[calc(100vh-200px)]`
- Maps over `jobs` → renders `JobCard` for each
- **Loading state:** 6 skeleton cards — pulsing gray rectangles matching card dimensions (`animate-pulse bg-stone-200 dark:bg-stone-800`)
- **Empty state:** Centered message "No jobs match your filters" with filter icon
- **Auto-select:** On mount, if `selectedJobId` is null and jobs exist, call `onSelectJob(jobs[0].id)`
- Scroll selected card into view when selection changes

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/JobFeed.tsx
git commit -m "feat: add JobFeed scrollable list with loading and empty states"
```

---

### Task 9: SummaryStrip — add personal mode

**Files:**
- Modify: `components/dashboard/SummaryStrip.tsx`

- [ ] **Step 1: Read current SummaryStrip implementation**

Read `components/dashboard/SummaryStrip.tsx` to understand current props and structure before modifying.

- [ ] **Step 2: Extend SummaryStrip with personal mode**

Add optional `mode` prop (defaults to `"public"` for backward compatibility):

```typescript
import type { MarketInsights } from "@/lib/insights";

interface SummaryStripProps {
  mode?: "public" | "personal";
  // Public mode (existing props — keep original union literal types):
  marketHeat?: MarketInsights["marketHeat"];     // "slow" | "normal" | "hot"
  freshToday?: number;
  competitionLevel?: MarketInsights["competitionLevel"];  // "low" | "medium" | "high"
  // Personal mode (new props):
  matchCount?: number;
  avgScore?: number;
  appliedCount?: number;
  interviewCount?: number;
  aiNudge?: string;
}
```

- Public mode: Keep existing rendering unchanged. Add subtle CTA on right: `✦ Sign up for personalized matches` (link to `/signup`, `text-orange-500 text-xs font-mono`)
- Personal mode: Render `{matchCount} matches | {avgScore}% avg | {appliedCount} applied | {interviewCount} interviews` + AI nudge on right in orange with `✦` prefix
- Both modes: Ensure light/dark support with `bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800`

- [ ] **Step 3: Commit**
```bash
git add components/dashboard/SummaryStrip.tsx
git commit -m "feat: SummaryStrip supports personal mode with stats and AI nudge"
```

---

### Task 10: SmartFeedShell — main orchestrator

**Files:**
- Create: `components/smart-feed/SmartFeedShell.tsx`

This is the most complex component. It composes all smart-feed pieces and manages state. Build it in two phases: public mode first (this task), then auth-aware mode (Task 12).

**Dependency note:** `useSession()` requires `SessionProvider` in the component tree. This is already provided by `AuthProvider` in `app/layout.tsx` (wraps the entire app).

- [ ] **Step 1: Build SmartFeedShell (public mode)**

```typescript
"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { SmartFeedHeader } from "./SmartFeedHeader";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { FilterBar, type Filters, DEFAULT_FILTERS } from "./FilterBar";
import { TabBar, type TabId } from "./TabBar";
import { JobFeed } from "./JobFeed";
import { DetailPanel } from "./DetailPanel";
import type { SmartFeedJob, JobMatch } from "./types";

import type { MarketInsights } from "@/lib/insights";

interface SmartFeedShellProps {
  postings: SmartFeedJob[];
  marketHeat: MarketInsights["marketHeat"];
  freshToday: number;
  competitionLevel: MarketInsights["competitionLevel"];
}
```

**State:**
```typescript
const { data: session, status: authStatus } = useSession();
const isAuth = authStatus === "authenticated";
const user = session?.user ?? null;

const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
const [activeTab, setActiveTab] = useState<TabId>("all-jobs");

// Auth-aware state (populated in Task 12)
const [matches, setMatches] = useState<Record<string, JobMatch>>({});
const [isLoadingMatches, setIsLoadingMatches] = useState(false);
// savedJobIds comes from useSavedJobs hook (wired in Task 13)
// For now, use empty placeholder:
const savedJobIds = new Set<string>();
```

**Filter logic** (client-side filtering on `postings`):
```typescript
const filteredJobs = useMemo(() => {
  let result = postings;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(j =>
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.location?.toLowerCase().includes(q) ?? false)
    );
  }
  if (filters.roleType) {
    result = result.filter(j => j.category === filters.roleType);
  }
  if (filters.remote) {
    result = result.filter(j => {
      const loc = (j.location ?? "").toLowerCase();
      if (filters.remote === "remote") return loc.includes("remote");
      if (filters.remote === "onsite") return !loc.includes("remote");
      return true; // hybrid — show all
    });
  }
  if (filters.recency) {
    const now = Date.now();
    const cutoff = { day: 1, week: 7, month: 30 }[filters.recency] ?? 30;
    result = result.filter(j => {
      if (!j.datePosted) return true;
      const age = (now - new Date(j.datePosted).getTime()) / (1000 * 60 * 60 * 24);
      return age <= cutoff;
    });
  }
  if (filters.h1b) {
    result = result.filter(j =>
      j.tags?.some(t => t.toLowerCase().includes("h1b") || t.toLowerCase().includes("sponsor"))
    );
  }
  return result;
}, [postings, filters]);
```

**Selected job:**
```typescript
const selectedJob = useMemo(
  () => filteredJobs.find(j => j.id === selectedJobId) ?? null,
  [filteredJobs, selectedJobId]
);
```

**Layout:**
```jsx
<div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
  <SmartFeedHeader user={user} />
  <SummaryStrip
    mode={isAuth ? "personal" : "public"}
    marketHeat={marketHeat}
    freshToday={freshToday}
    competitionLevel={competitionLevel}
  />
  {isAuth && (
    <TabBar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: "for-you", label: "For You" },
        { id: "all-jobs", label: "All Jobs" },
        { id: "saved", label: "Saved", count: savedJobIds.size },
      ]}
    />
  )}
  <FilterBar filters={filters} onChange={setFilters} />
  <div className="flex-1 flex">
    <div className="w-full lg:w-[55%] xl:w-[60%] border-r border-stone-200 dark:border-stone-800">
      <JobFeed
        jobs={filteredJobs}
        matches={matches}
        selectedJobId={selectedJobId}
        savedJobIds={savedJobIds}
        isAuthenticated={isAuth}
        onSelectJob={setSelectedJobId}
        onToggleSave={handleToggleSave}
        isLoading={isLoadingMatches}
      />
    </div>
    <div className="hidden lg:block lg:w-[45%] xl:w-[40%]">
      <DetailPanel
        job={selectedJob}
        match={selectedJob ? matches[selectedJob.id] : null}
        isSaved={selectedJob ? savedJobIds.has(selectedJob.id) : false}
        isAuthenticated={isAuth}
        onToggleSave={handleToggleSave}
        onTailorClick={handleTailorClick}
        onAskAI={handleAskAI}
        jobDescription={selectedJob?.description}
      />
    </div>
  </div>
</div>
```

**Placeholder handlers** (wired in Tasks 12-14):
```typescript
const handleToggleSave = useCallback((job: SmartFeedJob) => {
  // Task 13: implement save/unsave
}, []);
const handleTailorClick = useCallback((job: SmartFeedJob) => {
  // Task 14: open QuickTailorPanel
}, []);
const handleAskAI = useCallback((job: SmartFeedJob) => {
  // Task 18: open AskAIPanel
}, []);
```

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: add SmartFeedShell orchestrator with public mode"
```

---

### Task 11: Rewrite app/page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite homepage to use SmartFeedShell**

Replace the entire content of `app/page.tsx`. Keep the existing server-side data fetching but pass to SmartFeedShell instead of HomeClientShell.

```typescript
import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { computeMarketInsights } from "@/lib/insights";
import { parseDatePostedToAge } from "@/lib/job-priority";
import { SmartFeedShell } from "@/components/smart-feed/SmartFeedShell";
import type { SmartFeedJob } from "@/components/smart-feed/types";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);

  const freshToday = githubData.jobs.filter((j) => {
    const age = parseDatePostedToAge(j.datePosted);
    return age !== null && age <= 1;
  }).length;

  // Map GitHub jobs to SmartFeedJob shape
  const postings: SmartFeedJob[] = githubData.jobs.slice(0, 60).map((j) => ({
    id: j.id,
    company: j.company,
    role: j.role,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted,
    category: j.category,
    tags: null,
    salary: null,
    description: null,
  }));

  return (
    <SmartFeedShell
      postings={postings}
      marketHeat={insights.marketHeat}
      freshToday={freshToday}
      competitionLevel={insights.competitionLevel}
    />
  );
}
```

**Note:** The old imports (`HomeClientShell`, `SummaryStrip`, `MainInsightCard`, `MarketBanner`, `InsightCards`, `computeJobPriority`, `computeFitBadges`) are no longer needed here. `MainInsightCard`, `InsightCards`, and `MarketBanner` will move to `/insights` in Task 19.

- [ ] **Step 2: Test public mode end-to-end**

Run `npm run dev`. Visit `http://localhost:3000` logged out. Verify:
1. SmartFeedHeader shows "Log in" + "Sign up free" buttons
2. SummaryStrip shows market stats (market heat, fresh today, competition)
3. No TabBar visible (public mode)
4. FilterBar renders with search + filter chips
5. JobFeed shows cards with "—" score rings (null scores)
6. Clicking a card → DetailPanel shows on right with job info
7. "Apply" button opens job URL in new tab
8. "Tailor Resume" and "Ask AI" show "Sign up to unlock" state
9. Theme toggle (light <-> dark) works and persists
10. Mobile: feed goes full width, no detail panel

- [ ] **Step 3: Commit**
```bash
git add app/page.tsx
git commit -m "feat: rewrite homepage to unified smart feed layout"
```

---

## Phase B: Auth Transformation + Real Matching (Tasks 12-14)

### Task 12: Auth-aware SmartFeedShell with REAL matching

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`

**CRITICAL: This task wires the real vector-matching engine, not the LLM batch-scorer.**

The real matching lives in `GET /api/dashboard/data` which:
1. Fetches user's resume from DB (text + embedding)
2. Fetches 100 recent jobs from `job_postings` table (with descriptions + embeddings)
3. Runs `batchMatchJobs()` — 60% cosine similarity + 40% keyword overlap
4. Returns `{ ok, hasResume, matchRows }` where each row has `match_score`, `skills_match`, `experience_match`, `match_reasons`, `missing_skills`, `is_saved`, `is_applied`, `job_postings: { id, company, role, location, url, description, tags, ... }`

- [ ] **Step 1: Add auth data fetching**

Add `useEffect` that fires when `isAuth` becomes true:

```typescript
useEffect(() => {
  if (!isAuth) return;

  async function fetchAuthData() {
    setIsLoadingMatches(true);
    try {
      // Fetch real match data from the vector-matching API
      // NOTE: saved jobs are handled by useSavedJobs hook (Task 13), not fetched here
      const dashRes = await fetch("/api/dashboard/data");

      // Process dashboard data (real matching)
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.ok && dashData.matchRows) {
          // Convert matchRows to SmartFeedJob[] and Record<string, JobMatch>
          const dbJobs: SmartFeedJob[] = [];
          const jobMatches: Record<string, JobMatch> = {};

          for (const row of dashData.matchRows) {
            const jp = row.job_postings;
            if (!jp) continue;
            // NOTE: jp.date_posted comes as ISO string from JSON serialization
            // (Prisma DateTime → Date → JSON.stringify → ISO string).
            // GitHub jobs have human-readable dates like "May 02".
            // Both formats are handled by getRelativeTime() in JobCard.
            const job: SmartFeedJob = {
              id: jp.id,
              company: jp.company,
              role: jp.role,
              location: jp.location,
              url: jp.url,
              datePosted: jp.date_posted ?? jp.created_at ?? null,
              tags: jp.tags,
              salary: formatSalary(jp.salary_min, jp.salary_max, jp.salary_interval),
              description: jp.description,
              category: undefined,
            };
            dbJobs.push(job);
            if (row.match_score != null) {
              jobMatches[jp.id] = {
                matchScore: row.match_score,
                skillsMatch: row.skills_match,
                experienceMatch: row.experience_match,
                matchReasons: row.match_reasons,
                missingSkills: row.missing_skills,
              };
            }
          }

          setAuthJobs(dbJobs);
          setMatches(jobMatches);
          setHasResume(dashData.hasResume);
        }
      }

    } catch (err) {
      console.error("[SmartFeedShell] auth data fetch error:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  }

  fetchAuthData();
}, [isAuth]);
```

- [ ] **Step 2: Add state for auth jobs and resume status**

```typescript
const [authJobs, setAuthJobs] = useState<SmartFeedJob[]>([]);
const [hasResume, setHasResume] = useState<boolean | null>(null);
```

- [ ] **Step 3: Switch data source based on auth + tab**

The `filteredJobs` computation now considers the active tab:

```typescript
const sourceJobs = useMemo(() => {
  if (!isAuth) return postings; // Public: GitHub CSV
  if (activeTab === "for-you") {
    // DB jobs sorted by match score (already sorted by API)
    return authJobs;
  }
  if (activeTab === "all-jobs") return postings; // Chronological GitHub jobs
  // saved/applied/tracking handled separately in Task 17
  return postings;
}, [isAuth, activeTab, postings, authJobs]);
```

Replace `postings` with `sourceJobs` in the filter logic.

- [ ] **Step 4: Add salary formatter**

**IMPORTANT:** Prisma returns `salary_min` and `salary_max` as `Prisma.Decimal` objects (not JS numbers). Must convert with `Number()` before arithmetic.

```typescript
function formatSalary(min?: unknown, max?: unknown, interval?: string | null): string | null {
  const minN = min != null ? Number(min) : null;
  const maxN = max != null ? Number(max) : null;
  if (!minN && !maxN) return null;
  const fmt = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  const suffix = interval === "hourly" ? "/hr" : "/yr";
  if (minN && maxN) return `${fmt(minN)} - ${fmt(maxN)}${suffix}`;
  if (minN) return `${fmt(minN)}+${suffix}`;
  return `Up to ${fmt(maxN!)}${suffix}`;
}
```

- [ ] **Step 5: Add no-resume onboarding banner**

When `isAuth && hasResume === false`, show a banner above the feed:

```jsx
{isAuth && hasResume === false && (
  <div className="mx-5 my-3 px-4 py-3 border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 flex items-center justify-between">
    <span className="font-mono text-sm text-orange-700 dark:text-orange-400">
      ▸ Upload your resume to see match scores
    </span>
    <a href="/resume" className="font-mono text-xs text-orange-600 border border-orange-600/50 bg-orange-600/10 px-3 py-1.5 hover:bg-orange-600/20 transition-colors">
      Upload Resume →
    </a>
  </div>
)}
```

- [ ] **Step 6: Update SummaryStrip personal stats**

Compute personal stats from matches:

```typescript
const personalStats = useMemo(() => {
  if (!isAuth || !authJobs.length) return null;
  const scored = Object.values(matches).filter(m => m.matchScore != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((sum, m) => sum + (m.matchScore ?? 0), 0) / scored.length)
    : 0;

  // Find the top match explicitly (don't assume array order)
  let topJob: SmartFeedJob | null = null;
  let topScore = 0;
  for (const job of authJobs) {
    const score = matches[job.id]?.matchScore ?? 0;
    if (score > topScore) {
      topJob = job;
      topScore = score;
    }
  }

  return {
    matchCount: scored.length,
    avgScore,
    appliedCount: 0,     // Task 17 will populate from saved jobs
    interviewCount: 0,   // Task 17 will populate from saved jobs
    aiNudge: topJob
      ? `Apply to ${topJob.company} — ${topScore}% match`
      : undefined,
  };
}, [isAuth, authJobs, matches]);
```

Pass to SummaryStrip:
```jsx
<SummaryStrip
  mode={isAuth ? "personal" : "public"}
  marketHeat={marketHeat}
  freshToday={freshToday}
  competitionLevel={competitionLevel}
  {...(personalStats ?? {})}
/>
```

- [ ] **Step 7: Set default tab based on auth**

```typescript
// When auth state resolves, set default tab
useEffect(() => {
  if (isAuth && hasResume) {
    setActiveTab("for-you");
  } else {
    setActiveTab("all-jobs");
  }
}, [isAuth, hasResume]);
```

- [ ] **Step 8: Test auth transformation**

Run `npm run dev`. Log in with a test account. Verify:
1. Header shows avatar + theme toggle (no login/signup buttons)
2. SummaryStrip shows personal stats (match count, avg score)
3. TabBar appears with "For You" and "All Jobs"
4. "For You" tab shows DB jobs with real match scores (from vector matching)
5. "All Jobs" tab shows GitHub jobs (chronological, no scores)
6. Job cards show real match percentages + skill tags (matched ✓, missing ✗)
7. DetailPanel shows large match ring + skills breakdown
8. If no resume uploaded: onboarding banner appears, "For You" shows no scores
9. Switching tabs works correctly

- [ ] **Step 9: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: auth-aware SmartFeedShell with real vector matching from /api/dashboard/data"
```

---

### Task 13: Save job functionality

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`

**IMPORTANT:** Reuse the existing `useSavedJobs` hook (`hooks/useSavedJobs.ts`) instead of writing custom save logic. This hook already handles:
- Optimistic updates
- Guest mode (localStorage fallback)
- Auth-aware API calls (POST/DELETE to `/api/jobs/saved`)
- Deduplication and error recovery

- [ ] **Step 1: Replace inline saved state with useSavedJobs hook**

Remove the manual `savedJobIds` state and the `/api/jobs/saved` fetch from the auth data loading. Replace with:

```typescript
import { useSavedJobs } from "@/hooks/useSavedJobs";

// Inside SmartFeedShell:
const { savedJobIds, isSaved, toggleSavedJob, loading: savedLoading } = useSavedJobs();
const savedJobIdSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);
```

Replace the placeholder `handleToggleSave`:
```typescript
const handleToggleSave = useCallback((job: SmartFeedJob) => {
  toggleSavedJob({
    id: job.id,
    company: job.company,
    role: job.role,
    location: job.location,
    url: job.url,
  });
}, [toggleSavedJob]);
```

Update all references: pass `savedJobIds={savedJobIdSet}` to `JobFeed`, and use `isSaved(job.id)` in `DetailPanel`.

Also remove the `/api/jobs/saved` fetch from the `fetchAuthData` effect in Task 12 — `useSavedJobs` handles that.

- [ ] **Step 2: Test save functionality**

Log in → click ♡ on a job → verify heart fills (optimistic) → refresh → verify saved state persists.
Log out → click ♡ → verify saves to localStorage (guest mode).

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: wire useSavedJobs hook into SmartFeedShell"
```

---

### Task 14: QuickTailor integration

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Wire QuickTailorPanel**

Add state and implement handleTailorClick:

```typescript
const [tailorOpen, setTailorOpen] = useState(false);
const [tailorJob, setTailorJob] = useState<{ company: string; role: string; description?: string } | null>(null);
const [resumeText, setResumeText] = useState<string | null>(null);

// Fetch resume text when auth (add to existing auth fetch)
// In the dashRes processing, also store resume text for tailor:
// After fetchAuthData, also fetch resume text:
useEffect(() => {
  if (!isAuth) return;
  fetch("/api/resume/data")
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data?.ok && data.resume?.resume_text) {
        setResumeText(data.resume.resume_text);
      }
    })
    .catch(() => {});
}, [isAuth]);

const handleTailorClick = useCallback((job: SmartFeedJob) => {
  if (!isAuth) { window.location.href = "/login"; return; }
  if (!resumeText) { /* show "Upload resume first" in banner */ return; }
  setTailorJob({ company: job.company, role: job.role, description: job.description ?? undefined });
  setTailorOpen(true);
}, [isAuth, resumeText]);
```

Add to render (after the main layout div):
```jsx
<QuickTailorPanel
  isOpen={tailorOpen}
  onClose={() => setTailorOpen(false)}
  jobContext={tailorJob}
  savedResumeText={resumeText}
/>
```

Import `QuickTailorPanel` from `@/components/dashboard/QuickTailorPanel`. Check the existing component's props interface first and adapt if needed.

- [ ] **Step 2: Test**

Select a job → click "Tailor Resume" → QuickTailorPanel slides in with job context.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: integrate QuickTailorPanel into smart feed"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| A (Layout) | 3-11 | Smart feed working in public mode — header, filters, cards, detail panel, theme toggle |
| B (Auth + Matching) | 12-14 | Auth transformation with REAL vector match scores, save jobs, tailor resume |

**After Phase B completes, the homepage will:**
- Show public users a browsable job feed with filters (GitHub CSV data, no scores)
- Show authenticated users real match scores from the vector-matching engine (DB data)
- Let users save jobs, tailor resumes, and see skill gap analysis

**Remaining tasks (15-21) from the original plan** cover application tracking, Ask AI, insights page update, and cleanup. These can be tackled in a follow-up session.

**Total new files:** 8 (7 in `components/smart-feed/` + 1 types file)
**Total modified:** 3 (`app/page.tsx`, `SummaryStrip.tsx`, `SmartFeedShell.tsx` iteratively)
**Total tasks:** 12 (Tasks 3-14)

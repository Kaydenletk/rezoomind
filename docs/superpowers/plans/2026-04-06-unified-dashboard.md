# Unified Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragmented homepage + dashboard with a single smart feed page that transforms from public job board → personal AI command center after login.

**Architecture:** One page (`/`) with auth-aware rendering. Feed + Detail Panel layout (like Jobright). Light mode default with dark toggle. Public users browse freely; AI features gated behind free signup. All existing backend APIs reused as-is.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, NextAuth, Prisma, existing Gemini AI endpoints.

**Spec:** `docs/superpowers/specs/2026-04-06-unified-dashboard-design.md`

---

## File Structure

### New files (in `components/smart-feed/`)

| File | Responsibility |
|------|---------------|
| `SmartFeedHeader.tsx` | Responsive header with public/personal states, theme toggle, avatar dropdown |
| `JobCard.tsx` | Single job card — score ring, company, role, salary, skill tags |
| `JobFeed.tsx` | Scrollable list of JobCards with selection state |
| `DetailPanel.tsx` | Right-side panel — job details, actions (Apply, Tailor, Ask AI), status selector |
| `TabBar.tsx` | For You / All Jobs / Saved / Applied / Tracking tabs |
| `FilterBar.tsx` | Horizontal filter chips with dismiss + save preset |
| `SmartFeedShell.tsx` | Main orchestrator — manages state, fetches data, composes all components |

### Modified files

| File | Change |
|------|--------|
| `app/page.tsx` | Rewrite to render SmartFeedShell with server-fetched data |
| `components/dashboard/SummaryStrip.tsx` | Add `mode: "public" \| "personal"` prop, personal stats + AI nudge |
| `components/dashboard/MatchScoreRing.tsx` | Add `score: number \| null` support — null renders "—" |
| `prisma/schema.prisma` | Add `status`, `appliedAt`, `interviewDate`, `notes` to SavedJob |
| `app/api/jobs/saved/route.ts` | Add PATCH for status updates, return status in GET |
| `CLAUDE.md` | Update design system section to reflect light-default + dark toggle |

---

## Phase A: Layout + Public Mode

### Task 1: Theme infrastructure + CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update CLAUDE.md design system to support light/dark toggle**

In `CLAUDE.md`, update the Design System section to reflect light-default with dark toggle. Replace the "What to AVOID" rule about light mode with:
```
- ❌ Dark-only designs — all new pages must support both light and dark via Tailwind `dark:` variants
```

Add to the Visual Language table:
```
| **Theme default** | Light (`bg-stone-50`). Dark toggle available. Use `dark:` variants for all color tokens. |
```

- [ ] **Step 2: Fix dark mode in layout.tsx**

In `app/layout.tsx`:
1. Add `suppressHydrationWarning` to the `<html>` tag
2. Add inline script to prevent flash: `<script dangerouslySetInnerHTML={{ __html: "if(localStorage.theme==='dark')document.documentElement.classList.add('dark')" }} />`
3. Add `dark:` variants to the `<body>` className: `bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100`

- [ ] **Step 3: Commit**
```bash
git add CLAUDE.md app/layout.tsx
git commit -m "feat: update design system for light-default with dark toggle"
```

---

### Task 2: MatchScoreRing — add null state

**Files:**
- Modify: `components/dashboard/MatchScoreRing.tsx`

- [ ] **Step 1: Update MatchScoreRing to accept `score: number | null`**

Change the props interface:
```typescript
interface MatchScoreRingProps {
  score: number | null;
  size?: number;
}
```

When `score` is `null`, render a gray ring (stroke `#a8a29e` / stone-400) with "—" text in center instead of `{score}%`. No animation for null state.

Also fix the track (background circle) color for light mode: the current hardcoded `stroke="#292524"` (stone-800) is too dark on light backgrounds. Change to use a CSS variable or conditional: `stroke="#e7e5e4"` (stone-200) in light mode, `stroke="#292524"` (stone-800) in dark mode. Use `className` with Tailwind `stroke-stone-200 dark:stroke-stone-800` on the track circle SVG.

- [ ] **Step 2: Verify visually**

Run `npm run dev`. Check that existing usage still renders correctly (numeric scores). The null state will be tested when we build JobCard.

- [ ] **Step 3: Commit**
```bash
git add components/dashboard/MatchScoreRing.tsx
git commit -m "feat: MatchScoreRing supports null score with dash display"
```

---

### Task 3: SmartFeedHeader component

**Files:**
- Create: `components/smart-feed/SmartFeedHeader.tsx`

- [ ] **Step 1: Build SmartFeedHeader**

```typescript
// Props:
interface SmartFeedHeaderProps {
  user: { name?: string | null; email?: string | null } | null;
}
```

Structure:
- Horizontal bar, sticky top, `bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800`
- Left: `rezoomind` logo (orange, monospace, tracking-wider, links to `/`)
- Right (public): "Log in" ghost button + "Sign up free" orange filled button
- Right (personal): Theme toggle (sun/moon icon, toggles `dark` class on `<html>` + saves to localStorage) + avatar circle (first letter of name/email, orange bg) with dropdown (Resume → `/resume`, Preferences → `/preferences`, Logout)
- Mobile: hamburger menu, same items in slide-out panel
- No rounded corners on buttons, use monospace for brand text

- [ ] **Step 2: Verify in isolation**

Temporarily import into `app/page.tsx` to verify both states. Check light/dark toggle works.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedHeader.tsx
git commit -m "feat: add SmartFeedHeader with auth states and theme toggle"
```

---

### Task 4: JobCard component

**Files:**
- Create: `components/smart-feed/JobCard.tsx`

- [ ] **Step 1: Build JobCard**

```typescript
export interface JobCardJob {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  datePosted: string | null;
  salary?: string | null;
  tags?: string[] | null;
}

export interface JobCardMatch {
  matchScore: number | null;
  skillsMatch?: number | null;
  matchReasons?: string[] | null;
  missingSkills?: string[] | null;
}

interface JobCardProps {
  job: JobCardJob;
  match?: JobCardMatch | null;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (id: string) => void;
  onToggleSave: (job: JobCardJob) => void;
  isAuthenticated: boolean;
}
```

Layout (horizontal card):
- Left: `MatchScoreRing` (size=36). Public: `score={null}`. Personal: `score={match.matchScore}`
- Center: company + role (bold), location + salary + time ago. If authenticated and match exists, show up to 4 skill tags inline: green for matched (`✓`), red for missing (`✗`)
- Right: save button (♡ outline / ♥ filled if saved), time since posted
- Selected state: `bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800`
- Normal: `bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800`
- No rounded corners, sharp border, monospace for company name
- Click anywhere on card → `onSelect(job.id)`
- Heart click → `onToggleSave(job)` (stop propagation)

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/JobCard.tsx
git commit -m "feat: add JobCard component with match scores and skill tags"
```

---

### Task 5: FilterBar component

**Files:**
- Create: `components/smart-feed/FilterBar.tsx`

- [ ] **Step 1: Build FilterBar**

```typescript
export interface Filters {
  search: string;
  roleType: string | null;    // "intern" | "new-grad" | null
  location: string | null;
  remote: string | null;       // "remote" | "onsite" | "hybrid" | null
  recency: string | null;      // "day" | "week" | "month" | null
  h1b: boolean;
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  showSavePreset?: boolean;
}
```

Layout:
- Search input with `>` cursor prefix (monospace, border-b only, transparent bg)
- Row of filter dropdowns as chips: Role type, Location, Remote, Recency, H1B
- Active filters shown as orange dismissible chips with `✕`
- `showSavePreset` adds "+ Save filter" dashed-border button (stores to localStorage)
- All chips: `bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400`
- Active chip: `bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400`

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/FilterBar.tsx
git commit -m "feat: add FilterBar with search, filters, and save preset"
```

---

### Task 6: DetailPanel component

**Files:**
- Create: `components/smart-feed/DetailPanel.tsx`

- [ ] **Step 1: Build DetailPanel**

```typescript
interface DetailPanelProps {
  job: JobCardJob | null;
  match?: JobCardMatch | null;
  isSaved: boolean;
  isAuthenticated: boolean;
  onToggleSave: (job: JobCardJob) => void;
  onTailorClick: (job: JobCardJob) => void;
  onAskAI: (job: JobCardJob) => void;
  onStatusChange?: (jobId: string, status: string) => void;
  jobDescription?: string | null;
}
```

Layout (sticky, right side, scrolls independently):
- If `job` is null: empty state "Select a job to see details"
- Header: role title (monospace, bold), company, location, salary, posting time, save ♡ button
- Match section (only if authenticated + match exists): Large `MatchScoreRing` (size=64) + matched skills (green ✓ tags) + missing skills (red ✗ tags)
- Actions row:
  - "Apply" — primary CTA (`bg-orange-600 text-white`), opens `job.url` in new tab
  - "✦ Tailor Resume" — secondary, opens tailor (if not auth: shows "Sign up to unlock" tooltip)
  - "Ask AI" — secondary (if not auth: shows "Sign up to unlock" tooltip)
- Status selector (personal only): dropdown — "Save" / "Mark Applied" / "Add Interview Date"
- Job description: expandable, first 400 chars visible, "Show more" toggle
- Mobile: renders as a bottom sheet (fixed bottom, slides up with Framer Motion)

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/DetailPanel.tsx
git commit -m "feat: add DetailPanel with job details, actions, and gated AI features"
```

---

### Task 7: TabBar component

**Files:**
- Create: `components/smart-feed/TabBar.tsx`

- [ ] **Step 1: Build TabBar**

```typescript
export type TabId = "for-you" | "all-jobs" | "saved" | "applied" | "tracking";

interface Tab {
  id: TabId;
  label: string;
  count?: number;
  dot?: "green" | "orange" | null;  // for Tracking tab live indicator
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs: Tab[];
}
```

Layout:
- Horizontal row below summary strip, above filter bar
- Each tab: text label + optional count badge
- Active tab: `text-orange-600 dark:text-orange-500 border-b-2 border-orange-600`
- Inactive: `text-stone-500 hover:text-stone-700 dark:hover:text-stone-300`
- Monospace font for labels
- Mobile: horizontally scrollable if needed

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
interface JobFeedProps {
  jobs: JobCardJob[];
  matches?: Record<string, JobCardMatch>;  // keyed by job id
  selectedJobId: string | null;
  savedJobIds: Set<string>;
  isAuthenticated: boolean;
  onSelectJob: (id: string) => void;
  onToggleSave: (job: JobCardJob) => void;
  isLoading: boolean;
}
```

Layout:
- Scrollable list of `JobCard` components
- Loading state: 6 skeleton cards (pulsing gray rectangles matching card dimensions)
- Empty state: "No jobs match your filters" message
- First job auto-selected on mount if none selected
- Scroll container with `max-h-[calc(100vh-200px)]` overflow-y-auto

- [ ] **Step 2: Commit**
```bash
git add components/smart-feed/JobFeed.tsx
git commit -m "feat: add JobFeed scrollable list with loading and empty states"
```

---

### Task 9: SummaryStrip — add personal mode

**Files:**
- Modify: `components/dashboard/SummaryStrip.tsx`

- [ ] **Step 1: Extend SummaryStrip with personal mode**

Add new props interface:
```typescript
interface SummaryStripProps {
  mode: "public" | "personal";
  // Public mode (existing):
  marketHeat?: MarketInsights["marketHeat"];
  freshToday?: number;
  competitionLevel?: MarketInsights["competitionLevel"];
  // Personal mode (new):
  matchCount?: number;
  avgScore?: number;
  appliedCount?: number;
  interviewCount?: number;
  aiNudge?: string;  // e.g., "Apply to Intapp — 98% match"
}
```

Personal mode renders:
- Left: `{matchCount} matches | {avgScore}% avg | {appliedCount} applied | {interviewCount} interviews`
- Right: AI nudge text in orange with ✦ prefix
- Both modes: `bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800`
- Public mode: add subtle CTA link "✦ Sign up for personalized matches" on right side

Keep backward compatibility — existing public mode usage unchanged.

- [ ] **Step 2: Commit**
```bash
git add components/dashboard/SummaryStrip.tsx
git commit -m "feat: SummaryStrip supports personal mode with stats and AI nudge"
```

---

### Task 10: SmartFeedShell — main orchestrator

**Files:**
- Create: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Build SmartFeedShell (public mode first)**

This is the main client component that composes everything. Start with public mode only.

```typescript
interface SmartFeedShellProps {
  children?: React.ReactNode;  // server-rendered insights passed through
  postings: Posting[];         // from server fetch
  marketInsights: MarketInsights;
  freshToday: number;
}
```

State management:
- `selectedJobId: string | null` — which job is selected in feed
- `filters: Filters` — current filter state
- `filteredJobs` — computed from postings + filters (useMemo)

Layout:
```
<SmartFeedHeader />
<SummaryStrip mode="public" ... />
<FilterBar />
<div className="flex gap-0">  {/* feed + detail, no gap for clean look */}
  <div className="w-full lg:w-[60%] border-r border-stone-200 dark:border-stone-800">
    <JobFeed ... />
  </div>
  <div className="hidden lg:block lg:w-[40%]">
    <DetailPanel ... />
  </div>
</div>
```

Filter logic (client-side filtering on `postings`):
- Search: match against role, company, location (case-insensitive)
- Role type: check category field
- Remote: check location contains "remote"
- Recency: filter by datePosted age
- H1B: check tags for "H1B" or "Sponsor"

Mobile: hide DetailPanel, show only JobFeed. Selected job opens DetailPanel as full-screen overlay.

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

Replace current `app/page.tsx` content. Keep the server-side data fetching (dashboard stats, GitHub jobs, market insights) but pass to `SmartFeedShell` instead of `HomeClientShell`.

```typescript
export default async function HomePage() {
  const [stats, githubData] = await Promise.all([
    fetchDashboardStats(),
    fetchGitHubJobs(),
  ]);
  const trend = stats?.trend ?? [];
  const insights = computeMarketInsights(trend);
  const freshToday = /* same logic as current */;

  return (
    <SmartFeedShell
      postings={githubData.jobs}
      marketInsights={insights}
      freshToday={freshToday}
    />
  );
}
```

- [ ] **Step 2: Test public mode end-to-end**

Run `npm run dev`. Visit `http://localhost:3000` logged out. Verify:
- Header shows "Log in" + "Sign up free"
- Summary strip shows market stats
- Filter bar works (search, filters)
- Job feed shows cards with "—" scores
- Clicking card → detail panel shows on right
- "Apply" button opens job URL
- Theme toggle (light ↔ dark) works
- Mobile: feed only, no detail panel visible

- [ ] **Step 3: Commit**
```bash
git add app/page.tsx
git commit -m "feat: rewrite homepage to unified smart feed layout"
```

---

## Phase B: Auth Transformation + Matching

### Task 12: Auth-aware SmartFeedShell

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Add auth state and resume fetching**

Import `useSession` from next-auth/react. When authenticated:
1. Fetch resume data from `/api/resume/data` (GET)
2. Fetch batch match scores from `/api/matches/batch-score` (POST with job data + resume)
3. Fetch saved job IDs from `/api/jobs/saved` (GET)
4. Compute summary stats (match count, avg score)
5. Generate AI nudge from top match ("Apply to {company} — {score}% match")

**IMPORTANT — batch-score key mapping:** The `/api/matches/batch-score` API returns results keyed by `company|role` composite string (not job ID). When processing results, build the matches record by mapping: `const key = \`${job.company}|${job.role}\``  to look up each job's score. Store in the `matches` Record keyed by job `id` for downstream consumption by JobFeed/JobCard.

State additions:
```typescript
const { data: session } = useSession();
const isAuth = !!session?.user;
const [resume, setResume] = useState<{ text: string; keywords: string[] } | null>(null);
const [matches, setMatches] = useState<Record<string, JobCardMatch>>({});
const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
const [isLoadingMatches, setIsLoadingMatches] = useState(false);
```

Render changes:
- Pass `user={session?.user}` to SmartFeedHeader
- SummaryStrip: `mode={isAuth ? "personal" : "public"}`
- Show TabBar only when `isAuth` (initially just "For You" + "All Jobs" tabs)
- Pass `matches` to JobFeed
- Pass `isAuthenticated={isAuth}` to JobCard, DetailPanel

- [ ] **Step 2: Add no-resume onboarding state**

When authenticated but no resume: show a banner above the feed:
```
"Upload your resume to see match scores" [Upload Resume →]
```
Falls back to "All Jobs" tab. "For You" tab is disabled with tooltip "Upload resume first."

- [ ] **Step 3: Test auth transformation**

Run `npm run dev`. Log in with a test account. Verify:
- Header shows avatar + theme toggle (no login buttons)
- Summary strip shows personal stats
- TabBar appears with "For You" and "All Jobs"
- Job cards show real match scores + skill tags
- Detail panel shows match section + Tailor/Ask AI buttons
- If no resume: onboarding banner appears

- [ ] **Step 4: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: auth-aware SmartFeedShell with match scores and resume fetching"
```

---

### Task 13: Save job functionality

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`
- Modify: `components/smart-feed/JobCard.tsx`
- Modify: `components/smart-feed/DetailPanel.tsx`

- [ ] **Step 1: Wire up save/unsave in SmartFeedShell**

Add handlers:
```typescript
async function handleToggleSave(job: JobCardJob) {
  if (!isAuth) { router.push("/login"); return; }
  const isSaved = savedIds.has(job.id);
  // Optimistic update
  setSavedIds(prev => {
    const next = new Set(prev);
    isSaved ? next.delete(job.id) : next.add(job.id);
    return next;
  });
  // API call
  await fetch("/api/jobs/saved", {
    method: isSaved ? "DELETE" : "POST",
    body: JSON.stringify({ jobs: [{ id: job.id, company: job.company, role: job.role, location: job.location, url: job.url }] }),
  });
}
```

Pass `savedJobIds={savedIds}` and `onToggleSave={handleToggleSave}` to JobFeed and DetailPanel.

- [ ] **Step 2: Test save functionality**

Log in → click ♡ on a job → verify heart fills → refresh → verify saved state persists.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx components/smart-feed/JobCard.tsx components/smart-feed/DetailPanel.tsx
git commit -m "feat: save/unsave jobs with optimistic updates"
```

---

### Task 14: QuickTailor integration

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`
- Modify: `components/smart-feed/DetailPanel.tsx`

- [ ] **Step 1: Wire QuickTailorPanel into SmartFeedShell**

Add state:
```typescript
const [tailorOpen, setTailorOpen] = useState(false);
const [tailorJob, setTailorJob] = useState<{ company: string; role: string; description?: string } | null>(null);
```

When DetailPanel's "Tailor Resume" is clicked:
- If not auth → redirect to `/login`
- If no resume → show "Upload resume first" toast
- Otherwise → set `tailorJob` and `tailorOpen = true`

Render `<QuickTailorPanel isOpen={tailorOpen} onClose={() => setTailorOpen(false)} jobContext={tailorJob} savedResumeText={resume?.text} />` at the shell level.

- [ ] **Step 2: Test**

Select a job → click "Tailor Resume" → QuickTailorPanel slides in → shows match analysis.

- [ ] **Step 3: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx components/smart-feed/DetailPanel.tsx
git commit -m "feat: integrate QuickTailorPanel into detail panel"
```

---

## Phase C: Tracking + AI Features

### Task 15: Schema migration — SavedJob status

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add status fields to SavedJob**

```prisma
model SavedJob {
  id          String    @id @default(cuid())
  userId      String
  jobSourceId String
  company     String
  role        String
  location    String?
  url         String?
  status      String    @default("saved")  // saved | applied | phone_screen | interview | offer | rejected
  appliedAt   DateTime?
  interviewDate DateTime?
  notes       String?
  created_at  DateTime  @default(now()) @db.Timestamptz
  updated_at  DateTime  @default(now()) @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, jobSourceId])
  @@index([userId])
}
```

- [ ] **Step 2: Run migration**
```bash
npx prisma migrate dev --name add-saved-job-status
```

- [ ] **Step 3: Commit**
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add status, appliedAt, interviewDate to SavedJob model"
```

---

### Task 16: Update saved jobs API

**Files:**
- Modify: `app/api/jobs/saved/route.ts`

- [ ] **Step 1: Add PATCH handler for status updates**

```typescript
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobSourceId, status, interviewDate, notes } = await req.json();
  
  const updated = await prisma.savedJob.update({
    where: { userId_jobSourceId: { userId: session.user.id, jobSourceId } },
    data: {
      status,
      ...(status === "applied" && { appliedAt: new Date() }),
      ...(interviewDate && { interviewDate: new Date(interviewDate) }),
      ...(notes !== undefined && { notes }),
    },
  });

  return NextResponse.json({ ok: true, job: updated });
}
```

- [ ] **Step 2: Update GET to return full SavedJob data (including status)**

Modify the GET handler to return full SavedJob objects (not just IDs) so the frontend can populate Saved/Applied/Tracking tabs:
```typescript
const savedJobs = await prisma.savedJob.findMany({
  where: { userId: session.user.id },
  orderBy: { updated_at: "desc" },
});
return NextResponse.json({ ok: true, jobs: savedJobs });
```

- [ ] **Step 3: Commit**
```bash
git add app/api/jobs/saved/route.ts
git commit -m "feat: add PATCH for status updates, return full saved job data"
```

---

### Task 17: Saved / Applied / Tracking tabs

**Files:**
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Add tab-based filtering**

Expand state:
```typescript
const [activeTab, setActiveTab] = useState<TabId>("for-you");
const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
```

Fetch full saved jobs on mount (authenticated):
```typescript
const res = await fetch("/api/jobs/saved");
const data = await res.json();
setSavedJobs(data.jobs);
```

Tab filtering logic:
- "for-you": jobs sorted by match score (existing)
- "all-jobs": all postings chronologically
- "saved": `savedJobs.filter(j => j.status === "saved")` → map to job card data
- "applied": `savedJobs.filter(j => j.status === "applied")`
- "tracking": `savedJobs.filter(j => ["interview", "offer", "phone_screen"].includes(j.status))`

Update tab counts dynamically.

- [ ] **Step 2: Add status selector to DetailPanel**

When a job is saved, show a dropdown in DetailPanel:
- Options: Saved, Applied, Phone Screen, Interview, Offer, Rejected
- Changing status → calls PATCH `/api/jobs/saved` → updates local state
- "Interview" option shows date picker for interview date

- [ ] **Step 3: Add empty states for each tab**

- Saved: "Save jobs by clicking ♡ on any job card"
- Applied: "Mark jobs as applied to track your progress"
- Tracking: "Jobs with interview dates will appear here"

- [ ] **Step 4: Test pipeline flow**

Save a job → switch to Saved tab → verify it appears → mark as Applied → switch to Applied tab → verify → add interview date → switch to Tracking tab → verify.

- [ ] **Step 5: Commit**
```bash
git add components/smart-feed/SmartFeedShell.tsx components/smart-feed/DetailPanel.tsx
git commit -m "feat: add Saved, Applied, Tracking tabs with status management"
```

---

### Task 18: Ask AI contextual chat

**Files:**
- Create: `components/smart-feed/AskAIPanel.tsx`
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Build AskAIPanel**

```typescript
interface AskAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  job: { company: string; role: string; description?: string | null } | null;
}
```

Small slide-over panel (similar to QuickTailorPanel but narrower, max-w-md):
- Header: "Ask AI about {job.role} at {job.company}" + close button
- Quick action buttons: "Summarize", "Cover letter", "Interview prep"
- Chat input (monospace, `>` prefix)
- Messages list (user = orange bg, AI = stone bg)
- Calls `/api/chat` with job context in system message
- Uses Framer Motion for slide animation

- [ ] **Step 2: Wire into SmartFeedShell**

Add state: `askAIOpen`, `askAIJob`. When "Ask AI" clicked in DetailPanel → set state → AskAIPanel opens.

- [ ] **Step 3: Test**

Select job → click "Ask AI" → panel opens → click "Summarize" → AI responds with job summary.

- [ ] **Step 4: Commit**
```bash
git add components/smart-feed/AskAIPanel.tsx components/smart-feed/SmartFeedShell.tsx
git commit -m "feat: add contextual Ask AI panel for per-job chat"
```

---

### Task 19: Update /insights page header + preserve market content

**Files:**
- Modify: `app/insights/page.tsx`

- [ ] **Step 1: Replace DashboardHeader with SmartFeedHeader on insights page**

In `app/insights/page.tsx`, replace the `DashboardHeader` import with `SmartFeedHeader` so the header is consistent across `/` and `/insights`. Pass `user={null}` for now (it's a server component — wrap in a small client component if needed to get session).

- [ ] **Step 2: Add InsightCards and MainInsightCard to insights page**

These components currently only render on the homepage and will be lost after the rewrite. Move them to `/insights` page so the market summary cards (season status, 30-day trends, guidance) are preserved there. They fit naturally on the insights page alongside the chart.

- [ ] **Step 3: Commit**
```bash
git add app/insights/page.tsx
git commit -m "feat: update insights page header and add market summary cards"
```

---

### Task 20: Clean up dead code

**Files:**
- Remove or deprecate unused components

- [ ] **Step 1: Remove dead components**

After the new SmartFeedShell replaces HomeClientShell, these components are no longer imported anywhere. Verify each is unused with grep, then delete:
- `components/dashboard/HomeClientShell.tsx`
- `components/dashboard/AuthHeader.tsx`
- `components/dashboard/MatchingPreviewCard.tsx`
- `components/dashboard/ResumeUploadCard.tsx`
- `components/dashboard/ResumeStatusCard.tsx`
- `components/dashboard/MatchBadge.tsx`
- `components/dashboard/JobsTable.tsx`

Do NOT delete: `BestMatchCard.tsx`, `MainInsightCard.tsx`, `InsightCards.tsx`, `SummaryStrip.tsx`, `MatchScoreRing.tsx`, `QuickTailorPanel.tsx`, `MarketBanner.tsx`, `DashboardFooter.tsx` — these are still used.

- [ ] **Step 2: Commit**
```bash
git add -A
git commit -m "chore: remove dead components replaced by smart-feed"
```

---

### Task 21: Final verification

**Files:**
- Modify: `app/page.tsx` (if needed)
- Various fixes

- [ ] **Step 1: Run full build**
```bash
npm run build
```
Fix any TypeScript errors or build failures.

- [ ] **Step 2: End-to-end verification checklist**

1. Visit `/` logged out → job feed with "—" scores, market stats, login/signup
2. Sign up → redirected to `/` → page transforms to personal mode
3. Upload resume → match scores appear on job cards
4. "For You" tab shows AI-ranked jobs
5. Click job → details panel with Apply, Tailor, Ask AI
6. Save job → appears in Saved tab
7. Mark Applied → appears in Applied tab
8. Tailor Resume → QuickTailorPanel opens
9. Ask AI → contextual chat works
10. Theme toggle light ↔ dark → persists on reload
11. Mobile responsive → feed goes full width
12. `/insights` still works with full market data

- [ ] **Step 3: Final commit**
```bash
git add -A
git commit -m "feat: unified dashboard — one page, two modes, complete"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| A | 1–11 | New layout working in public mode (feed + detail panel, filters, theme) |
| B | 12–14 | Auth transformation with real match scores, save jobs, tailor resume |
| C | 15–21 | Application tracking pipeline, Ask AI, insights update, cleanup, verification |

**Total new files:** 8 components in `components/smart-feed/`
**Total modified:** 8 existing files
**Total tasks:** 21

# Phase 3 Feed Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the signal-first `/feed` redesign with trust strip, compact JobCard, inline AI reason, keyboard-first nav, and post-signup onboarding strip. UI-only; schema changes deferred to Phase 5.

**Architecture:** Nine commits on `main`, each leaving the app shippable. Foundation (derivations + copy) first, then visual components, then APIs, then onboarding, then docs + tests.

**Tech Stack:** Next.js 15 App Router · TypeScript · Tailwind CSS v4 · Framer Motion · NextAuth · Prisma · Vitest (unit) · Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-04-19-phase3-feed-redesign-design.md`

---

## File Map

### New files
| Path | Purpose |
|---|---|
| `components/smart-feed/TrustStrip.tsx` | Row of trust-signal counts above tabs |
| `components/smart-feed/StatusPill.tsx` | `NEW / SAVED / APPLIED` micro pill |
| `components/smart-feed/OnboardingStrip.tsx` | 3-step getting-started strip |
| `components/smart-feed/KeyboardHelpOverlay.tsx` | `?` help modal |
| `components/smart-feed/copy.ts` | Locked copy strings |
| `hooks/useFeedKeyboard.ts` | Global keyboard listener for feed |
| `lib/feed-derivations.ts` | Pure `deriveStatus` + `deriveAIReason` |
| `lib/feed-derivations.test.ts` | Vitest unit tests |
| `app/api/feed/aggregate/route.ts` | GET trust-strip counts |
| `app/api/interest/route.ts` | GET/POST user interest row |
| `tests/e2e/feed.spec.ts` | Playwright E2E |

### Modified files
| Path | Change |
|---|---|
| `components/smart-feed/JobCard.tsx` | Compact layout, AI reason row, status pill slot, confidence opacity |
| `components/smart-feed/DetailPanel.tsx` | Remove Explain tab, inline stream, cover-letter expand-button, Apply token |
| `components/smart-feed/FilterBar.tsx` | One-row, `⌘K` hint, `more…` popover for H1B |
| `components/smart-feed/SmartFeedShell.tsx` | Wire trust strip, onboarding strip, keyboard, derivations; remove OnboardingBanner; fetch /api/interest + /api/feed/aggregate |
| `components/smart-feed/MatchExplanationStream.tsx` | Add `compact` prop |
| `components/dashboard/MatchScoreRing.tsx` | Add `muted` prop |
| `CLAUDE.md` | Protected-files table add smart-feed/*; note Phase 3 locked |

### Deleted
- `components/smart-feed/OnboardingBanner.tsx`

---

## Task 1: Foundation — copy + derivations + tests

**Goal:** Land pure, tested primitives that the rest of the plan depends on. Zero UI change.

**Files:**
- Create: `components/smart-feed/copy.ts`
- Create: `lib/feed-derivations.ts`
- Create: `lib/feed-derivations.test.ts`

- [ ] **Step 1: Write `copy.ts` with all locked strings**

```ts
// components/smart-feed/copy.ts
export const FEED_COPY = {
  trust: {
    separator: " · ",
    freshSuffix: "fresh",
    verified: "cron verified",
    refreshedPrefix: "refreshed",
    appliedTodaySuffix: "applied today",
  },
  aiReason: {
    prefix: "✦ ",
    strong: (skills: string[], missing: string) =>
      `Strong fit — ${skills.join(", ")} match${missing ? `; missing: ${missing}` : ""}`,
    partial: (skills: string[], missing: string[]) =>
      `Partial fit — ${skills.join(", ")} match${missing.length ? `; gap: ${missing.join(", ")}` : ""}`,
    weak: (overlapCount: number) => `Weak fit — only ${overlapCount} overlap`,
  },
  keyboard: {
    footer: "j/k navigate · s save · t tailor · a apply · / search · ? help",
  },
  onboarding: {
    title: "getting_started",
    step1: "01 upload_resume",
    step2: "02 set_preferences",
    step3: "03 first_apply",
  },
  detail: {
    apply: "Apply",
    coverLetterCollapsed: "cover letter — generate",
    coverLetterExpanded: "cover letter — hide",
    viewSource: "view source posting",
  },
} as const;
```

- [ ] **Step 2: Write `feed-derivations.ts`**

```ts
// lib/feed-derivations.ts
import { FEED_COPY } from "@/components/smart-feed/copy";
import type { JobMatch, SmartFeedJob } from "@/components/smart-feed/types";

export type JobStatus = "new" | "saved" | "applied";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function deriveStatus(
  job: SmartFeedJob,
  savedIds: Set<string>,
  appliedIds: Set<string>,
  now: number = Date.now()
): JobStatus | null {
  if (appliedIds.has(job.id)) return "applied";
  if (savedIds.has(job.id)) return "saved";
  if (!job.datePosted) return null;
  const parsed = new Date(job.datePosted).getTime();
  if (isNaN(parsed)) return null;
  if (now - parsed <= ONE_DAY_MS) return "new";
  return null;
}

export function deriveAIReason(match: JobMatch | null | undefined): string | null {
  if (!match || match.matchScore == null) return null;
  const matched = match.matchReasons ?? [];
  const missing = match.missingSkills ?? [];
  const score = match.matchScore;

  if (score >= 75) {
    const skills = matched.slice(0, 3);
    const firstMissing = missing[0] ?? "";
    if (skills.length === 0) return null;
    return FEED_COPY.aiReason.strong(skills, firstMissing);
  }

  if (score >= 50) {
    const skills = matched.slice(0, 3);
    const gaps = missing.slice(0, 2);
    if (skills.length === 0) return null;
    return FEED_COPY.aiReason.partial(skills, gaps);
  }

  return FEED_COPY.aiReason.weak(matched.length);
}
```

- [ ] **Step 3: Write failing unit tests**

```ts
// lib/feed-derivations.test.ts
import { describe, expect, it } from "vitest";
import { deriveAIReason, deriveStatus } from "./feed-derivations";
import type { SmartFeedJob } from "@/components/smart-feed/types";

const baseJob: SmartFeedJob = {
  id: "j1",
  company: "Acme",
  role: "SWE Intern",
  location: "SF",
  url: null,
  datePosted: null,
};

describe("deriveStatus", () => {
  it("returns 'applied' when id is in appliedIds even if also saved", () => {
    expect(deriveStatus(baseJob, new Set(["j1"]), new Set(["j1"]))).toBe("applied");
  });

  it("returns 'saved' when id is in savedIds only", () => {
    expect(deriveStatus(baseJob, new Set(["j1"]), new Set())).toBe("saved");
  });

  it("returns 'new' when posted in the last 24 hours", () => {
    const job = { ...baseJob, datePosted: new Date("2026-04-19T10:00:00Z").toISOString() };
    const now = new Date("2026-04-19T20:00:00Z").getTime();
    expect(deriveStatus(job, new Set(), new Set(), now)).toBe("new");
  });

  it("returns null for a posting older than 24h and not saved/applied", () => {
    const job = { ...baseJob, datePosted: new Date("2026-04-17T10:00:00Z").toISOString() };
    const now = new Date("2026-04-19T20:00:00Z").getTime();
    expect(deriveStatus(job, new Set(), new Set(), now)).toBeNull();
  });

  it("returns null when datePosted is invalid", () => {
    const job = { ...baseJob, datePosted: "May 02" };
    expect(deriveStatus(job, new Set(), new Set())).toBeNull();
  });
});

describe("deriveAIReason", () => {
  it("returns null when match is null", () => {
    expect(deriveAIReason(null)).toBeNull();
  });

  it("returns null when matchScore is null", () => {
    expect(deriveAIReason({ matchScore: null })).toBeNull();
  });

  it("renders a Strong fit for score >= 75 with matched skills", () => {
    const out = deriveAIReason({
      matchScore: 90,
      matchReasons: ["Python", "SQL", "React", "AWS"],
      missingSkills: ["Kafka"],
    });
    expect(out).toBe("Strong fit — Python, SQL, React match; missing: Kafka");
  });

  it("renders a Partial fit for score 50-74", () => {
    const out = deriveAIReason({
      matchScore: 60,
      matchReasons: ["Python", "SQL"],
      missingSkills: ["Kafka", "Spark"],
    });
    expect(out).toBe("Partial fit — Python, SQL match; gap: Kafka, Spark");
  });

  it("renders a Weak fit for score < 50", () => {
    const out = deriveAIReason({
      matchScore: 30,
      matchReasons: ["Git"],
      missingSkills: [],
    });
    expect(out).toBe("Weak fit — only 1 overlap");
  });

  it("returns null for Strong fit with no matched skills", () => {
    const out = deriveAIReason({ matchScore: 80, matchReasons: [], missingSkills: ["X"] });
    expect(out).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run lib/feed-derivations.test.ts
```

Expected: all 11 assertions pass.

- [ ] **Step 5: Commit**

```bash
git add components/smart-feed/copy.ts lib/feed-derivations.ts lib/feed-derivations.test.ts
git commit -m "feat(feed): add copy tokens + pure derivations with vitest coverage"
```

---

## Task 2: TrustStrip component

**Goal:** Ship a data-derived trust row between `SummaryStrip` and `TabBar`.

**Files:**
- Create: `components/smart-feed/TrustStrip.tsx`
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Write `TrustStrip.tsx`**

```tsx
// components/smart-feed/TrustStrip.tsx
"use client";

import { FEED_COPY } from "./copy";

interface TrustStripProps {
  freshToday: number;
  refreshedAt: Date | null;
  appliedToday: number;
}

function getRelative(to: Date, now: number = Date.now()): string {
  const diffMinutes = Math.floor((now - to.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function TrustStrip({ freshToday, refreshedAt, appliedToday }: TrustStripProps) {
  const { separator, freshSuffix, verified, refreshedPrefix, appliedTodaySuffix } = FEED_COPY.trust;

  const items: string[] = [];
  if (freshToday > 0) items.push(`${freshToday} ${freshSuffix}`);
  items.push(verified);
  if (refreshedAt) items.push(`${refreshedPrefix} ${getRelative(refreshedAt)}`);
  if (appliedToday > 0) items.push(`${appliedToday} ${appliedTodaySuffix}`);

  if (items.length === 0) return null;

  return (
    <div className="px-5 py-1.5 border-b border-line-subtle bg-surface-sunken/40 text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
      {items.join(separator)}
    </div>
  );
}
```

- [ ] **Step 2: Mount `TrustStrip` in `SmartFeedShell.tsx`**

In `SmartFeedShell.tsx` add these imports at the top:

```tsx
import { TrustStrip } from "./TrustStrip";
```

Add new props to `SmartFeedShellProps`:

```tsx
interface SmartFeedShellProps {
  postings: SmartFeedJob[];
  marketHeat: MarketInsights["marketHeat"];
  freshToday: number;
  competitionLevel: MarketInsights["competitionLevel"];
  refreshedAt: string | null;  // NEW — serialized ISO from server
}
```

In the JSX, add `TrustStrip` directly below `SummaryStrip`:

```tsx
<SummaryStrip
  marketHeat={marketHeat}
  freshToday={freshToday}
  competitionLevel={competitionLevel}
/>
<TrustStrip
  freshToday={freshToday}
  refreshedAt={refreshedAt ? new Date(refreshedAt) : null}
  appliedToday={0}  // Phase 3 placeholder — wired in Task 7
/>
```

- [ ] **Step 3: Update `/app/feed/page.tsx` to pass `refreshedAt`**

Modify `app/feed/page.tsx`. After the `Promise.all`, compute:

```tsx
const refreshedAt = dbStats?.lastRefreshedAt ?? null;
```

Then pass to `<SmartFeedShell ... refreshedAt={refreshedAt} />`.

If `getDashboardStats()` does not currently return `lastRefreshedAt`, add it in `lib/dashboard.ts` by selecting the newest `job_postings.created_at`. Quickly check with:

```bash
grep -n "lastRefreshedAt\|latestPosting\|created_at" lib/dashboard.ts
```

If absent, add a `lastRefreshedAt: string | null` key derived from `prisma.job_postings.findFirst({ orderBy: { created_at: "desc" }, select: { created_at: true } })`.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Visit http://localhost:3000/feed. Confirm:
- Trust strip row visible under summary strip.
- Content matches format: `N fresh · cron verified · refreshed Xh ago`.
- No layout shift, no horizontal scroll.

- [ ] **Step 5: Commit**

```bash
git add components/smart-feed/TrustStrip.tsx components/smart-feed/SmartFeedShell.tsx app/feed/page.tsx lib/dashboard.ts
git commit -m "feat(feed): add trust strip between summary and tabs"
```

---

## Task 3: StatusPill + JobCard compact rewrite

**Goal:** Ship compact `JobCard` with inline AI reason, status pill, confidence opacity.

**Files:**
- Create: `components/smart-feed/StatusPill.tsx`
- Modify: `components/smart-feed/JobCard.tsx`
- Modify: `components/smart-feed/JobFeed.tsx` (pass `appliedJobIds` down)
- Modify: `components/dashboard/MatchScoreRing.tsx` (add `muted` prop)

- [ ] **Step 1: Write `StatusPill.tsx`**

```tsx
// components/smart-feed/StatusPill.tsx
"use client";

import type { JobStatus } from "@/lib/feed-derivations";

interface StatusPillProps {
  status: JobStatus;
}

const STYLES: Record<JobStatus, string> = {
  new: "text-orange-700 dark:text-orange-400 bg-orange-600/10 border border-orange-600/40",
  saved: "text-fg-muted bg-surface-sunken border border-line",
  applied:
    "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-600/40",
};

const LABELS: Record<JobStatus, string> = {
  new: "NEW",
  saved: "SAVED",
  applied: "APPLIED ✓",
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={[
        "text-[9px] uppercase tracking-[0.15em] font-mono px-1.5 py-0.5 leading-none",
        STYLES[status],
      ].join(" ")}
    >
      {LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: Add `muted` prop to `MatchScoreRing.tsx`**

Find the `MatchScoreRing` component. Add `muted?: boolean` to its props and, when `muted` is `true`, wrap the `<svg>` in `<div className="opacity-60">...</div>` (or apply `opacity-60` directly to the root). Also lower the stroke color to `stroke-fg-subtle` when muted.

Verify the prop set. Example signature:

```tsx
interface MatchScoreRingProps {
  score: number | null;
  size?: number;
  muted?: boolean;
}
```

- [ ] **Step 3: Rewrite `JobCard.tsx`**

Replace the file contents with:

```tsx
"use client";

import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { StatusPill } from "./StatusPill";
import { FEED_COPY } from "./copy";
import { deriveAIReason, deriveStatus } from "@/lib/feed-derivations";
import type { SmartFeedJob, JobMatch } from "./types";

interface JobCardProps {
  job: SmartFeedJob;
  match?: JobMatch | null;
  isSelected: boolean;
  isSaved: boolean;
  isApplied: boolean;
  onSelect: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isAuthenticated: boolean;
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function JobCard({
  job,
  match,
  isSelected,
  isSaved,
  isApplied,
  onSelect,
  onToggleSave,
  isAuthenticated,
}: JobCardProps) {
  const score = isAuthenticated ? match?.matchScore ?? null : null;
  const muted = isAuthenticated && score != null && score < 50;

  const savedSet = new Set(isSaved ? [job.id] : []);
  const appliedSet = new Set(isApplied ? [job.id] : []);
  const status = deriveStatus(job, savedSet, appliedSet);

  const aiReason = isAuthenticated ? deriveAIReason(match ?? null) : null;

  const relativeTime = getRelativeTime(job.datePosted);
  const metaParts = [job.location, job.salary, relativeTime].filter(Boolean);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(job.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job.id);
        }
      }}
      className={[
        "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-[background-color,transform]",
        isSelected
          ? "bg-orange-50 dark:bg-orange-950/40 border-l-[3px] border-l-orange-500 translate-x-[2px]"
          : "bg-surface-raised border-b border-line border-l-[3px] border-l-transparent hover:bg-surface-sunken/60",
        muted && !isSelected ? "opacity-70 hover:opacity-100" : "",
      ].join(" ")}
    >
      <div className="shrink-0 mt-0.5">
        <MatchScoreRing score={score} size={32} muted={muted} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className={[
              "font-mono text-sm text-fg truncate",
              isSelected ? "font-bold" : "font-semibold",
            ].join(" ")}
          >
            {job.company}
          </span>
          <span className="text-fg-subtle text-sm">·</span>
          <span className="text-fg-muted text-sm font-medium truncate">{job.role}</span>
        </div>

        {metaParts.length > 0 && (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-fg-subtle text-[11px] font-mono">
            {metaParts.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="mr-2">·</span>}
                {part}
              </span>
            ))}
          </div>
        )}

        {aiReason && (
          <p className="mt-1 text-[11px] text-fg-muted font-mono truncate">
            <span className="text-orange-700 dark:text-orange-400">{FEED_COPY.aiReason.prefix}</span>
            {aiReason}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">
        {status && <StatusPill status={status} />}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(job);
          }}
          className="text-lg leading-none transition-colors"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <span className="text-orange-500">♥</span>
          ) : (
            <span className="text-fg-muted hover:text-orange-400">♡</span>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update `JobFeed.tsx` to pass `appliedJobIds`**

Open `components/smart-feed/JobFeed.tsx`. Add a new prop `appliedJobIds: Set<string>` defaulting to an empty set. Pass `isApplied={appliedJobIds.has(job.id)}` into each `<JobCard />`.

If the file's current prop signature does not accept a set, the minimal addition is:

```tsx
interface JobFeedProps {
  jobs: SmartFeedJob[];
  matches: Record<string, JobMatch>;
  selectedJobId: string | null;
  savedJobIds: Set<string>;
  appliedJobIds?: Set<string>; // NEW — default new Set()
  isAuthenticated: boolean;
  onSelectJob: (id: string) => void;
  onToggleSave: (job: SmartFeedJob) => void;
  isLoading: boolean;
}
```

In the map, pass:

```tsx
<JobCard
  {...existing props}
  isApplied={appliedJobIds?.has(job.id) ?? false}
/>
```

- [ ] **Step 5: Update `SmartFeedShell.tsx` to wire `appliedJobIds`**

In `SmartFeedShell.tsx`, add a local `appliedJobIds` constant `new Set<string>()` (Phase 3 placeholder) and pass it to `<JobFeed appliedJobIds={appliedJobIds} />`. This slot is filled by Phase 5 from a `useAppliedJobs` hook.

- [ ] **Step 6: Manual smoke test**

```bash
npm run dev
```

At http://localhost:3000/feed:
- Unauth: cards ~60px tall, no AI reason row, no status pill.
- Authed with resume: AI reason row shows under meta. NEW pill shows on fresh postings.
- Selected state: left rail 3px, 2px shift, bold company.
- Card with score < 50: visibly dimmer until hover.

- [ ] **Step 7: Commit**

```bash
git add components/smart-feed/StatusPill.tsx components/smart-feed/JobCard.tsx components/smart-feed/JobFeed.tsx components/smart-feed/SmartFeedShell.tsx components/dashboard/MatchScoreRing.tsx
git commit -m "feat(feed): compact JobCard with inline AI reason, status pill, confidence opacity"
```

---

## Task 4: DetailPanel simplification

**Goal:** Merge Explain into Overview, replace tab bar with single cover-letter expand, use brand-primary token on Apply.

**Files:**
- Modify: `components/smart-feed/DetailPanel.tsx`
- Modify: `components/smart-feed/MatchExplanationStream.tsx`
- Modify: `components/smart-feed/types.ts` (remove `DetailPanelMode` third option)
- Modify: `components/smart-feed/SmartFeedShell.tsx` (drop `panelMode`, `onPanelModeChange` plumbing)

- [ ] **Step 1: Add `compact` prop to `MatchExplanationStream.tsx`**

Open `components/smart-feed/MatchExplanationStream.tsx`. Add:

```tsx
interface MatchExplanationStreamProps {
  // existing props…
  compact?: boolean;
}
```

When `compact` is `true`, skip rendering the faux terminal window chrome (title bar, `.exe` label, outer border) and render the streaming body as a bare block with only a top divider:

```tsx
if (compact) {
  return (
    <div className="border-t border-line-subtle pt-3 mt-3">
      {/* streaming body only */}
    </div>
  );
}
```

Keep the non-compact path unchanged.

- [ ] **Step 2: Remove `DetailPanelMode` tab system from `types.ts`**

Replace:

```tsx
export type DetailPanelMode = "overview" | "explain" | "cover-letter";
```

with:

```tsx
// DetailPanelMode removed in Phase 3 — DetailPanel now uses a single inline flow.
```

Any file importing `DetailPanelMode` is covered by this task.

- [ ] **Step 3: Rewrite `DetailPanel.tsx`**

Replace the file contents with:

```tsx
"use client";

import { useState, useEffect } from "react";
import { MatchScoreRing } from "@/components/dashboard/MatchScoreRing";
import { MatchExplanationStream } from "./MatchExplanationStream";
import { CoverLetterStream } from "./CoverLetterStream";
import { FEED_COPY } from "./copy";
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
  savedResumeText: string | null;
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function DetailPanel({
  job,
  match,
  isSaved,
  isAuthenticated,
  onToggleSave,
  onTailorClick,
  jobDescription,
  savedResumeText,
}: DetailPanelProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  // Reset local toggles when switching jobs.
  useEffect(() => {
    setDescExpanded(false);
    setCoverOpen(false);
  }, [job?.id]);

  if (!job) {
    return (
      <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-surface-raised flex items-center justify-center">
        <div className="text-center space-y-3">
          <svg
            className="mx-auto text-fg-subtle"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="2" y="7" width="20" height="14" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          <p className="font-mono text-sm text-fg-muted">Select a job to see details</p>
        </div>
      </div>
    );
  }

  const description = jobDescription ?? job.description ?? null;
  const descTruncated =
    description && description.length > 400 ? description.slice(0, 400) + "…" : description;

  const hasMatch = isAuthenticated && match != null && match.matchScore != null;
  const matchedSkills = match?.matchReasons ?? [];
  const missingSkills = match?.missingSkills ?? [];
  const relativeTime = getRelativeTime(job.datePosted);
  const metaParts = [job.location, job.salary, relativeTime].filter(Boolean);

  return (
    <div className="sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-mono font-bold text-lg text-fg leading-snug">{job.role}</h2>
          <p className="text-sm text-fg-muted font-mono mt-0.5">{job.company}</p>
          {metaParts.length > 0 && (
            <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-1 text-xs text-fg-subtle font-mono">
              {metaParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span>·</span>}
                  {part}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleSave(job)}
          className="shrink-0 text-xl leading-none transition-colors"
          aria-label={isSaved ? "Unsave job" : "Save job"}
        >
          {isSaved ? (
            <span className="text-orange-500">♥</span>
          ) : (
            <span className="text-fg-muted hover:text-orange-400">♡</span>
          )}
        </button>
      </div>

      <div className="flex items-stretch gap-2 mb-4">
        <button
          type="button"
          onClick={() => job.url && window.open(job.url, "_blank")}
          disabled={!job.url}
          className="flex-1 bg-brand-primary hover:bg-orange-700 disabled:bg-surface-sunken disabled:cursor-not-allowed text-white font-mono text-sm px-4 py-2 transition-colors text-center inline-flex items-center justify-center gap-1.5 group"
        >
          {FEED_COPY.detail.apply}
          <span className="opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
        </button>

        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => onTailorClick(job)}
            className="border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 hover:bg-orange-600/20 font-mono text-sm px-4 py-2 transition-colors whitespace-nowrap"
          >
            ✦ Tailor
          </button>
        ) : (
          <a
            href="/signup"
            className="border border-line font-mono text-xs px-3 py-2 text-fg-subtle flex items-center whitespace-nowrap hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            Sign up for AI →
          </a>
        )}
      </div>

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="block mb-4 font-mono text-[11px] text-fg-subtle hover:text-fg-muted transition-colors"
        >
          → {FEED_COPY.detail.viewSource}
        </a>
      )}

      {hasMatch && (
        <div className="border border-line p-4 mb-4 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
            Match Analysis
          </p>
          <div className="flex items-center gap-4">
            <MatchScoreRing score={match!.matchScore} size={64} />
            <div className="space-y-1">
              {match!.skillsMatch != null && (
                <p className="font-mono text-xs text-fg-muted">Skills: {match!.skillsMatch}%</p>
              )}
              {match!.experienceMatch != null && (
                <p className="font-mono text-xs text-fg-muted">
                  Experience: {match!.experienceMatch}%
                </p>
              )}
            </div>
          </div>

          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill) => (
                <span
                  key={`match-${skill}`}
                  className="text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 font-mono text-[11px] px-2 py-1"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          )}

          {missingSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span
                  key={`missing-${skill}`}
                  className="text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 font-mono text-[11px] px-2 py-1"
                >
                  ✗ {skill}
                </span>
              ))}
            </div>
          )}

          <MatchExplanationStream
            jobTitle={job.role}
            companyName={job.company}
            overallScore={match!.matchScore!}
            skillMatch={match!.skillsMatch ?? 0}
            experienceMatch={match!.experienceMatch ?? 0}
            matchingSkills={matchedSkills}
            missingSkills={missingSkills}
            autoStart
            compact
          />
        </div>
      )}

      {description && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono mb-2">
            Description
          </p>
          <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-line">
            {descExpanded ? description : descTruncated}
          </p>
          {description.length > 400 && (
            <button
              type="button"
              onClick={() => setDescExpanded((prev) => !prev)}
              className="mt-2 font-mono text-xs text-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {hasMatch && (
        <button
          type="button"
          onClick={() => setCoverOpen((prev) => !prev)}
          className="mt-6 w-full text-left border-t border-line-subtle pt-3 font-mono text-xs text-orange-700 dark:text-orange-400 hover:text-orange-600 transition-colors flex items-center justify-between"
          aria-expanded={coverOpen}
        >
          <span>
            ✉ {coverOpen ? FEED_COPY.detail.coverLetterExpanded : FEED_COPY.detail.coverLetterCollapsed}
          </span>
          <span>{coverOpen ? "×" : "→"}</span>
        </button>
      )}

      {hasMatch && coverOpen && (
        <div className="mt-3">
          {savedResumeText ? (
            <CoverLetterStream
              resumeText={savedResumeText}
              jobTitle={job.role}
              companyName={job.company}
              jobDescription={description ?? ""}
            />
          ) : (
            <div className="border border-line p-5 text-center space-y-3">
              <p className="font-mono text-xs text-fg-subtle">
                Upload your resume to generate a tailored cover letter
              </p>
              <a
                href="/resume"
                className="inline-block border border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-400 font-mono text-xs px-4 py-2 hover:bg-orange-600/20 transition-colors"
              >
                ~/resume →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Remove panel-mode plumbing from `SmartFeedShell.tsx`**

Delete:
- `const [panelMode, setPanelMode] = useState<DetailPanelMode>("overview");`
- The `useEffect` that resets `setPanelMode("overview")` on `selectedJobId` change.
- The `handleAskAI` callback (now unused — drop it and its dependency `setPanelMode`).
- The `panelMode` and `onPanelModeChange` and `onAskAI` props passed to `<DetailPanel />`.

Also remove the import `type DetailPanelMode` from `./types`.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

Visit `/feed`, authenticate if needed, click a scored job:
- No tab bar in detail panel.
- Match Analysis section shows skills + ring + inline streaming explanation.
- Apply button orange-brand with `→`, hover shifts arrow.
- "view source posting" link renders under action row.
- At bottom: `✉ cover letter — generate →`. Click → CoverLetterStream renders. Click again → collapses.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
git add components/smart-feed/DetailPanel.tsx components/smart-feed/MatchExplanationStream.tsx components/smart-feed/types.ts components/smart-feed/SmartFeedShell.tsx
git commit -m "feat(feed): simplify DetailPanel — inline explain, single cover-letter toggle, brand-primary Apply"
```

---

## Task 5: FilterBar one-row variant

**Goal:** Single horizontal row with `⌘K` hint and `more…` popover for H1B.

**Files:**
- Modify: `components/smart-feed/FilterBar.tsx`

- [ ] **Step 1: Rewrite `FilterBar.tsx`**

Keep `Filters`, `DEFAULT_FILTERS`, `DropdownChip` as-is. Replace the exported `FilterBar` component with:

```tsx
export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [moreOpen]);

  function update(partial: Partial<Filters>) {
    onChange({ ...filters, ...partial });
  }

  const hasActiveFilters =
    filters.roleType !== null ||
    filters.remote !== null ||
    filters.recency !== null ||
    filters.h1b;

  return (
    <div className="px-5 py-2 border-b border-line bg-surface-raised/90">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
          <span className="text-orange-600 font-mono text-sm select-none shrink-0">&gt;</span>
          <input
            id="feed-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="search jobs..."
            className="flex-1 bg-transparent border-b border-line focus:border-orange-600 focus:outline-none font-mono text-sm text-fg placeholder:text-fg-subtle/70 py-0.5 transition-colors peer"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="text-fg-muted hover:text-fg font-mono text-xs transition-colors shrink-0"
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="hidden sm:inline text-[10px] text-fg-subtle font-mono tracking-[0.15em] peer-focus:opacity-0 transition-opacity select-none">
              ⌘K
            </span>
          )}
        </div>

        <DropdownChip
          label="Role"
          value={filters.roleType}
          options={ROLE_OPTIONS}
          onSelect={(v) => update({ roleType: v })}
        />
        <DropdownChip
          label="Remote"
          value={filters.remote}
          options={REMOTE_OPTIONS}
          onSelect={(v) => update({ remote: v })}
        />
        <DropdownChip
          label="Fresh"
          value={filters.recency}
          options={RECENCY_OPTIONS}
          onSelect={(v) => update({ recency: v })}
        />

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((p) => !p)}
            className="bg-surface-sunken border border-line text-fg-muted font-mono text-[11px] px-3 py-1.5 hover:border-fg-subtle transition-colors"
          >
            more…
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-surface-raised border border-line p-3 min-w-[160px] space-y-2">
              <label className="flex items-center gap-2 font-mono text-[11px] text-fg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.h1b}
                  onChange={(e) => update({ h1b: e.target.checked })}
                  className="accent-orange-600"
                />
                H1B sponsored
              </label>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...filters, roleType: null, remote: null, recency: null, h1b: false })
            }
            className="font-mono text-[11px] text-fg-muted hover:text-fg transition-colors"
          >
            clear all
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test**

Run `npm run dev`. At `/feed`:
- Search + chips on single row at ≥ 1024px viewport.
- `⌘K` hint visible when search empty and unfocused; hidden on focus.
- Click `more…` → popover with H1B checkbox; toggling updates feed.
- `clear all` resets to defaults.

- [ ] **Step 3: Commit**

```bash
git add components/smart-feed/FilterBar.tsx
git commit -m "feat(feed): one-row FilterBar with ⌘K hint and more… popover"
```

---

## Task 6: Keyboard hook + help overlay

**Goal:** Wire `j/k/s/t/a///?/esc` globally when focus is outside text inputs.

**Files:**
- Create: `hooks/useFeedKeyboard.ts`
- Create: `components/smart-feed/KeyboardHelpOverlay.tsx`
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Write `useFeedKeyboard.ts`**

```ts
// hooks/useFeedKeyboard.ts
"use client";

import { useEffect } from "react";

export interface FeedKeyboardHandlers {
  onNext: () => void;
  onPrev: () => void;
  onToggleSave: () => void;
  onTailor: () => void;
  onApply: () => void;
  onFocusSearch: () => void;
  onToggleHelp: () => void;
  onEscape: () => void;
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useFeedKeyboard(handlers: FeedKeyboardHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      switch (e.key) {
        case "j":
          e.preventDefault();
          handlers.onNext();
          break;
        case "k":
          e.preventDefault();
          handlers.onPrev();
          break;
        case "s":
          e.preventDefault();
          handlers.onToggleSave();
          break;
        case "t":
          e.preventDefault();
          handlers.onTailor();
          break;
        case "a":
          e.preventDefault();
          handlers.onApply();
          break;
        case "/":
          e.preventDefault();
          handlers.onFocusSearch();
          break;
        case "?":
          e.preventDefault();
          handlers.onToggleHelp();
          break;
        case "Escape":
          handlers.onEscape();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers, enabled]);
}
```

- [ ] **Step 2: Write `KeyboardHelpOverlay.tsx`**

```tsx
// components/smart-feed/KeyboardHelpOverlay.tsx
"use client";

import { useEffect, useRef } from "react";

interface KeyboardHelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { key: string; label: string }[] = [
  { key: "j", label: "next job" },
  { key: "k", label: "prev job" },
  { key: "s", label: "save / unsave" },
  { key: "t", label: "open tailor" },
  { key: "a", label: "apply (open url)" },
  { key: "/", label: "focus search" },
  { key: "?", label: "toggle this help" },
  { key: "esc", label: "clear / close" },
];

export function KeyboardHelpOverlay({ open, onClose }: KeyboardHelpOverlayProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-line w-[440px] max-w-[92vw] shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-7 border-b border-line-subtle bg-surface-sunken flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
          <span className="text-[10px] text-fg-subtle ml-2 tracking-wider">help.exe</span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="ml-auto text-fg-muted hover:text-fg font-mono text-xs"
            aria-label="Close help"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono mb-3">
            Keyboard shortcuts
          </p>
          <ul className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {SHORTCUTS.map(({ key, label }) => (
              <li key={key} className="contents">
                <span className="font-mono text-xs text-fg bg-surface-sunken border border-line px-2 py-0.5 justify-self-start">
                  {key}
                </span>
                <span className="font-mono text-xs text-fg-muted self-center">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into `SmartFeedShell.tsx`**

Add imports:

```tsx
import { useFeedKeyboard } from "@/hooks/useFeedKeyboard";
import { KeyboardHelpOverlay } from "./KeyboardHelpOverlay";
import { FEED_COPY } from "./copy";
```

Add state:

```tsx
const [helpOpen, setHelpOpen] = useState(false);
```

Add helpers (place after `filteredJobs` memo):

```tsx
const selectedIndex = filteredJobs.findIndex((j) => j.id === selectedJobId);

useFeedKeyboard(
  {
    onNext: () => {
      if (filteredJobs.length === 0) return;
      const next = selectedIndex < 0 ? 0 : Math.min(selectedIndex + 1, filteredJobs.length - 1);
      setSelectedJobId(filteredJobs[next].id);
    },
    onPrev: () => {
      if (filteredJobs.length === 0) return;
      const prev = selectedIndex <= 0 ? 0 : selectedIndex - 1;
      setSelectedJobId(filteredJobs[prev].id);
    },
    onToggleSave: () => {
      if (selectedJob) handleToggleSave(selectedJob);
    },
    onTailor: () => {
      if (selectedJob && isAuth) setTailorJob(selectedJob);
    },
    onApply: () => {
      if (selectedJob?.url) window.open(selectedJob.url, "_blank");
    },
    onFocusSearch: () => {
      const input = document.getElementById("feed-search-input") as HTMLInputElement | null;
      input?.focus();
    },
    onToggleHelp: () => setHelpOpen((p) => !p),
    onEscape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (tailorJob) setTailorJob(null);
      else setSelectedJobId(null);
    },
  },
  true
);
```

Add footer hint at the bottom of the feed column (inside the `<div className="w-full lg:w-[55%] xl:w-[60%] border-r border-line">`):

```tsx
<div className="hidden lg:block sticky bottom-0 px-5 py-2 border-t border-line-subtle bg-surface-sunken/80 backdrop-blur-sm text-[10px] tracking-[0.2em] text-fg-subtle font-mono">
  {FEED_COPY.keyboard.footer}
</div>
```

Mount `KeyboardHelpOverlay` at the end of the shell:

```tsx
<KeyboardHelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
```

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

At `/feed` (not focused in input):
- `j`/`k` cycles selection down/up, panel updates.
- `/` focuses the search input.
- `s` toggles save on selected job's heart.
- `a` opens the job URL in a new tab (when present).
- `?` toggles help overlay; overlay traps focus on close button; `Escape` or `×` closes.
- Typing inside the search input does NOT trigger shortcuts.

- [ ] **Step 5: Commit**

```bash
git add hooks/useFeedKeyboard.ts components/smart-feed/KeyboardHelpOverlay.tsx components/smart-feed/SmartFeedShell.tsx
git commit -m "feat(feed): keyboard-first nav (j/k/s/t/a///?) with help overlay"
```

---

## Task 7: New API endpoints

**Goal:** Ship the two endpoints the onboarding strip + trust strip will call.

**Files:**
- Create: `app/api/feed/aggregate/route.ts`
- Create: `app/api/interest/route.ts`

- [ ] **Step 1: Write `/api/feed/aggregate/route.ts`**

```ts
// app/api/feed/aggregate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const latest = await prisma.job_postings.findFirst({
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });

    // Phase 3: appliedAt column does not exist yet. Return 0.
    // Phase 5 replaces this with SavedJob.appliedAt aggregation.
    const appliedToday = 0;

    return NextResponse.json({
      ok: true,
      appliedToday,
      lastRefreshedAt: latest?.created_at ?? null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "aggregate_failed" }, { status: 500 });
  }
}
```

Verify the Prisma model name via:

```bash
grep -n "^model " prisma/schema.prisma | head
```

If the model is exported as `job_postings` (lowercase from the CLAUDE.md key), use that. If it's camel/pascal (e.g., `JobPosting`), adjust the Prisma client call accordingly.

- [ ] **Step 2: Write `/api/interest/route.ts`**

```ts
// app/api/interest/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const BodySchema = z.object({
  roles: z.array(z.string().min(1).max(40)).max(10),
  locations: z.array(z.string().min(1).max(60)).max(10),
  grad_year: z.number().int().min(2020).max(2035).optional(),
});

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const interest = await prisma.interest.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, interest });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let parsed;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const interest = await prisma.interest.upsert({
    where: { userId },
    update: {
      roles: parsed.roles,
      locations: parsed.locations,
      grad_year: parsed.grad_year,
    },
    create: {
      userId,
      roles: parsed.roles,
      locations: parsed.locations,
      grad_year: parsed.grad_year,
    },
  });

  return NextResponse.json({ ok: true, interest });
}
```

If `@/lib/auth` does not exist, locate where `authOptions` is exported. It will typically be in `lib/auth.ts` or `app/api/auth/[...nextauth]/route.ts`. Import from the actual location and add a re-export from `lib/auth.ts` if it doesn't already exist to keep the API route clean.

- [ ] **Step 3: Smoke test endpoints**

```bash
npm run dev
```

In a separate terminal:

```bash
curl -s http://localhost:3000/api/feed/aggregate | jq .
```

Expected: `{ "ok": true, "appliedToday": 0, "lastRefreshedAt": "..." }`.

```bash
curl -sI http://localhost:3000/api/interest
```

Expected: 401 when not authed (if `getServerSession` returns null without cookie).

- [ ] **Step 4: Commit**

```bash
git add app/api/feed/aggregate/route.ts app/api/interest/route.ts lib/auth.ts
git commit -m "feat(api): add feed aggregate + interest upsert endpoints"
```

---

## Task 8: OnboardingStrip + wire into shell

**Goal:** Ship the 3-step guided flow that closes the login loop.

**Files:**
- Delete: `components/smart-feed/OnboardingBanner.tsx`
- Create: `components/smart-feed/OnboardingStrip.tsx`
- Modify: `components/smart-feed/SmartFeedShell.tsx`

- [ ] **Step 1: Delete old `OnboardingBanner.tsx`**

```bash
git rm components/smart-feed/OnboardingBanner.tsx
```

- [ ] **Step 2: Write `OnboardingStrip.tsx`**

```tsx
// components/smart-feed/OnboardingStrip.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FEED_COPY } from "./copy";

interface OnboardingStripProps {
  hasResume: boolean;
  hasInterest: boolean;
  hasFirstAction: boolean;
  onStepClick?: (step: 1 | 2 | 3) => void;
}

const DISMISS_KEY = "onboarding_dismissed";

export function OnboardingStrip({
  hasResume,
  hasInterest,
  hasFirstAction,
  onStepClick,
}: OnboardingStripProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const allDone = hasResume && hasInterest && hasFirstAction;
  if (allDone || dismissed) return null;

  const steps = [
    { n: 1 as const, label: FEED_COPY.onboarding.step1, done: hasResume },
    { n: 2 as const, label: FEED_COPY.onboarding.step2, done: hasInterest },
    { n: 3 as const, label: FEED_COPY.onboarding.step3, done: hasFirstAction },
  ];

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="px-5 py-2 border-b border-line bg-surface-sunken/60 flex items-center gap-5 flex-wrap">
      <span className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
        ╭─ {FEED_COPY.onboarding.title}
      </span>
      {steps.map((s) => {
        const content = (
          <span
            className={[
              "font-mono text-[11px]",
              s.done
                ? "text-status-success line-through"
                : "text-orange-700 dark:text-orange-400 hover:text-orange-600",
            ].join(" ")}
          >
            [{s.done ? "✓" : " "}] {s.label}
          </span>
        );

        if (s.done) return <span key={s.n}>{content}</span>;

        if (s.n === 1) {
          return (
            <Link key={s.n} href="/resume" className="cursor-pointer">
              {content}
            </Link>
          );
        }

        return (
          <button
            key={s.n}
            type="button"
            onClick={() => onStepClick?.(s.n)}
            className="cursor-pointer"
          >
            {content}
          </button>
        );
      })}

      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto text-fg-subtle hover:text-fg-muted font-mono text-xs"
        aria-label="Dismiss onboarding"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire into `SmartFeedShell.tsx`**

Remove import of the deleted `OnboardingBanner`. Add:

```tsx
import { OnboardingStrip } from "./OnboardingStrip";
```

Add state:

```tsx
const [hasInterest, setHasInterest] = useState<boolean | null>(null);
const [appliedToday, setAppliedToday] = useState(0);
```

Inside the existing `useEffect(() => { if (!isAuth) return; ...}` block, extend the `Promise.all` to include the two new fetches and handle them in the `.then`:

```tsx
Promise.allSettled([
  fetch("/api/dashboard/data").then((r) => r.json()),
  fetch("/api/resume/data").then((r) => r.json()),
  fetch("/api/interest").then((r) => r.json()),
  fetch("/api/feed/aggregate").then((r) => r.json()),
]).then(([match, resume, interest, aggregate]) => {
  if (cancelled) return;

  if (match.status === "fulfilled") {
    const matchData = match.value;
    // ...keep the existing mapping logic here...
  }

  if (resume.status === "fulfilled") {
    const resumeData = resume.value;
    if (resumeData?.ok && resumeData?.resume?.resume_text) {
      setSavedResumeText(resumeData.resume.resume_text);
    }
  }

  if (interest.status === "fulfilled") {
    const interestData = interest.value;
    setHasInterest(!!interestData?.interest?.roles?.length);
  }

  if (aggregate.status === "fulfilled") {
    const agg = aggregate.value;
    if (typeof agg?.appliedToday === "number") setAppliedToday(agg.appliedToday);
  }
});
```

Replace the old `<OnboardingBanner />` mount with:

```tsx
{isAuth && (
  <OnboardingStrip
    hasResume={!!hasResume}
    hasInterest={!!hasInterest}
    hasFirstAction={savedJobIds.size > 0}
    onStepClick={(step) => {
      if (step === 2) {
        // Phase 3: route to /preferences; Phase 6 replaces with slide-over.
        window.location.href = "/preferences";
      }
      if (step === 3) {
        setActiveTab("for-you");
      }
    }}
  />
)}
```

Update `<TrustStrip appliedToday={appliedToday} />` to use the new state.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Sign up as a new user, land on `/feed`:
- Strip appears with 3 steps, all `[ ]`.
- Click step 1 → navigates to `/resume`. After upload, returning to `/feed` shows `[✓] 01 upload_resume`.
- Click step 2 → routes to `/preferences`. After saving roles, `[✓] 02 set_preferences`.
- Saving any job ticks step 3.
- `×` dismisses for the session.
- Completing all three auto-hides the strip.

- [ ] **Step 5: Commit**

```bash
git add components/smart-feed/OnboardingStrip.tsx components/smart-feed/SmartFeedShell.tsx
git commit -m "feat(feed): add 3-step onboarding strip post-signup (resume → prefs → first action)"
```

---

## Task 9: CLAUDE.md + E2E tests + verification

**Goal:** Lock the protection rules, add smoke E2E coverage, verify build.

**Files:**
- Modify: `CLAUDE.md`
- Create: `tests/e2e/feed.spec.ts`

- [ ] **Step 1: Update `CLAUDE.md` protected-files section**

Find the "Protected Landing Page Files" section in `CLAUDE.md`. Directly below it, add a new subsection:

```markdown
### Protected Smart-Feed Files (Phase 3 — 2026-04-19)

Spec: `docs/superpowers/specs/2026-04-19-phase3-feed-redesign-design.md`.

| File | Rule |
|------|------|
| `components/smart-feed/JobCard.tsx` | Compact layout is load-bearing. Do not expand padding or add a 4th row without approval. |
| `components/smart-feed/DetailPanel.tsx` | No tab bar. Cover letter is a single inline expand-button. |
| `components/smart-feed/FilterBar.tsx` | Single-row layout. Only H1B lives behind `more…`; new filters must be added to the popover, not the main row. |
| `components/smart-feed/TrustStrip.tsx` | Items are data-driven. Never show placeholders or zero-values. |
| `components/smart-feed/OnboardingStrip.tsx` | Three steps locked: resume → preferences → first_apply. |
| `components/smart-feed/copy.ts` | Source of truth for feed copy. All display strings live here. |
| `hooks/useFeedKeyboard.ts` | Keyboard map is load-bearing. New shortcuts must not shadow `j/k/s/t/a///?/esc`. |
| `lib/feed-derivations.ts` | Pure. No side effects. Tests live next to it. |
```

- [ ] **Step 2: Write Playwright E2E**

```ts
// tests/e2e/feed.spec.ts
import { test, expect } from "@playwright/test";

test.describe("unauth feed", () => {
  test("loads feed with trust strip and can filter by search", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.locator("text=cron verified")).toBeVisible();

    const search = page.getByPlaceholder("search jobs...");
    await search.click();
    await search.fill("engineer");

    // One JobCard should be present or a graceful empty state; just assert no crash.
    await expect(page.locator("body")).toBeVisible();
  });

  test("keyboard shortcut '/' focuses the search input", async ({ page }) => {
    await page.goto("/feed");
    await page.keyboard.press("/");
    await expect(page.getByPlaceholder("search jobs...")).toBeFocused();
  });

  test("'?' opens and closes the help overlay", async ({ page }) => {
    await page.goto("/feed");
    await page.keyboard.press("?");
    await expect(page.locator("text=Keyboard shortcuts")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("text=Keyboard shortcuts")).toBeHidden();
  });
});
```

- [ ] **Step 3: Run E2E**

```bash
npx playwright install --with-deps chromium
npx playwright test tests/e2e/feed.spec.ts --reporter=list
```

Expected: 3 passing tests. If the dev server port differs, update `playwright.config.ts` or start `npm run dev` in a side terminal.

- [ ] **Step 4: Verify production build**

```bash
npm run build
```

Expected: success. If type errors appear from leftover `DetailPanelMode` imports or unused variables, fix them and re-run.

- [ ] **Step 5: Verify unit tests still pass**

```bash
npx vitest run
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md tests/e2e/feed.spec.ts
git commit -m "docs(claude): lock Phase 3 smart-feed files; add e2e smoke coverage"
```

---

## Post-implementation verification checklist

After all nine tasks are committed, manually walk through:

- [ ] Unauth user lands on `/feed`, sees trust strip, filter bar, feed, detail panel empty state.
- [ ] New user signs up → lands on `/feed` → sees onboarding strip with 3 incomplete steps.
- [ ] User uploads resume → strip step 1 flips to `[✓]`.
- [ ] User sets roles/locations → strip step 2 flips.
- [ ] User saves a job → strip step 3 flips → entire strip disappears.
- [ ] Matched jobs show AI reason line under meta.
- [ ] Jobs with `score < 50` appear dimmer; hovering restores full opacity.
- [ ] Detail panel: no tab bar, cover-letter expand-button at bottom, Apply orange with arrow, match analysis includes inline streaming explanation.
- [ ] Keyboard: `j/k/s/t/a///?/esc` all work; shortcuts do not fire while typing in search.
- [ ] Both light and dark themes render without broken contrast.
- [ ] `npm run build` succeeds.
- [ ] `npx vitest run` passes.
- [ ] `npx playwright test` passes.

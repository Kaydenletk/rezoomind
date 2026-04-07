# Dashboard Improvement Plan — Clarity, Attractiveness & Intelligence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Rezoomind public dashboard from a data display into a job intelligence tool — faster comprehension, stronger visual hierarchy, matching preview, smarter table, and trust signals.

**Architecture:** Extend the existing server-component page (`app/page.tsx`) with new presentational components and a pure utility layer (`lib/job-signals.ts`) for computing priority/fit badges. All new data derivation happens in `lib/insights.ts` (already owns market analysis) and the new signals utility. No new API routes or DB changes needed — everything derives from existing `MarketInsights` and `GitHubJob[]` data.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide React

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `lib/job-signals.ts` | Pure functions: `computeJobPriority(datePosted)` returns priority badge, `computeFitTag(category)` returns role-fit label |
| `components/dashboard/MarketSummaryStrip.tsx` | Top strip with 4 quick-glance stats: market temp, fresh count, apply window, competition |
| `components/dashboard/MainInsightCard.tsx` | Hero card with one plain-English market interpretation sentence |
| `components/dashboard/ActionGuide.tsx` | "What to do this week" guidance card with timing-aware advice |
| `components/dashboard/MatchingPreviewCard.tsx` | Replaces `LockedCard` — "coming soon" matching preview with example fit badges |
| `components/dashboard/TrustBlock.tsx` | Small credibility section: update frequency, source, listing count |

### Modified Files

| File | Changes |
|------|---------|
| `lib/insights.ts` | Add `competitionLevel`, `summaryText`, `applyWindow` fields to `MarketInsights` |
| `components/dashboard/InsightCards.tsx` | Rename labels: `market_status` → `Market Status`, `30d_trend` → `30-Day Trend`, `action` → `What To Do` |
| `components/dashboard/JobsTable.tsx` | Add fit-badge column, add priority badge, adjust grid from 5-col to 6-col |
| `components/dashboard/MarketBanner.tsx:~line 200` | Reduce `ResponsiveContainer` height from 220 to 180 |
| `app/page.tsx` | Restructure layout: SummaryStrip → MainInsight → Chart → ActionGuide → Jobs + Sidebar (MarketChart + MatchingPreview) → TrustBlock → Footer |

### Removed Files

| File | Reason |
|------|--------|
| `components/dashboard/LockedCard.tsx` | Replaced by `MatchingPreviewCard.tsx` — dashed lock icon doesn't communicate product value |

---

## Task 1: Extend MarketInsights with Summary Data

Add three new fields to `MarketInsights` so downstream components can render human-readable summaries without re-deriving logic.

**Files:**
- Modify: `lib/insights.ts:26-36` (MarketInsights interface) and `lib/insights.ts:126-194` (computeMarketInsights function)

- [ ] **Step 1: Add new fields to the MarketInsights interface**

In `lib/insights.ts`, extend the `MarketInsights` interface:

```typescript
export interface MarketInsights {
  season: "peak" | "winding-down" | "lull" | "ramping-up";
  seasonLabel: string;
  seasonColor: string;
  monthsUntilPeak: number;
  trends: TrendItem[];
  yoy: YoyItem[];
  hottestCategory: string;
  recommendation: string;
  shortRecommendation: string;
  // NEW fields
  competitionLevel: "Low" | "Medium" | "High";
  summaryText: string;
  applyWindow: string;
}
```

- [ ] **Step 2: Add helper functions for the new fields**

Add above `computeMarketInsights`:

```typescript
function deriveCompetitionLevel(season: MarketInsights["season"], trendingUp: boolean): "Low" | "Medium" | "High" {
  if (season === "peak" && trendingUp) return "High";
  if (season === "peak" || season === "winding-down") return "Medium";
  return "Low";
}

function deriveSummaryText(
  season: MarketInsights["season"],
  hottestCategory: string,
  hottestMom: number,
  totalCurrent: number,
): string {
  const categoryShort = hottestCategory.replace("USA ", "").replace("Intl ", "");
  switch (season) {
    case "peak":
      return `Peak hiring season is active with ${totalCurrent.toLocaleString()} tracked internships. ${categoryShort} roles lead activity${hottestMom > 0 ? ` (up ${hottestMom}% this month)` : ""}.`;
    case "winding-down":
      return `Hiring is winding down, but late-cycle roles often see less competition. ${categoryShort} still has momentum${hottestMom > 0 ? ` at +${hottestMom}%` : ""}.`;
    case "ramping-up":
      return `The market is ramping up — early postings are appearing. ${categoryShort} is leading the uptick${hottestMom > 0 ? ` with +${hottestMom}% growth` : ""}.`;
    case "lull":
      return `Seasonal lull — volume is low, but fresh roles posted in the last 72 hours still have strong response odds. Use this window to prep.`;
  }
}

function deriveApplyWindow(season: MarketInsights["season"]): string {
  if (season === "peak") return "Within 48 hours";
  if (season === "winding-down") return "Within 72 hours";
  return "Within 3-5 days";
}
```

- [ ] **Step 3: Wire new fields into computeMarketInsights return**

In `computeMarketInsights`, after the `buildRecommendation` call (~line 179), compute and add the new fields to the return object:

```typescript
  const competitionLevel = deriveCompetitionLevel(season, trendingUp);
  const totalCurrent = trends.reduce((sum, t) => sum + t.current, 0);
  const summaryText = deriveSummaryText(season, hottest.category, hottest.momChange, totalCurrent);
  const applyWindow = deriveApplyWindow(season);

  return {
    season,
    seasonLabel: meta.label,
    seasonColor: meta.color,
    monthsUntilPeak: monthsUntilSeptember(now),
    trends,
    yoy,
    hottestCategory: hottest.category,
    recommendation,
    shortRecommendation,
    competitionLevel,
    summaryText,
    applyWindow,
  };
```

Also update the early-return block (when `trend.length < 2`) to include the new fields:

```typescript
    return {
      // ...existing fields...
      competitionLevel: "Low",
      summaryText: "Not enough data yet — check back as we collect more market snapshots.",
      applyWindow: "Within 3-5 days",
    };
```

- [ ] **Step 4: Verify the build compiles**

Run: `npm run build`
Expected: No TypeScript errors. The new fields are consumed nowhere yet, so the page renders as before.

- [ ] **Step 5: Commit**

```bash
git add lib/insights.ts
git commit -m "feat: add competitionLevel, summaryText, applyWindow to MarketInsights"
```

---

## Task 2: Create Job Signal Utilities

Pure functions that compute priority badges and fit tags from job posting data. These will power the smart columns in the jobs table.

**Files:**
- Create: `lib/job-signals.ts`

- [ ] **Step 1: Create the job signals module**

```typescript
// lib/job-signals.ts

export type Priority = "Apply today" | "High priority" | "Good timing" | "Review";
export type FitTag = "SWE fit" | "DS/ML fit" | "PM fit" | "Quant fit" | "Hardware fit" | "";

const MONTH_NAMES: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * Parse a date string like "Jun 13" into days-ago count.
 * Returns null if the string can't be parsed.
 */
export function parseDaysAgo(datePosted: string): number | null {
  if (!datePosted || datePosted === "—") return null;
  const match = datePosted.match(/^(\w{3})\s+(\d{1,2})$/);
  if (!match) return null;

  const monthIdx = MONTH_NAMES[match[1]];
  if (monthIdx === undefined) return null;

  const day = parseInt(match[2], 10);
  const now = new Date();
  let year = now.getFullYear();

  const posted = new Date(year, monthIdx, day);
  // If the parsed date is in the future, it was last year
  if (posted > now) {
    posted.setFullYear(year - 1);
  }

  const diffMs = now.getTime() - posted.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Compute a priority badge based on posting age.
 */
export function computeJobPriority(datePosted: string): Priority {
  const days = parseDaysAgo(datePosted);
  if (days === null) return "Review";
  if (days <= 2) return "Apply today";
  if (days <= 5) return "High priority";
  if (days <= 14) return "Good timing";
  return "Review";
}

/**
 * Compute a fit tag from the job category field.
 */
export function computeFitTag(category: string): FitTag {
  switch (category) {
    case "swe": return "SWE fit";
    case "dsml": return "DS/ML fit";
    case "pm": return "PM fit";
    case "quant": return "Quant fit";
    case "hardware": return "Hardware fit";
    default: return "";
  }
}

/**
 * Tailwind classes for each priority level.
 */
export function priorityClasses(priority: Priority): string {
  switch (priority) {
    case "Apply today":
      return "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/50";
    case "High priority":
      return "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50";
    case "Good timing":
      return "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50";
    case "Review":
      return "text-stone-500 dark:text-stone-500 bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800";
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: Compiles cleanly. Module is not imported anywhere yet.

- [ ] **Step 3: Commit**

```bash
git add lib/job-signals.ts
git commit -m "feat: add job signal utilities for priority badges and fit tags"
```

---

## Task 3: Build MarketSummaryStrip Component

A compact strip of 4 quick-glance stats that sits below the header. Reduces the user's mental work in the first 5 seconds.

**Files:**
- Create: `components/dashboard/MarketSummaryStrip.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/MarketSummaryStrip.tsx
import type { MarketInsights } from "@/lib/insights";

interface Props {
  insights: MarketInsights;
  freshCount: number;
  totalCount: number;
}

const COMPETITION_COLORS: Record<string, string> = {
  Low: "text-green-600 dark:text-green-400",
  Medium: "text-yellow-600 dark:text-yellow-400",
  High: "text-red-500 dark:text-red-400",
};

export function MarketSummaryStrip({ insights, freshCount, totalCount }: Props) {
  const stats = [
    {
      label: "Market",
      value: insights.seasonLabel,
      color: "",
      style: { color: insights.seasonColor },
    },
    {
      label: "Fresh today",
      value: `${freshCount}`,
      color: freshCount > 0 ? "text-green-600 dark:text-green-400" : "text-stone-500",
    },
    {
      label: "Best window",
      value: insights.applyWindow,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Competition",
      value: insights.competitionLevel,
      color: COMPETITION_COLORS[insights.competitionLevel] ?? "text-stone-500",
    },
  ];

  return (
    <div className="flex items-center gap-5 px-5 lg:px-7 py-2.5 border-b border-stone-100 dark:border-stone-800/50 overflow-x-auto">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 font-mono">
            {s.label}
          </span>
          <span
            className={`font-mono text-xs font-bold ${s.color}`}
            style={s.style}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No errors. Component not yet wired into page.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/MarketSummaryStrip.tsx
git commit -m "feat: add MarketSummaryStrip component for quick-glance stats"
```

---

## Task 4: Build MainInsightCard Component

One hero card with a plain-English interpretation of the market. Turns the chart into supporting evidence instead of forcing the user to interpret numbers.

**Files:**
- Create: `components/dashboard/MainInsightCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/MainInsightCard.tsx
import type { MarketInsights } from "@/lib/insights";

export function MainInsightCard({ insights }: { insights: MarketInsights }) {
  return (
    <div className="px-5 lg:px-7 py-3">
      <div className="border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 p-4">
        <div className="flex items-start gap-3">
          <span className="text-orange-600 font-mono text-sm font-bold mt-0.5">i</span>
          <div>
            <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
              {insights.summaryText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No errors. Component not yet wired into page.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/MainInsightCard.tsx
git commit -m "feat: add MainInsightCard with plain-English market summary"
```

---

## Task 5: Build ActionGuide Component

Replaces the terse "action" card with guidance-oriented advice that tells users **what to do this week**.

**Files:**
- Create: `components/dashboard/ActionGuide.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/ActionGuide.tsx
import Link from "next/link";
import type { MarketInsights } from "@/lib/insights";

export function ActionGuide({ insights }: { insights: MarketInsights }) {
  return (
    <div className="px-5 lg:px-7 py-2">
      <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.15em]">
            What To Do This Week
          </span>
        </div>
        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-3">
          {insights.recommendation}
        </p>
        <Link
          href="/insights"
          className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-orange-600 hover:text-orange-500 transition-colors"
        >
          View full insights →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No errors. Component not yet wired into page.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ActionGuide.tsx
git commit -m "feat: add ActionGuide component with weekly guidance"
```

---

## Task 6: Rename InsightCards Labels to Human Language

Change the system-like labels (`market_status`, `30d_trend`, `action`) to human-readable text.

**Files:**
- Modify: `components/dashboard/InsightCards.tsx:11,30,49`

- [ ] **Step 1: Update the three label spans**

In `InsightCards.tsx`:

Change line 11:
```
market_status  →  Market Status
```

Change line 30:
```
30d_trend  →  30-Day Trend
```

Change line 49:
```
action  →  What To Do
```

Specifically, replace:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">market_status</span>
```
with:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.15em]">Market Status</span>
```

Replace:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">30d_trend</span>
```
with:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.15em]">30-Day Trend</span>
```

Replace:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">action</span>
```
with:
```tsx
<span className="font-mono text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-[0.15em]">What To Do</span>
```

Also rename the header in `InsightCards.tsx` card 3 — change the link text:
```tsx
view_insights →  →  View insights →
```

- [ ] **Step 2: Rename label in MarketChart.tsx:35**

In `components/dashboard/MarketChart.tsx`, change:
```tsx
<span className="font-mono text-xs font-bold text-stone-950 dark:text-stone-50">roles_breakdown</span>
```
to:
```tsx
<span className="font-mono text-xs font-bold text-stone-950 dark:text-stone-50 uppercase tracking-[0.1em]">Role Mix</span>
```

- [ ] **Step 3: Rename label in JobsTable.tsx:56**

In `components/dashboard/JobsTable.tsx`, change:
```tsx
<span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">internships</span>
```
to:
```tsx
<span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">Fresh Internships</span>
```

Also change the `view_all →` link text at line 61:
```tsx
view_all →  →  View all →
```

- [ ] **Step 4: Verify dev server renders correctly**

Run: `npm run dev`
Check: Open `http://localhost:3000` — all labels should now be human-readable uppercase text.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/InsightCards.tsx components/dashboard/MarketChart.tsx components/dashboard/JobsTable.tsx
git commit -m "feat: rename system-like labels to human-readable language"
```

---

## Task 7: Build MatchingPreviewCard (Replace LockedCard)

Replace the dashed lock icon with a "Matching preview — coming soon" card that communicates future product value. Uses Option A (coming soon text) + Option C (example fit badges).

**Files:**
- Create: `components/dashboard/MatchingPreviewCard.tsx`
- Remove reference to: `components/dashboard/LockedCard.tsx` (deletion happens in Task 11 when we rewire the page)

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/MatchingPreviewCard.tsx
import { Sparkles } from "lucide-react";

const EXAMPLE_FITS = [
  { company: "Google", tag: "SWE fit", color: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30" },
  { company: "Jane Street", tag: "Quant fit", color: "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" },
  { company: "Tesla", tag: "Hardware fit", color: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30" },
];

export function MatchingPreviewCard() {
  return (
    <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        <span className="font-mono text-[11px] font-bold text-stone-950 dark:text-stone-50 uppercase tracking-[0.1em]">
          Matching Preview
        </span>
      </div>

      <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
        Rezoomind will rank jobs by skill overlap, graduation fit, posting freshness, and role alignment.
      </p>

      {/* Example fit badges */}
      <div className="space-y-2 mb-4">
        {EXAMPLE_FITS.map((f) => (
          <div key={f.company} className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-600 dark:text-stone-300">
              {f.company}
            </span>
            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 border ${f.color}`}>
              {f.tag}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No errors. Component not yet wired into page.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/MatchingPreviewCard.tsx
git commit -m "feat: add MatchingPreviewCard with coming-soon preview and example fit badges"
```

---

## Task 8: Add Fit Badges and Priority Column to JobsTable

Add a "Signal" column that shows computed fit tags and priority badges for each job. This is the single highest-impact table improvement.

**Files:**
- Modify: `components/dashboard/JobsTable.tsx`

- [ ] **Step 1: Add import for job signals**

At the top of `JobsTable.tsx`, add:

```typescript
import { computeJobPriority, priorityClasses } from "@/lib/job-signals";
```

- [ ] **Step 2: Expand the grid to 6 columns**

Change the column headers grid (line 67) from:
```tsx
<div className="grid grid-cols-[2fr_1.5fr_1fr_60px_140px] gap-2 px-5 py-2 ...">
```
to:
```tsx
<div className="grid grid-cols-[2fr_1.5fr_100px_60px_80px_140px] gap-2 px-5 py-2 ...">
```

Add a new column header after the "Age" column:
```tsx
<span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Signal</span>
```

- [ ] **Step 3: Expand each job row to 6 columns**

Change the row grid (line 87) from:
```tsx
<div className={`grid grid-cols-[2fr_1.5fr_1fr_60px_140px] gap-2 px-5 py-2.5 ...`}>
```
to:
```tsx
<div className={`grid grid-cols-[2fr_1.5fr_100px_60px_80px_140px] gap-2 px-5 py-2.5 ...`}>
```

After the age `<span>` (line 102), add the signal cell:

```tsx
<span className="hidden md:block">
  {(() => {
    const priority = computeJobPriority(job.datePosted);
    return (
      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 border ${priorityClasses(priority)}`}>
        {priority}
      </span>
    );
  })()}
</span>
```

- [ ] **Step 4: Verify in dev server**

Run: `npm run dev`
Check: Each job row now has a colored badge in the Signal column — "Apply today" (green), "High priority" (orange), "Good timing" (blue), or "Review" (gray).

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/JobsTable.tsx
git commit -m "feat: add priority signal column to jobs table"
```

---

## Task 9: Reduce MarketBanner Chart Height

Make the chart less dominant so the page doesn't feel chart-first.

**Files:**
- Modify: `components/dashboard/MarketBanner.tsx:~line 200`

- [ ] **Step 1: Reduce ResponsiveContainer height**

In `MarketBanner.tsx`, find the `ResponsiveContainer` at line 173. Change:

```tsx
<ResponsiveContainer width="100%" height={300}>
```
to:
```tsx
<ResponsiveContainer width="100%" height={220}>
```

- [ ] **Step 2: Verify the chart renders at the new height**

Run: `npm run dev`
Check: Chart is visibly shorter but still readable. Legend and tooltips work.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/MarketBanner.tsx
git commit -m "style: reduce market banner chart height for better visual hierarchy"
```

---

## Task 10: Build TrustBlock Component

Small credibility section that makes the tool feel real, updated, and reliable.

**Files:**
- Create: `components/dashboard/TrustBlock.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/TrustBlock.tsx

interface Props {
  totalCount: number;
}

export function TrustBlock({ totalCount }: Props) {
  return (
    <div className="px-5 lg:px-7 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-stone-400 dark:text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Updated daily
        </span>
        <span>
          {totalCount.toLocaleString()} internships tracked
        </span>
        <span>
          Source: SimplifyJobs + verified job boards
        </span>
        <span>
          Tracks volume, posting age, and role mix
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/TrustBlock.tsx
git commit -m "feat: add TrustBlock component for source credibility"
```

---

## Task 11: Restructure Page Layout

Wire all new components into `app/page.tsx` and establish the new visual hierarchy:
1. Header
2. Summary Strip (new)
3. Market Banner (chart, collapsible)
4. Main Insight Card (new)
5. Insight Cards (renamed labels)
6. Action Guide (new)
7. Stats bar (existing, trimmed)
8. Jobs Table + Sidebar (MarketChart + MatchingPreviewCard)
9. Trust Block (new)
10. Footer

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add new imports**

Add to the top of `app/page.tsx`:

```typescript
import { MarketSummaryStrip } from "@/components/dashboard/MarketSummaryStrip";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { ActionGuide } from "@/components/dashboard/ActionGuide";
import { MatchingPreviewCard } from "@/components/dashboard/MatchingPreviewCard";
import { TrustBlock } from "@/components/dashboard/TrustBlock";
import { parseDaysAgo } from "@/lib/job-signals";
```

Remove unused imports:
```typescript
// DELETE these lines:
import { LockedCard } from "@/components/dashboard/LockedCard";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
```

Also delete the unused variable on line 25:
```typescript
// DELETE this line:
const emptyCat = { total: 0, faang: 0, quant: 0, other: 0 };
```

- [ ] **Step 2: Compute freshCount from job data**

After the existing data fetching (after line 28), add:

```typescript
  const freshCount = githubData.jobs.filter((j) => {
    const days = parseDaysAgo(j.datePosted);
    return days !== null && days <= 2;
  }).length;
```

- [ ] **Step 3: Rewrite the JSX return**

Replace the entire `return (...)` block with:

```tsx
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <DashboardHeader />

      {/* Quick-glance summary strip */}
      <MarketSummaryStrip
        insights={insights}
        freshCount={freshCount}
        totalCount={counts.total}
      />

      {/* Collapsible market trend chart */}
      <MarketBanner trend={trend} />

      {/* Hero insight — one plain-English sentence */}
      <MainInsightCard insights={insights} />

      {/* Market stat cards */}
      <InsightCards insights={insights} />

      {/* Guidance: what to do this week */}
      <ActionGuide insights={insights} />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 lg:px-7 py-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-xs font-semibold text-stone-950 dark:text-stone-50">
          {counts.total} internships
        </span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 text-[11px]">all roles · updated daily</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[10px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>

      {/* MAIN: Jobs + Sidebar */}
      <div className="flex-1 px-5 lg:px-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3.5">
          {/* Jobs — the hero */}
          <JobsTable postings={githubData.jobs.slice(0, 60)} />

          {/* Sidebar */}
          <div className="flex flex-col gap-3.5">
            <MarketChart
              swe={counts.swe}
              pm={counts.pm}
              dsml={counts.dsml}
              quant={counts.quant}
              hardware={counts.hardware}
              total={counts.total}
            />
            <MatchingPreviewCard />
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <TrustBlock totalCount={counts.total} />

      <DashboardFooter />
    </div>
  );
```

- [ ] **Step 4: Delete LockedCard component**

```bash
rm components/dashboard/LockedCard.tsx
```

- [ ] **Step 5: Verify the full page renders**

Run: `npm run dev`
Check at `http://localhost:3000`:
- Summary strip appears below header with 4 stats
- Main insight card shows a plain-English sentence
- Insight cards have renamed labels
- Action guide shows "What To Do This Week"
- Jobs table has Signal column
- Sidebar shows Role Mix chart + Matching Preview card (not lock icon)
- Trust block appears above footer
- No console errors

- [ ] **Step 6: Verify production build**

Run: `npm run build`
Expected: Clean build with no TypeScript or import errors.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git rm components/dashboard/LockedCard.tsx
git commit -m "feat: restructure dashboard layout with new components and visual hierarchy"
```

---

## Task 12: Enhance DashboardFooter

Add minimal trust info inline with the existing footer style.

**Files:**
- Modify: `components/dashboard/DashboardFooter.tsx`

- [ ] **Step 1: Update footer text**

Replace the entire `<span>` that contains "rezoomind · data from..." with:

```tsx
<span className="text-[11px] text-stone-400">
  rezoomind · updated daily from{" "}
  <a href="https://github.com/SimplifyJobs/Summer2026-Internships" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">SimplifyJobs</a>
  {" "}+{" "}
  <a href="https://github.com/speedyapply/2026-SWE-College-Jobs" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">speedyapply</a>
</span>
```

- [ ] **Step 2: Verify and commit**

Run: `npm run dev` — check footer text.

```bash
git add components/dashboard/DashboardFooter.tsx
git commit -m "feat: enhance footer with accurate source attribution"
```

---

## Task 13: Final Verification

End-to-end check that everything works together.

**Files:** None (verification only)

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Clean build, zero errors.

- [ ] **Step 2: Visual check in dev**

Run: `npm run dev`

Verify at `http://localhost:3000`:
1. Summary strip: 4 stats visible, properly colored
2. Chart: collapsible, shorter height
3. Insight card: plain-English sentence in orange-bordered card
4. Insight cards: "Market Status", "30-Day Trend", "What To Do" labels
5. Action guide: "What To Do This Week" with recommendation text
6. Stats bar: total count + LIVE indicator
7. Jobs table: 6 columns including Signal with colored badges
8. Sidebar: Role Mix chart + Matching Preview card
9. Trust block: "Updated daily" with green dot
10. Footer: dual source attribution
11. Responsive: works on mobile (check with browser dev tools)
12. Dark mode: toggle works, all new components respect dark theme

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors introduced.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: final cleanup after dashboard improvement"
```

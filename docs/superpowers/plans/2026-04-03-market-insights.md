# Market Insights Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add computed market insights (season status, trends, recommendations) to the homepage and a dedicated `/insights` page, plus show job age in the table.

**Architecture:** Pure computation engine (`lib/insights.ts`) analyzes existing `DashboardSnapshot` data using math + pre-written templates. Homepage gets 3 insight cards. Full `/insights` page has trend table, seasonal calendar, YoY comparison, and tips. All server-rendered with ISR.

**Tech Stack:** TypeScript, Next.js Server Components, Recharts (reused), Prisma (existing)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/insights.ts` | Create | `computeMarketInsights()` — pure computation from trend data |
| `components/dashboard/InsightCards.tsx` | Create | 3 homepage insight cards (season, trends, recommendation) |
| `components/insights/TrendTable.tsx` | Create | MoM + YoY trend table |
| `components/insights/SeasonCalendar.tsx` | Create | 12-month hiring cycle heatmap |
| `components/insights/HistoricalComparison.tsx` | Create | YoY comparison card |
| `components/insights/TipsSection.tsx` | Create | Season-aware tips |
| `app/insights/page.tsx` | Create | Full insights page |
| `app/page.tsx` | Modify | Add InsightCards between MarketBanner and stats bar |
| `components/dashboard/MarketBanner.tsx` | Modify | Add `collapsible` prop |
| `components/dashboard/DashboardHeader.tsx` | Modify | Change ~/insights link to `/insights` |
| `components/dashboard/JobsTable.tsx` | Modify | Add AGE column |

---

### Task 1: Create the insight engine

**Files:**
- Create: `lib/insights.ts`

**Context:** This is the core computation layer. It takes `marketTrend` (array of `{ date, usaInternships, usaNewGrad, intlInternships, intlNewGrad }`) from `getDashboardStats()` and returns structured insights. No database access — pure function.

- [ ] **Step 1: Create `lib/insights.ts` with types and season detection**

```typescript
// lib/insights.ts

type MarketTrendPoint = {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
};

interface TrendItem {
  category: string;
  key: keyof Omit<MarketTrendPoint, "date">;
  current: number;
  thirtyDaysAgo: number;
  momChange: number;
}

interface YoyItem {
  category: string;
  current: number;
  lastYear: number | null;
  yoyChange: number | null;
}

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
}

const CATEGORIES: Array<{ label: string; key: keyof Omit<MarketTrendPoint, "date"> }> = [
  { label: "USA Internships", key: "usaInternships" },
  { label: "USA New Grad", key: "usaNewGrad" },
  { label: "Intl Internships", key: "intlInternships" },
  { label: "Intl New Grad", key: "intlNewGrad" },
];

function getSeason(month: number): MarketInsights["season"] {
  if ([8, 9, 10, 11, 0].includes(month)) return "peak";       // Sep-Jan (0-indexed: 8,9,10,11,0)
  if ([1, 2].includes(month)) return "winding-down";           // Feb-Mar
  if ([7].includes(month)) return "ramping-up";                // Aug
  return "lull";                                                // Apr-Jul
}

const SEASON_META: Record<MarketInsights["season"], { label: string; color: string }> = {
  "peak": { label: "Peak Season", color: "#22c55e" },
  "winding-down": { label: "Winding Down", color: "#f97316" },
  "lull": { label: "Seasonal Lull", color: "#eab308" },
  "ramping-up": { label: "Ramping Up", color: "#3b82f6" },
};

function monthsUntilSeptember(now: Date): number {
  const month = now.getMonth();
  // Sept = month 8. If we're in peak (8-11,0), return 0
  if ([8, 9, 10, 11, 0].includes(month)) return 0;
  // Otherwise count months until next September
  return month <= 8 ? 8 - month : 8 + 12 - month;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function findClosestSnapshot(trend: MarketTrendPoint[], targetDate: string): MarketTrendPoint | null {
  if (trend.length === 0) return null;
  let closest = trend[0];
  let minDiff = Math.abs(new Date(trend[0].date).getTime() - new Date(targetDate).getTime());
  for (const point of trend) {
    const diff = Math.abs(new Date(point.date).getTime() - new Date(targetDate).getTime());
    if (diff < minDiff) { minDiff = diff; closest = point; }
  }
  // Only return if within 7 days of target
  return minDiff <= 7 * 24 * 60 * 60 * 1000 ? closest : null;
}

function buildRecommendation(
  season: MarketInsights["season"],
  hottestCategory: string,
  hottestMom: number,
  hottestCurrent: number,
  trendingUp: boolean,
): { recommendation: string; shortRecommendation: string } {
  const templates: Record<string, { long: string; short: string }> = {
    "lull-down": {
      long: "The market is in its seasonal lull. Historically, postings surge around September. Use this time to prep your resume and practice interviews.",
      short: "Prep season — polish resume, practice interviews.",
    },
    "lull-up": {
      long: `Even in the lull, ${hottestCategory} is trending up (${hottestMom}%). Some companies post early — keep an eye out for early openers.`,
      short: `${hottestCategory} trending up — watch for early postings.`,
    },
    "ramping-up": {
      long: `The market is heating up. ${hottestCategory} postings increased ${hottestMom}% this month. Get your applications ready — early applicants get first looks.`,
      short: "Market heating up — get applications ready.",
    },
    "peak-up": {
      long: `Peak recruiting season is underway. ${hottestCategory} are up ${hottestMom}% this month. Apply within 48 hours of new postings for best chances.`,
      short: "Peak season — apply within 48hrs of new postings.",
    },
    "peak-down": {
      long: "We're in peak season but postings are tapering. Most positions fill by January — don't delay applications.",
      short: "Peak season tapering — don't delay applications.",
    },
    "winding-down": {
      long: `Peak season is winding down. Late-cycle positions often have less competition. ${hottestCategory} still has ${hottestCurrent} active postings.`,
      short: "Late-cycle positions — less competition now.",
    },
  };

  let key: string;
  if (season === "ramping-up" || season === "winding-down") {
    key = season;
  } else {
    key = `${season}-${trendingUp ? "up" : "down"}`;
  }

  const tmpl = templates[key] ?? templates["lull-down"];
  return { recommendation: tmpl.long, shortRecommendation: tmpl.short };
}

export function computeMarketInsights(trend: MarketTrendPoint[]): MarketInsights {
  const now = new Date();
  const month = now.getMonth();
  const season = getSeason(month);
  const meta = SEASON_META[season];

  // Default for empty/sparse data
  if (trend.length < 2) {
    const { recommendation, shortRecommendation } = buildRecommendation(season, "USA Internships", 0, 0, false);
    return {
      season,
      seasonLabel: meta.label,
      seasonColor: meta.color,
      monthsUntilPeak: monthsUntilSeptember(now),
      trends: CATEGORIES.map((c) => ({ category: c.label, key: c.key, current: 0, thirtyDaysAgo: 0, momChange: 0 })),
      yoy: CATEGORIES.map((c) => ({ category: c.label, current: 0, lastYear: null, yoyChange: null })),
      hottestCategory: "USA Internships",
      recommendation,
      shortRecommendation,
    };
  }

  const latest = trend[trend.length - 1];

  // 30-day comparison
  const thirtyDaysAgoDate = new Date(now);
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgoDate.toISOString().split("T")[0];
  const thirtyDaysAgoSnap = findClosestSnapshot(trend, thirtyDaysAgoStr);

  const trends: TrendItem[] = CATEGORIES.map((c) => {
    const current = latest[c.key];
    const prev = thirtyDaysAgoSnap?.[c.key] ?? current;
    return { category: c.label, key: c.key, current, thirtyDaysAgo: prev, momChange: pctChange(current, prev) };
  });

  // YoY comparison
  const oneYearAgoDate = new Date(now);
  oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgoDate.toISOString().split("T")[0];
  const oneYearAgoSnap = findClosestSnapshot(trend, oneYearAgoStr);

  const yoy: YoyItem[] = CATEGORIES.map((c) => {
    const current = latest[c.key];
    const lastYear = oneYearAgoSnap?.[c.key] ?? null;
    return {
      category: c.label,
      current,
      lastYear,
      yoyChange: lastYear !== null ? pctChange(current, lastYear) : null,
    };
  });

  // Hottest category
  const hottest = [...trends].sort((a, b) => b.momChange - a.momChange)[0];
  const trendingUp = trends.filter((t) => t.momChange > 0).length >= 2;

  const { recommendation, shortRecommendation } = buildRecommendation(
    season, hottest.category, hottest.momChange, hottest.current, trendingUp
  );

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
  };
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/insights.ts
git commit -m "feat: add market insights computation engine"
```

---

### Task 2: Create homepage InsightCards

**Files:**
- Create: `components/dashboard/InsightCards.tsx`
- Modify: `app/page.tsx`

**Context:** 3 cards in a row between MarketBanner and stats bar. Server Component receiving `MarketInsights` as props. Must follow existing terminal aesthetic (monospace, `▸` prompts, stroke borders).

- [ ] **Step 1: Create `components/dashboard/InsightCards.tsx`**

```tsx
import Link from "next/link";
import type { MarketInsights } from "@/lib/insights";

export function InsightCards({ insights }: { insights: MarketInsights }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 px-5 lg:px-7 py-3">
      {/* Card 1: Season Status */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">market_status</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: insights.seasonColor }} />
          <span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">
            {insights.seasonLabel}
          </span>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">
          {insights.monthsUntilPeak === 0
            ? "Peak season is underway"
            : `Peak season starts in ~${insights.monthsUntilPeak} months`}
        </p>
      </div>

      {/* Card 2: 30-day Trend */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">30d_trend</span>
        </div>
        <div className="space-y-0.5">
          {insights.trends.map((t) => (
            <div key={t.category} className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-stone-600 dark:text-stone-300">{t.category.replace("Internships", "Intern").replace("New Grad", "Grad")}</span>
              <span style={{ color: t.momChange >= 0 ? "#22c55e" : "#ef4444" }}>
                {t.momChange >= 0 ? "↑" : "↓"} {Math.abs(t.momChange)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 3: Recommendation */}
      <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">action</span>
        </div>
        <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed mb-2">
          {insights.shortRecommendation}
        </p>
        <Link href="/insights" className="text-[11px] font-mono font-semibold text-orange-600 hover:underline">
          view_insights →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`**

Add imports at top:
```typescript
import { computeMarketInsights } from "@/lib/insights";
import { InsightCards } from "@/components/dashboard/InsightCards";
```

After the `const trend = ...` line, add:
```typescript
const insights = computeMarketInsights(trend);
```

In the JSX, add `<InsightCards insights={insights} />` between `<MarketBanner>` and the stats bar div.

- [ ] **Step 3: Verify locally**

```bash
npm run dev
```

Check homepage shows 3 insight cards between chart and stats bar.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/InsightCards.tsx app/page.tsx
git commit -m "feat: add market insight cards to homepage"
```

---

### Task 3: Update DashboardHeader nav link

**Files:**
- Modify: `components/dashboard/DashboardHeader.tsx`

- [ ] **Step 1: Change `~/insights` from anchor to route**

In `components/dashboard/DashboardHeader.tsx` line 20, change:
```tsx
// Before:
<a href="#insights" className="font-mono text-xs ...">~/insights</a>

// After:
<Link href="/insights" className="font-mono text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">~/insights</Link>
```

The `Link` import already exists at line 1.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/DashboardHeader.tsx
git commit -m "fix: link ~/insights to /insights route"
```

---

### Task 4: Add `collapsible` prop to MarketBanner

**Files:**
- Modify: `components/dashboard/MarketBanner.tsx`

**Context:** The insights page needs to embed the chart without the collapsible toggle bar and without sharing localStorage state with the homepage.

- [ ] **Step 1: Add `collapsible` prop to Props interface**

```typescript
interface Props {
  trend: TrendPoint[];
  collapsible?: boolean; // default true
}
```

Update the component signature:
```typescript
export function MarketBanner({ trend, collapsible = true }: Props) {
```

- [ ] **Step 2: Conditionally skip localStorage and toggle bar**

Wrap the `useEffect` and toggle/dismiss functions:
```typescript
useEffect(() => {
  if (!collapsible) return;
  const stored = localStorage.getItem("market-banner");
  if (stored === "dismissed") setDismissed(true);
  if (stored === "closed") setOpen(false);
}, [collapsible]);
```

When `!collapsible`, force `open = true`, `dismissed = false`, and skip the toggle bar div entirely. Only render the chart section directly.

**Critical:** Guard the `if (dismissed)` early-return block (lines 64-77) with `if (dismissed && collapsible)` — otherwise the non-collapsible chart on `/insights` could disappear if state leaks.

In the `toggle` and `dismiss` functions, guard with `if (!collapsible) return;`.

When `!collapsible`, render period toggles above the chart (inside the chart card, before `<ResponsiveContainer>`), not in the removed toggle bar.

- [ ] **Step 3: Verify homepage still works (collapsible=true default)**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/MarketBanner.tsx
git commit -m "feat: add collapsible prop to MarketBanner"
```

---

### Task 5: Create insights page components

**Files:**
- Create: `components/insights/TrendTable.tsx`
- Create: `components/insights/SeasonCalendar.tsx`
- Create: `components/insights/HistoricalComparison.tsx`
- Create: `components/insights/TipsSection.tsx`

**Context:** All Server Components. Follow the terminal aesthetic. Receive computed `MarketInsights` data as props.

- [ ] **Step 1: Create `components/insights/TrendTable.tsx`**

Table with columns: Category, Current, 30d Ago, MoM %, YoY %. Green/red arrows for changes. If all YoY values are null, hide the YoY column and show a note.

Use `MarketInsights` `trends` and `yoy` arrays.

- [ ] **Step 2: Create `components/insights/SeasonCalendar.tsx`**

A 12-month grid row. Each month gets a colored background:
- Green (`bg-green-500/20`) for Peak (Sep-Jan)
- Orange (`bg-orange-500/20`) for transitional (Feb-Mar, Aug)
- Stone (`bg-stone-200 dark:bg-stone-800`) for Lull (Apr-Jul)
- Current month gets orange ring border

Props: none (derives from current date). Use `grid-cols-6 md:grid-cols-12` to wrap to 2 rows on mobile.

- [ ] **Step 3: Create `components/insights/HistoricalComparison.tsx`**

Shows each category with `lastYear → current ↑/↓ x%`. Props: `yoy` array from MarketInsights.

- [ ] **Step 4: Create `components/insights/TipsSection.tsx`**

4 tips with `→` bullets. 2 static tips, 2 template-filled with `hottestCategory` and `momChange` data. Props: `{ hottestCategory: string; hottestMom: number }`.

- [ ] **Step 5: Commit all 4 components**

```bash
git add components/insights/
git commit -m "feat: add insights page components"
```

---

### Task 6: Create the `/insights` page

**Files:**
- Create: `app/insights/page.tsx`

**Context:** Server Component. Same ISR (revalidate=3600). Uses `DashboardHeader` + `DashboardFooter` shell. Calls `getDashboardStats()` + `computeMarketInsights()`. Renders all the section components in order.

- [ ] **Step 1: Create `app/insights/page.tsx`**

```tsx
import { getDashboardStats } from "@/lib/dashboard";
import { computeMarketInsights } from "@/lib/insights";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { TrendTable } from "@/components/insights/TrendTable";
import { SeasonCalendar } from "@/components/insights/SeasonCalendar";
import { HistoricalComparison } from "@/components/insights/HistoricalComparison";
import { TipsSection } from "@/components/insights/TipsSection";

export const revalidate = 3600;

export default async function InsightsPage() {
  const dbStats = await getDashboardStats().catch(() => null);
  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <DashboardHeader />

      <div className="flex-1 max-w-4xl mx-auto w-full px-5 lg:px-7 py-6 space-y-6">
        {/* 1. Market Status Hero */}
        <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">market_status</span>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">
              Last updated: {dbStats?.lastSynced ? new Date(dbStats.lastSynced).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: insights.seasonColor }} />
            <span className="font-mono text-lg font-bold text-stone-950 dark:text-stone-50">{insights.seasonLabel}</span>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{insights.recommendation}</p>
        </div>

        {/* 2. Trend Table */}
        <TrendTable trends={insights.trends} yoy={insights.yoy} />

        {/* 3. Market Chart (non-collapsible) */}
        <MarketBanner trend={trend} collapsible={false} />

        {/* 4. Seasonal Calendar */}
        <SeasonCalendar />

        {/* 5. Historical Comparison */}
        <HistoricalComparison yoy={insights.yoy} />

        {/* 6. Tips */}
        <TipsSection hottestCategory={insights.hottestCategory} hottestMom={insights.trends.find((t) => t.category === insights.hottestCategory)?.momChange ?? 0} />
      </div>

      <DashboardFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders at `/insights`**

```bash
npm run dev
```

Visit `http://localhost:3000/insights`

- [ ] **Step 3: Commit**

```bash
git add app/insights/page.tsx
git commit -m "feat: add /insights page"
```

---

### Task 7: Add AGE column to JobsTable

**Files:**
- Modify: `components/dashboard/JobsTable.tsx`

**Context:** `datePosted` is already in the data (string like "Jan 15"). Add a small age indicator column showing relative time.

- [ ] **Step 1: Add AGE column header**

Change the grid from `grid-cols-[2fr_1.5fr_1fr_80px]` to `grid-cols-[2fr_1.5fr_1fr_60px_80px]` (both the header and rows). Add a new column header:

```tsx
<span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Age</span>
```

- [ ] **Step 2: Add age cell in each row**

After the location cell, before the apply cell:

```tsx
<span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono hidden md:block">
  {job.datePosted || "—"}
</span>
```

The `datePosted` value from SimplifyJobs is parsed from cell[4] of the HTML table in `lib/fetch-github-jobs.ts:68`. It's already a formatted short date string (e.g., "Jan 15", "Mar 02"). If empty, show "—".

- [ ] **Step 3: Verify locally**

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/JobsTable.tsx
git commit -m "feat: add age column to jobs table"
```

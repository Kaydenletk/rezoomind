# Historical Chart Data Seed — Design Spec

## Problem

The MarketBanner chart currently shows only ~1 data point because `DashboardSnapshot` only records data from when the cron job started running. The chart also displays 5 role-based lines (SWE, DS/ML, Hardware, PM, Quant) instead of the 4 region-based lines (USA Internships, USA New Grad, Intl Internships, Intl New Grad) defined in the homepage redesign spec.

The speedyapply/2026-SWE-College-Jobs repo has daily git commits since Feb 4, 2024 with job counts embedded in `README.md`. This is real data — the same source the existing cron job scrapes from.

## Solution

1. **Seed script** — Extract ~790 daily snapshots from the speedyapply repo's git history and insert them into the existing `DashboardSnapshot` table.
2. **Update MarketBanner** — Switch from 5 role-based lines to 4 region-based lines with period toggles (3M / 6M / ALL).
3. **Fix data flow** — Remove the column-repurposing hack in `page.tsx` and pass `marketTrend` data with its real field names.

## Seed Script

**File:** `scripts/seed-historical-snapshots.ts`

**Algorithm:**
1. Clone `speedyapply/2026-SWE-College-Jobs` to `/tmp/speedyapply-jobs` (skip if exists)
2. Run `git log --reverse --oneline --format="%h %ad" --date=short` to get all commits with dates
3. Deduplicate by date (keep first commit per day)
4. For each commit, run `git show <hash>:README.md` and extract 4 counts using regex:
   ```
   Pattern: /\*\*(\d+)\*\* available/g
   Order in README: USA Internships, USA New Grad, Intl Internships, Intl New Grad
   ```
5. Upsert into `DashboardSnapshot` (skip dates that already have data from the cron job)
6. Log progress every 50 commits

**Data range:** Feb 4, 2024 → present (~790 data points)

**Run command:** `npx tsx scripts/seed-historical-snapshots.ts`

**Dependencies:** Uses `child_process.execSync` for git commands + existing Prisma client. No new packages needed.

## MarketBanner Updates

**File:** `components/dashboard/MarketBanner.tsx`

### Interface change

```typescript
// Before
interface TrendPoint {
  date: string;
  swe: number; pm: number; dsml: number; quant: number; hardware: number;
}

// After
interface TrendPoint {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}
```

### Line definitions change

```typescript
// Before: 5 role-based lines
const LINES = [
  { key: "swe", color: "#3b82f6", label: "SWE" },
  { key: "dsml", color: "#a855f7", label: "DS/ML" },
  { key: "hardware", color: "#f97316", label: "Hardware" },
  { key: "pm", color: "#22c55e", label: "PM" },
  { key: "quant", color: "#ef4444", label: "Quant" },
];

// After: 4 region-based lines (matching spec colors)
const LINES = [
  { key: "usaInternships", color: "#3b82f6", label: "USA Internships" },
  { key: "usaNewGrad", color: "#22c55e", label: "USA New Grad" },
  { key: "intlInternships", color: "#a855f7", label: "Intl Internships" },
  { key: "intlNewGrad", color: "#ef4444", label: "Intl New Grad" },
];
```

### New: Period toggles

Add `3M / 6M / ALL` toggle buttons above the chart. Client-side filtering slices the `trend` array by date. Active toggle: orange background. Default: ALL.

### Chart height

Increase from 180px to ~300px to accommodate the richer dataset.

### Title update

Change section title from `market_trend` to `Software Engineering College Job Market` (with `▸` prompt).

## Data Flow Fix

**File:** `app/page.tsx`

```typescript
// Before: awkward repurposing
const trend = (dbStats?.marketTrend ?? []).map((s) => ({
  date: s.date,
  swe: s.usaInternships,
  pm: 0,
  dsml: s.usaNewGrad,
  quant: s.intlInternships,
  hardware: s.intlNewGrad,
}));

// After: pass through directly
const trend = dbStats?.marketTrend ?? [];
```

The `MarketBanner` props type will match the `marketTrend` shape from `getDashboardStats()` directly.

## Files Changed

| File | Change |
|------|--------|
| `scripts/seed-historical-snapshots.ts` | **New** — one-time seed script |
| `components/dashboard/MarketBanner.tsx` | Update lines, add period toggles, fix types |
| `app/page.tsx` | Remove column-repurposing hack, pass marketTrend directly |

## Files NOT Changed

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | `DashboardSnapshot` already has the right columns |
| `lib/dashboard.ts` | Already queries snapshots correctly with proper field names |
| `app/api/cron/scrape-jobs/route.ts` | Already records daily snapshots — keeps working as-is |
| `components/dashboard/MarketChart.tsx` | Sidebar bar chart is unaffected |

## Testing

1. Run seed script locally and verify `DashboardSnapshot` table has ~790 rows
2. Check chart renders with full date range (Feb 2024 → Apr 2026)
3. Verify period toggles (3M/6M/ALL) filter correctly
4. Verify cron job still records new snapshots without conflicts (upsert on date)

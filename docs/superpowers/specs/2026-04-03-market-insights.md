# Market Insights Feature — Design Spec

## Problem

The dashboard shows historical job market data but doesn't help users interpret it. Students looking for internships/new grad positions can't tell when to apply, whether the market is trending up or down, or how current numbers compare to historical patterns. The data is there — the insights are not.

## Solution

Add a **computed insights engine** (math + templates, no AI) that analyzes `DashboardSnapshot` data and surfaces:
1. **Homepage insight cards** — 3 cards between the chart and stats bar showing season status, 30-day trends, and an actionable recommendation
2. **Full `/insights` page** — Deeper analysis with trend table, seasonal calendar, YoY comparison, and tips

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Computation | Math + templates | Zero cost, instant, deterministic. Feels smart without AI tokens. |
| Placement | Between chart and stats bar | Natural flow: see the chart → understand the insights → browse jobs |
| Insights page | Server-rendered | Data doesn't change often (ISR 1hr like homepage). No client-side fetching needed. |
| Aesthetic | Same terminal design | Monospace headers, `▸` prompts, stroke borders. No new design patterns. |

---

## Part 1: Insight Engine

### File: `lib/insights.ts`

A pure function that takes the `marketTrend` array from `getDashboardStats()` and returns structured insights. Server-side only.

```typescript
// Input type matches getDashboardStats().marketTrend shape
type MarketTrendPoint = {
  date: string;           // YYYY-MM-DD
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
};

function computeMarketInsights(trend: MarketTrendPoint[]): MarketInsights
```

**Empty data contract:** If `trend` is empty or has fewer than 2 data points, return a default `MarketInsights` with season based on current month, all trends at 0%, null YoY, and a generic recommendation. The homepage should render the cards normally (never hide them) — the season status and recommendation are always valid regardless of data.

### Season Detection

Based on current month:

| Months | Season | Status Dot |
|--------|--------|------------|
| Sep, Oct, Nov, Dec, Jan | Peak | Green |
| Feb, Mar | Winding Down | Orange |
| Apr, May, Jun, Jul | Lull | Yellow |
| Aug | Ramping Up | Blue |

### Computed Values

```typescript
interface MarketInsights {
  // Season
  season: "peak" | "winding-down" | "lull" | "ramping-up";
  seasonLabel: string;           // "Peak Season" | "Winding Down" | "Seasonal Lull" | "Ramping Up"
  seasonColor: string;           // green | orange | yellow | blue (hex values)
  monthsUntilPeak: number;       // Months until next September

  // Trends (30-day)
  trends: Array<{
    category: string;            // "USA Internships" etc.
    current: number;
    thirtyDaysAgo: number;
    momChange: number;           // % change, positive = growth
  }>;

  // Year-over-year (same month last year, if data exists)
  yoy: Array<{
    category: string;
    current: number;
    lastYear: number | null;     // null if no data for that month last year
    yoyChange: number | null;
  }>;

  // Derived
  hottestCategory: string;       // Category with highest MoM growth
  monthsUntilPeak: number;       // 0 during peak season, otherwise months until next September

  // Recommendation (template-filled string)
  recommendation: string;
  shortRecommendation: string;   // One-liner for homepage card
}
```

### Recommendation Templates

Templates selected by `season` + overall trend direction (majority of categories up or down):

| Season | Trend | Template |
|--------|-------|----------|
| lull | down | "The market is in its seasonal lull. Historically, postings surge around September. Use this time to prep your resume and practice interviews." |
| lull | up | "Even in the lull, {hottestCategory} is trending up ({x}%). Some companies post early — keep an eye out for early openers." |
| ramping-up | any | "The market is heating up. {hottestCategory} postings increased {x}% this month. Get your applications ready — early applicants get first looks." |
| peak | up | "Peak recruiting season is underway. {hottestCategory} are up {x}% this month. Apply within 48 hours of new postings for best chances." |
| peak | down | "We're in peak season but postings are tapering. Most positions fill by January — don't delay applications." |
| winding-down | any | "Peak season is winding down. Late-cycle positions often have less competition. {hottestCategory} still has {current} active postings." |

Short recommendations follow the same logic but as one-liners (under 80 chars).

---

## Part 2: Homepage Insight Cards

### Component: `components/dashboard/InsightCards.tsx`

Server Component — receives `MarketInsights` as props from `page.tsx`.

### Layout

3 cards in a horizontal row (`grid grid-cols-1 md:grid-cols-3 gap-3.5`), placed between `MarketBanner` and the stats bar in `app/page.tsx`.

### Card 1: Season Status (`market_status`)

```
▸ market_status
  ● Seasonal Lull
  Peak season starts in ~5 months
```

- Status dot color matches `seasonColor`
- Season label in bold
- `monthsUntilPeak` formatted as "Peak season starts in ~{n} months" (or "Peak season is underway" if in peak)

### Card 2: Trend Snapshot (`30d_trend`)

```
▸ 30d_trend
  USA Intern    ↓ 12%
  USA Grad      ↑  3%
  Intl Intern   ↓  8%
  Intl Grad     ↓  5%
```

- Arrow + percentage for each category
- Green (`#22c55e`) for positive, red (`#ef4444`) for negative
- Monospace aligned

### Card 3: Recommendation (`action`)

```
▸ action
  Prep season — build projects,
  polish resume. Set alerts for
  September.

  view_insights →
```

- `shortRecommendation` text
- Link to `/insights` page
- Orange text for the link

### Styling

All cards use existing design system:
- `border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px]`
- `bg-white dark:bg-stone-900`
- Monospace `▸` section headers (orange)
- Compact: `p-3` padding

---

## Part 3: Full Insights Page

### Route: `app/insights/page.tsx`

Server Component with `revalidate = 3600` (same as homepage). Calls `getDashboardStats()` and `computeMarketInsights()`.

### Layout

Uses the same shell as homepage: `DashboardHeader` + `DashboardFooter`. Content is a single column, max-width container.

**Nav link fix:** Update `DashboardHeader` so `~/insights` links to `/insights` (real route) instead of `#insights` (anchor). This is now a real page.

### Sections

#### 1. Market Status Hero

Full-width card at top:
```
▸ market_status                                    Last updated: Apr 2, 2026

  ● Seasonal Lull

  The market is in its seasonal lull. Historically, postings surge around
  September. Use this time to prep your resume and practice interviews.
```

- Large season label with colored dot
- Full `recommendation` text (not the short version)
- `lastSynced` timestamp

#### 2. Trend Table

```
▸ trend_analysis

  CATEGORY          CURRENT    30D AGO    MOM %     YOY %
  USA Internships     353        401      ↓ 12%    ↑  5%
  USA New Grad        383        372      ↑  3%    ↑ 99%
  Intl Internships    338        367      ↓  8%    ↑ 26%
  Intl New Grad       429        452      ↓  5%    ↓ 11%
```

- Static table (no sorting needed — only 4 rows)
- Color-coded arrows
- YoY column shows "—" if no data from last year
- If ALL 4 categories have null YoY, hide the YoY column entirely and show "Year-over-year data not yet available" note

#### 3. Market Chart

Reuse `MarketBanner` component with a `collapsible` prop (default `true`). When `collapsible={false}`:
- Skip the toggle bar (no expand/collapse button, no dismiss button)
- Skip all `localStorage` side effects (no reading/writing `"market-banner"` key — avoids conflict with homepage state)
- Render the chart directly (always expanded)
- Keep the period toggles (render them above the chart instead)

#### 4. Seasonal Calendar

A 12-month horizontal bar showing the annual hiring cycle:

```
▸ hiring_calendar

  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
  ███  ▓▓▓  ▓▓▓  ░░░  ░░░  ░░░  ░░░  ▓▓▓  ███  ███  ███  ███
  peak wind wind lull lull lull lull ramp peak peak peak peak
```

- Green background for Peak months (Sep-Jan)
- Orange for transitional (Feb-Mar winding down, Aug ramping up)
- Gray/stone for Lull (Apr-Jul)
- Current month highlighted with orange border
- Simple `div` grid, no chart library needed

#### 5. Historical Comparison

```
▸ this_time_last_year                                        Apr 2025

  USA Internships:  336 → 353  ↑  5%
  USA New Grad:     192 → 383  ↑ 99%
  Intl Internships: 268 → 338  ↑ 26%
  Intl New Grad:    386 → 429  ↑ 11%
```

- Compare current snapshot to closest date ~365 days ago
- Same styling as trend table

#### 6. Tips Section

```
▸ tips

  → Apply within 48 hours of a posting going live — early applicants
    get reviewed first in rolling admissions.

  → Peak season (Sep–Jan) has the most openings but also the most
    competition. Spring lull positions often have fewer applicants.

  → Currently {hottestCategory} is the fastest-growing category
    at +{x}% this month.

  → Set up job alerts now. When September hits, you want to be
    first in line, not still writing your resume.
```

- 4 tips, some static, some template-filled with live data
- `→` bullet style (matching terminal aesthetic)

---

## Data Flow

```
DashboardSnapshot (DB)
  → getDashboardStats() (lib/dashboard.ts) — existing, returns marketTrend[]
  → computeMarketInsights(marketTrend) (lib/insights.ts) — NEW
  → InsightCards (homepage) + InsightsPage (/insights)
```

No new database models. No new API routes. Everything computed from existing `DashboardSnapshot` data.

## New Files

| File | Type | Purpose |
|------|------|---------|
| `lib/insights.ts` | Server util | `computeMarketInsights()` — pure computation |
| `components/dashboard/InsightCards.tsx` | Server Component | 3 homepage insight cards |
| `app/insights/page.tsx` | Page | Full insights page |
| `components/insights/TrendTable.tsx` | Server Component | Trend analysis table |
| `components/insights/SeasonCalendar.tsx` | Server Component | 12-month hiring calendar |
| `components/insights/HistoricalComparison.tsx` | Server Component | YoY comparison |
| `components/insights/TipsSection.tsx` | Server Component | Season-aware tips |

## Modified Files

| File | Change |
|------|--------|
| `app/page.tsx` | Add `InsightCards` between MarketBanner and stats bar |
| `components/dashboard/MarketBanner.tsx` | Add `collapsible` prop (default true) so insights page can render chart without toggle/localStorage |
| `components/dashboard/DashboardHeader.tsx` | Change `~/insights` link from `#insights` anchor to `/insights` route |

**Folder note:** New insight page components go in `components/insights/` (separate from `components/dashboard/`) since they are specific to the insights page, not reused on the homepage.

## Dependencies

No new packages. Uses existing Recharts (for chart on insights page) and Prisma.

## Responsive Behavior

- Homepage cards: 3 columns on desktop, stack to 1 column on mobile
- Insights page: Single column, full-width. Tables scroll horizontally on mobile.
- Seasonal calendar: Wraps to 2 rows (6+6) on mobile if needed

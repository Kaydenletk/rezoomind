# Homepage Market Pulse — Design Spec

> **Date:** 2026-04-10
> **Status:** Approved
> **Scope:** Public homepage hierarchy fix for market data vs. job explorer

## Context

The homepage currently proves Rezoomind has strong data, but it presents that data in the wrong order. The market block above the fold is too tall:

- `SummaryStrip`
- `MainInsightCard`
- `MarketBanner` chart
- `InsightCards`

That stack pushes the most important user task, the job explorer, below the fold. A new visitor must scroll before they can browse jobs. This weakens the product promise of anonymous-first job discovery.

The homepage should still show that the market data is live and credible, but the explorer must become the primary above-the-fold action.

## Problem Statement

The current homepage is `market-first` in layout even though the product promise is `job-first`.

Specific issues:

1. The trend chart consumes too much vertical space before the explorer.
2. Market information is fragmented across multiple blocks instead of one quick-scan surface.
3. The three insight cards add height without enough homepage value.
4. On first load, users are asked to interpret data before they can take action.

## Goal

Change the homepage to `job-first with market credibility`.

The new hierarchy should:

1. Keep a compact market summary near the top.
2. Hide the full chart by default.
3. Preserve the existing full chart experience on `/insights`.
4. Pull the job explorer noticeably higher on the homepage.
5. Avoid breaking the existing `HomeClientShell` grid or `JobsTable` layout.

## Non-Goals

- No redesign of the hero section.
- No redesign of the `JobsTable` columns or row layout.
- No change to `/insights` information architecture beyond keeping current chart behavior intact.
- No modal or route change for chart expansion.
- No new data source, metric, or analytics computation beyond homepage presentation needs.

## Chosen Direction

Use a compact `Market Pulse` bar, keep one short plain-English insight card, and render the existing chart inline in a collapsed state by default.

User-validated decisions:

- Chart behavior: keep on homepage but collapsed by default.
- Market information layout: consolidate the current strip/cards into one horizontal pulse bar.
- Chart CTA behavior: expand/collapse inline directly below the pulse bar.
- Mobile behavior: hide secondary metrics instead of wrapping into a messy multi-row strip.

## Homepage Hierarchy

New homepage order:

1. Hero section inside `HomeClientShell`
2. `MarketStatusBar` (new compact pulse bar)
3. `MarketBanner` (collapsed by default, expands inline)
4. `MainInsightCard` (reduced to one short sentence)
5. `HomepageExplorerBar`
6. `JobsTable`

Removed from homepage top area:

- `SummaryStrip`
- `InsightCards`

Reasoning:

- The pulse bar keeps live-market proof visible.
- The chart becomes supporting evidence instead of the primary visual.
- The short insight card still explains the market in plain English.
- The explorer moves up without changing the overall shell structure.

## Component Design

### 1. New `MarketStatusBar.tsx`

Create a new homepage-only component:

`components/dashboard/MarketStatusBar.tsx`

Purpose:

- Compress the key market signals into one quick-scan row.
- Act as the control surface for opening and closing the chart.

Displayed signals on desktop:

- `Market` status with colored dot and explicit label
- `Fresh Today`
- `Best Window`
- `30-day Trend`
- `View chart` / `Hide chart` CTA

Displayed signals on mobile:

- `Market`
- `Fresh Today`
- CTA

Hidden on mobile:

- `Best Window`
- `30-day Trend`

Visual rules:

- Keep the existing terminal-control-panel language.
- No emoji icons.
- Use color as a supporting cue, not the only cue.
- Keep the bar compact enough to function like a status rail, not a card stack.

Example content shape:

`Market: Seasonal Lull | Fresh Today: 36 | Best Window: 48-72hrs | 30-day Trend: ↓ 25% | View chart ▾`

### 2. Existing `MarketBanner.tsx`

Keep the existing chart implementation and aspect ratio, but change homepage control flow.

Requirements:

- Homepage: chart is closed by default.
- Homepage: CTA in `MarketStatusBar` opens/closes the chart inline.
- `/insights`: chart remains expanded as it is today.
- Existing Recharts configuration and chart height remain intact.

Design constraint:

- The chart should remain visually subordinate to the explorer on homepage, but visually unchanged when expanded.

State model:

- Homepage open/closed state should be controlled by the homepage orchestration layer rather than by the chart owning its own persisted homepage toggle behavior.
- `/insights` can continue to render the chart expanded without relying on homepage toggle state.

### 3. Existing `MainInsightCard.tsx`

Keep the component on the homepage, but reduce the content target to one short plain-English sentence.

Purpose:

- Explain the market quickly.
- Avoid a second tall interpretation block above the explorer.

Copy rule:

- One sentence.
- Short enough to scan in 3 to 4 seconds.
- No extra guidance block and no stacked support content.

### 4. Existing `SummaryStrip.tsx`

Do not use this component on the homepage after this redesign.

Reason:

- Its information is absorbed into `MarketStatusBar`.
- Keeping both would reintroduce duplicated signals and unnecessary height.

### 5. Existing `InsightCards.tsx`

Do not render these cards on the homepage after this redesign.

Reason:

- They add vertical weight above the explorer.
- Their value is better represented on `/insights` than on the first screen of the homepage.

## Data Mapping

The homepage should continue using `computeMarketInsights(trend)` and existing server-side data preparation.

`MarketStatusBar` data sources:

- `Market`: derived from `insights.seasonLabel` and `insights.seasonColor`
- `Fresh Today`: existing homepage `freshToday`
- `Best Window`: existing constant `48-72hrs`
- `30-day Trend`: derive a single topline trend from `insights.trends`

Topline trend rule:

- Use the strongest current directional signal for the bar, not all four category rows.
- The displayed value should be a single explicit directional metric such as `↓ 25%`.
- If no trustworthy topline trend is available, show `—` instead of inventing one.

This keeps the bar readable and prevents the four-category detail from re-expanding the homepage mentally.

## Interaction Design

### Default State

On first load:

- `MarketStatusBar` is visible.
- `MarketBanner` is hidden/collapsed.
- `MainInsightCard` is visible.
- Explorer appears sooner than it does today.

### CTA Behavior

`MarketStatusBar` owns the chart toggle CTA copy:

- Closed state: `View chart ▾`
- Open state: `Hide chart ▴`

Behavior:

- Toggle inline.
- No scroll jump.
- No modal.
- No route change.

### Motion

- Keep motion minimal.
- Use quick, clear expand/collapse behavior.
- Respect `prefers-reduced-motion`.

## Responsive Rules

### Desktop / Large Tablet

Show:

- Market
- Fresh Today
- Best Window
- 30-day Trend
- CTA

### Mobile

Show only:

- Market
- Fresh Today
- CTA

Do not:

- Wrap the pulse bar into a noisy two-row metrics block.
- Let the bar create awkward horizontal overflow.

The mobile priority is clarity and compactness, not metric completeness.

## Accessibility

Requirements:

- CTA must be a real `button`
- Use `aria-expanded`
- Use `aria-controls` to associate the button with the chart region
- Preserve visible focus states
- Color must not be the only signal
- Maintain readable text contrast in both light and dark mode

The pulse bar must remain understandable even for users who do not perceive the color dot.

## Error Handling and Fallbacks

### No Trend Data

If `trend` is empty or insufficient:

- `MarketStatusBar` still renders with fallback season/status text from `computeMarketInsights`
- CTA may be hidden or disabled if opening the chart would not add value
- No fake urgency or fabricated numbers

### `freshToday = 0`

Render `Fresh Today: 0` as-is.

Do not hide it and do not substitute a more flattering value.

### Missing Topline Trend

Render:

- `30-day Trend: —`

Do not guess.

## File Impact

Expected files to change:

- `app/page.tsx`
- `components/dashboard/MarketBanner.tsx`
- `components/dashboard/MainInsightCard.tsx`
- `components/dashboard/MarketStatusBar.tsx` (new)

Likely unchanged:

- `components/dashboard/HomeClientShell.tsx`
- `components/dashboard/JobsTable.tsx`
- `/insights` page layout structure

This is intentionally a focused homepage hierarchy change, not a shell rewrite.

## Acceptance Criteria

- Homepage no longer renders the existing `SummaryStrip` above the explorer.
- Homepage no longer renders the existing `InsightCards` above the explorer.
- Homepage shows a compact `MarketStatusBar` directly above the collapsed chart region.
- Homepage chart is closed by default.
- Homepage CTA expands and collapses the chart inline.
- `/insights` still renders the chart expanded.
- `MainInsightCard` remains present but visually lightweight and copy-light.
- Explorer appears materially higher on the page than before.
- Mobile pulse bar shows only essential metrics and CTA.
- No regression to `HomeClientShell` grid structure.
- No regression to `JobsTable` column layout.

## Verification Plan

1. Load homepage and confirm the chart is not open by default.
2. Confirm the explorer appears above the fold sooner than in the previous layout.
3. Click the pulse-bar CTA and confirm the chart opens inline below the bar.
4. Click the CTA again and confirm the chart closes cleanly.
5. Visit `/insights` and confirm the chart remains expanded.
6. Verify desktop layout at `1024px` and `1440px`.
7. Verify mobile layout at `375px` and `430px`.
8. Confirm no horizontal overflow caused by the pulse bar on mobile.
9. Confirm keyboard focus and screen-reader-friendly chart toggle semantics.

## Open Questions Resolved

- Should the chart stay on homepage? Yes, but collapsed by default.
- Should the chart open inline, scroll, or modal? Inline.
- Should the old strip and insight-card grid remain? No, replace them with one compact pulse bar and one short insight sentence.
- Should mobile wrap the metrics into multiple rows? No, hide secondary metrics instead.

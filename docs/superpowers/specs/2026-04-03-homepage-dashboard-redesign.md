# Homepage Dashboard Redesign — Design Spec

## Problem

The current homepage is a marketing funnel page with fake stats (12,400+ students, 85% improvement), fabricated testimonials (Sarah M. @ Google, James K. @ Meta), and multiple conversion sections (pricing, problem/solution, features grid). As a solo project, this social proof is not credible. Recruiters evaluating this as a portfolio piece will see through it immediately.

## Solution

Replace the entire homepage with a **dashboard-first command center** that shows real job market data from [speedyapply/2026-SWE-College-Jobs](https://github.com/speedyapply/2026-SWE-College-Jobs) (the repo the existing scraper uses). No marketing copy, no fake numbers — just a working product with real data.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Direction | Dashboard-First | Homepage IS the dashboard. No marketing landing page. |
| Layout | Bento Grid | Stats bar → Chart + sidebar → Table + sidebar. Professional, above-fold density. |
| Content | Command Center | Category breakdown + multi-line market chart + job table + top hiring bars |
| CTA Strategy | Integrated locked card | One dashed-border "your_matches" card inside the bento grid, with blurred donut + sign_in CTA |
| Navigation | Logo + ~/jobs + ~/insights + sign_in | Anchor links on same page. Minimal. |
| Charts | Recharts | Popular React chart library. Smooth animations, good docs, composable. |
| Color | White + Orange (#ea580c) + Slate strokes | Minimalist. No gradients, no dark mode, no neon. |
| Aesthetic | Terminal × Modern | Monospace headers, `▸` prompts, connected dots, stroke borders, dashed connectors |
| Data source | speedyapply/2026-SWE-College-Jobs | Real scraped data. Hourly cron already exists. Scrapes 4 markdown files: README.md, NEW_GRAD_USA.md, INTERN_INTL.md, NEW_GRAD_INTL.md |

## Sections Removed

Everything from the current homepage is removed:

- Hero section with animated blobs and email form
- Problem/Solution section (pink/green gradient cards)
- Stats section (85% avg improvement, 3× interviews, 12,400+ students, <30s)
- How It Works 3-step cards
- Features grid (6 cards)
- Testimonials (3 fabricated)
- Job Alerts feature section with stat cards
- Logo marquee (18 company carousel)
- Pricing section
- Final CTA with email form
- BackgroundMotion animated blobs
- All Framer Motion fade-up animations on homepage

## Page Structure

The homepage (`app/page.tsx`) becomes a single-page dashboard with these sections top to bottom:

### 1. Header

```
[● ○ ○] rezoomind | ~/jobs  ~/insights                    [sign_in →]
```

- Three dots (terminal window controls) — first filled orange, others stroke-only
- Brand name in monospace, orange, lowercase
- Pipe separator
- `~/jobs` scrolls to the jobs table section on the same page (anchor `#jobs`)
- `~/insights` scrolls to the market chart section (anchor `#insights`)
- Sign-in button: orange stroke border, monospace text, links to `/login`

### 2. Category Breakdown (2-column grid)

Two cards side by side:

**Left: 🇺🇸 USA Positions**
- Internships row: colored dot + label + count + filter tags (FAANG+, Quant, Other)
- New Graduate row: same structure

**Right: 🌐 International Positions**
- Same structure as USA

Each filter tag is a small pill badge. Counts come from real scraped data. Colored dots match the chart legend colors:
- Blue (#3b82f6) = USA Internships
- Green (#22c55e) = USA New Grad
- Purple (#a855f7) = Intl Internships
- Red (#ef4444) = Intl New Grad

### 3. Multi-Line Market Chart (full width)

Title: `▸ Software Engineering College Job Market`

Period toggles: 3M / 6M / ALL (ALL selected by default)

Four lines on one Recharts `<LineChart>`:
- USA Internships (blue)
- USA New Grad (green)
- International Internships (purple)
- International New Grad (red)

X-axis: monthly labels (Jul '24 → Apr '26)
Y-axis: job count scale
Legend below chart with colored dots + labels

**Data strategy:** The chart requires historical time-series data. Add a new Prisma model `DashboardSnapshot` to record daily counts:

```prisma
model DashboardSnapshot {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date             DateTime @db.Date @unique
  usaInternships   Int
  usaNewGrad       Int
  intlInternships  Int
  intlNewGrad      Int
  created_at       DateTime @default(now()) @db.Timestamptz
}
```

Add a snapshot step to the existing cron job (`/api/cron/scrape-jobs`): after scraping, count jobs by category and upsert a `DashboardSnapshot` row for today's date.

**For MVP:** The chart initially shows only data from the day snapshots start being recorded (growing over time as data accumulates). On first deploy, seed one snapshot with current counts so the chart is not empty. Do NOT use fake historical data — an empty-but-growing chart is more honest than fabricated trends.

**Period toggles (3M / 6M / ALL):** All data is returned from the API. Client-side filtering slices the `marketTrend` array by date range. Active toggle gets orange background; inactive get stone-200 border. Default: ALL.

### 4. Bottom Bento Row (3-column grid: 3fr 1.2fr 1fr)

**Left: Job Table (`recent_postings`)**
- Terminal-style header with `▸` prompt and "new" badge
- Table columns: Role | Company | Location | Time
- Company column has colored dot matching its category
- 4-5 most recent job postings
- "view_all →" link to /jobs page
- Data comes from real scraped jobs

**Middle: Top Hiring (`top_hiring`)**
- Horizontal bar chart showing top 5 companies by posting count
- Orange gradient bars (darkest for #1, lightest for #5)
- Company name + count labels
- Data aggregated from scraped jobs

**Right: Locked Card (`your_matches`)**
- Dashed border (#e7e5e4)
- Subtle background (#fafaf9)
- Blurred donut chart (filter: blur(2px), opacity: 0.35)
- Lock icon centered over donut
- Text: "AI matching / resume analysis / saved jobs"
- Dark CTA button: "sign_in →" (background: #0c0a09)

### 5. Footer (minimal)

```
$ rezoomind · data from speedyapply · updated daily          about  github
```

## Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Brand | #ea580c (orange-600) | Logo, accents, active states, primary CTA borders |
| Text primary | #0c0a09 (stone-950) | Headlines, bold text |
| Text secondary | #44403c (stone-700) | Body text |
| Text muted | #a8a29e (stone-400) | Labels, timestamps, inactive |
| Text faint | #d6d3d1 (stone-300) | Separators, x-axis labels |
| Border | #e7e5e4 (stone-200) | Card borders, dividers |
| Background | #fafaf9 (stone-50) | Page background, table header |
| Card bg | #ffffff | Card backgrounds |
| Success | #22c55e | Positive change indicators, "Live" status |
| Chart blue | #3b82f6 | USA Internships line |
| Chart green | #22c55e | USA New Grad line |
| Chart purple | #a855f7 | Intl Internships line |
| Chart red | #ef4444 | Intl New Grad line |
| Locked bg | #fafaf9 | Locked card background |
| Dark CTA | #0c0a09 | Sign-in button in locked card |

### Typography

| Element | Font | Weight | Size | Style |
|---------|------|--------|------|-------|
| Brand name | Mono (Geist Mono or JetBrains Mono) | 700 | 15px | lowercase, letter-spacing: 1px |
| Nav items | Mono | 400 | 12px | lowercase |
| Terminal prompts (▸) | Mono | 700 | 12-13px | orange |
| Section titles | Mono | 700 | 13-15px | — |
| Stat numbers | Inter | 800 | 28-32px | letter-spacing: -1.5px |
| Stat labels | Mono | 500 | 10-11px | uppercase, letter-spacing: 0.8-1px |
| Table text | Inter | 500-600 | 11-12px | — |
| Filter tags | Inter | 500 | 10px | — |

### Patterns

- **Stroke borders**: 1.5px solid stone-200 for all cards
- **Dashed borders**: 1.5px dashed stone-200 for locked/teaser cards
- **Dashed connectors**: Between stat cards (optional, nice-to-have)
- **Border radius**: 10px for cards, 4-6px for buttons/tags
- **No shadows**: Pure stroke-based design
- **No gradients**: Flat colors only (except chart area fill which uses subtle opacity gradient)
- **Terminal prompts**: `▸` character before section titles, colored orange

## Data Architecture

### Data Sources

The existing cron job (`/api/cron/scrape-jobs`) scrapes from `speedyapply/2026-SWE-College-Jobs` GitHub repo (4 markdown files: README.md for USA internships, NEW_GRAD_USA.md, INTERN_INTL.md, NEW_GRAD_INTL.md). Jobs are stored in `job_postings` with a `tags` string array.

**Tag structure for GitHub-scraped jobs:** `[jobType, region, category, "2026-swe", "date:repo"]`

- `jobType`: `"internship"` | `"new-grad"`
- `region`: `"usa"` | `"international"`
- `category`: `"faang"` | `"quant"` | `"other"` (from HTML comment markers `<!-- TABLE_FAANG_START -->` etc. in markdown)

**Category query logic:**

- `usa-intern`: tags contains BOTH `"internship"` AND `"usa"`
- `usa-newgrad`: tags contains BOTH `"new-grad"` AND `"usa"`
- `intl-intern`: tags contains BOTH `"internship"` AND `"international"`
- `intl-newgrad`: tags contains BOTH `"new-grad"` AND `"international"`
- Sub-categories (FAANG/Quant/Other): additionally filter by tags containing `"faang"`, `"quant"`, or `"other"`

**Note:** JSearch-scraped jobs (source `"jsearch"`) have different tags (`["jsearch", "remote", ...]`) and lack region/category tags. These jobs are excluded from the category breakdown and chart but may appear in the recent postings table.

The dashboard needs:

1. **Category counts** — Total active jobs grouped by: USA Internship, USA New Grad, Intl Internship, Intl New Grad
2. **Recent postings** — Latest 4-5 jobs with: title, company, location, posted time
3. **Top hiring** — Top 5 companies by number of active postings
4. **Market trend** — Historical job counts over time (line chart data)

### API Endpoint

Create one new API route: `GET /api/dashboard/stats`

Response shape:
```typescript
{
  categories: {
    usaInternships: { total: number; faang: number; quant: number; other: number };
    usaNewGrad: { total: number; faang: number; quant: number; other: number };
    intlInternships: { total: number; faang: number; quant: number; other: number };
    intlNewGrad: { total: number; faang: number; quant: number; other: number };
  };
  totalJobs: number;
  recentPostings: Array<{
    id: string;
    title: string;       // maps from job_postings.role
    company: string;
    location: string | null;
    postedAt: string;    // maps from job_postings.date_posted ?? job_postings.created_at
    category: 'usa-intern' | 'usa-newgrad' | 'intl-intern' | 'intl-newgrad' | 'uncategorized';
    url: string | null;  // maps from job_postings.url (nullable)
  }>;
  topHiring: Array<{ company: string; count: number }>; // top 5 by total active postings (all time, all categories)
  marketTrend: Array<{
    date: string; // YYYY-MM-DD, from DashboardSnapshot.date
    usaInternships: number;
    usaNewGrad: number;
    intlInternships: number;
    intlNewGrad: number;
  }>;
  lastSynced: string; // MAX(created_at) from job_postings table
}
```

### Caching Strategy

- Dashboard stats are expensive to compute on every request
- Use ISR with `revalidate: 3600` (1 hour) on the homepage — this is the primary caching mechanism
- The homepage should be a **Server Component** that fetches data directly (no client-side API call needed for initial render)
- Interactive sub-components (chart period toggle) are Client Components that receive data as props
- The `/api/dashboard/stats` endpoint exists for potential future client-side refreshes but is not used on initial page load

### Loading, Error, and Empty States

- **Loading:** Use `loading.tsx` in `app/` to show skeleton cards matching the bento grid layout — gray pulsing rectangles for stats, chart area, and table rows
- **API error / DB unavailable:** Show a centered message: "Unable to load dashboard data. Retrying..." with a retry button
- **Zero jobs in a category:** Show count as `0` — do not hide the row. The category structure should always be visible
- **Fewer than 4 recent postings:** Show however many exist. If zero, show "No recent postings" in the table body
- **Empty market trend:** Show chart area with "Collecting data..." message centered. Chart will populate as daily snapshots accumulate

### Server/Client Component Boundary

The homepage (`app/page.tsx`) is a **Server Component** that:

1. Calls a `getDashboardStats()` server function (direct Prisma queries, no API fetch)
2. Passes data as props to child components

Client Components (need `"use client"`):

- `MarketChart.tsx` — Recharts requires client-side rendering + period toggle state
- `CategoryBreakdown.tsx` — filter tag click interactions (future: filter jobs by FAANG/Quant/Other)

Server Components (no interactivity):

- `DashboardHeader.tsx`, `JobsTable.tsx`, `TopHiring.tsx`, `LockedCard.tsx`, `DashboardFooter.tsx`

## Components

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DashboardHeader` | `components/dashboard/DashboardHeader.tsx` | Terminal-style header with dots, logo, nav, sign-in |
| `CategoryBreakdown` | `components/dashboard/CategoryBreakdown.tsx` | 2-column USA/International position cards |
| `MarketChart` | `components/dashboard/MarketChart.tsx` | Multi-line Recharts LineChart with period toggles |
| `JobsTable` | `components/dashboard/JobsTable.tsx` | Terminal-styled recent postings table |
| `TopHiring` | `components/dashboard/TopHiring.tsx` | Horizontal bar chart of top companies |
| `LockedCard` | `components/dashboard/LockedCard.tsx` | Blurred donut + lock + sign-in CTA |
| `DashboardFooter` | `components/dashboard/DashboardFooter.tsx` | Minimal terminal footer |

### Modified Files

| File | Change |
|------|--------|
| `app/page.tsx` | Complete rewrite — replace marketing page with dashboard |
| `app/layout.tsx` | Remove `<Header />` and `<Footer />` from root layout. Use route groups: `app/(dashboard)/page.tsx` renders its own DashboardHeader/DashboardFooter; `app/(app)/` routes (jobs, about, dashboard, etc.) keep the existing Header/Footer via a group layout. |
| `components/Header.tsx` | Keep for non-homepage routes (jobs, about, pricing, etc.). Do NOT delete. Update brand color references from teal to orange. |
| `app/globals.css` | Add `--font-mono` CSS variable for Geist Mono. Update `--brand-rgb` from `20 184 166` (teal) to `234 88 12` (orange-600). This is a global change — all existing pages using `rgb(var(--brand-rgb))` will shift to orange. |

### Removed Components (from homepage use only)

These are no longer used on the homepage:

- `BackgroundMotion.tsx` — safe to delete (only used on homepage)
- `LogoMarquee.tsx` — safe to delete (only used on homepage)
- `HeroMascot.tsx` — safe to delete (only used on homepage)
- `HeroSignal.tsx` — safe to delete (only used on homepage)
- `SalePromoBar.tsx` — safe to delete (only used on homepage)
- `SubscribeForm.tsx` — safe to delete (zero imports in codebase)
- `Pricing.tsx` — **KEEP** — imported by `app/pricing/page.tsx`

## Dependencies

### New

| Package | Purpose |
|---------|---------|
| `recharts` | Multi-line chart, area chart rendering |

### Font

Add a monospace font. Options:
- **Geist Mono** (Vercel's font — fits the terminal vibe, works well with Next.js)
- **JetBrains Mono** (excellent coding font)

Recommendation: Install the `geist` npm package and use `import { GeistMono } from 'geist/font/mono'` — this is the official Vercel approach, no font files needed.

## Responsive Behavior

| Breakpoint | Layout Changes |
|------------|---------------|
| Desktop (≥1024px) | Full bento grid as designed |
| Tablet (768-1023px) | Category cards stack to 1 column. Bottom bento becomes 2 columns (table full width above, top hiring + locked side by side below) |
| Mobile (<768px) | Everything single column. Stats cards 2×2 grid. Chart full width. Table scrollable. Locked card full width at bottom. |

## What This Spec Does NOT Cover

- Login/signup flow redesign
- Dashboard for authenticated users (post-login experience)
- Job detail page redesign
- Resume analysis feature
- Historical data pipeline (scraping SimplifyJobs commit history)
- The /jobs, /about, or any other route besides homepage

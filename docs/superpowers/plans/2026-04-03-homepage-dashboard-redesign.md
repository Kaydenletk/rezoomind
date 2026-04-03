# Homepage Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the marketing homepage with a real-data dashboard showing job market stats, charts, and listings from the existing scraper.

**Architecture:** Server Component homepage fetches data directly via Prisma, passes props to a mix of Server and Client components arranged in a bento grid. A new `DashboardSnapshot` model records daily counts for the market trend chart. Route groups separate the dashboard layout from the rest of the app.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Recharts, Prisma, Geist Mono font, `geist` npm package

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `components/dashboard/DashboardHeader.tsx` | Terminal-style header: dots, logo, nav anchors, sign-in |
| `components/dashboard/CategoryBreakdown.tsx` | 2-column USA/Intl position cards with counts + filter tags (Client) |
| `components/dashboard/MarketChart.tsx` | Multi-line Recharts LineChart with period toggles (Client) |
| `components/dashboard/JobsTable.tsx` | Recent postings table, terminal-styled |
| `components/dashboard/TopHiring.tsx` | Horizontal bar chart of top 5 companies |
| `components/dashboard/LockedCard.tsx` | Blurred donut + lock + sign-in CTA |
| `components/dashboard/DashboardFooter.tsx` | Minimal terminal footer |
| `lib/dashboard.ts` | `getDashboardStats()` — all Prisma queries for the dashboard |
| `app/api/dashboard/stats/route.ts` | Public API endpoint (optional, for future client-side refresh) |
| `app/(dashboard)/loading.tsx` | Skeleton loader matching bento grid layout |

### Modified Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `DashboardSnapshot` model |
| `app/api/cron/scrape-jobs/route.ts` | Add snapshot recording step after scraping |
| `app/page.tsx` | Complete rewrite — Server Component dashboard |
| `app/layout.tsx` | Remove Header/Footer, add Geist Mono font |
| `app/globals.css` | Update `--brand-rgb` from teal to orange, add `--font-mono` |
| `package.json` | Add `recharts`, `geist` dependencies |
| `.gitignore` | Add `.superpowers/` |

### Deleted Files (from homepage use only)

| File | Reason |
|------|--------|
| `components/BackgroundMotion.tsx` | Only used on old homepage |
| `components/LogoMarquee.tsx` | Only used on old homepage |
| `components/HeroMascot.tsx` | Only used on old homepage |
| `components/HeroSignal.tsx` | Only used on old homepage |
| `components/SalePromoBar.tsx` | Only used on old homepage |
| `components/SubscribeForm.tsx` | Zero imports anywhere |

---

## Task 1: Install dependencies and update brand colors

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css:16-21` (brand colors)
- Modify: `app/layout.tsx:1-48` (add Geist Mono, remove Playfair)
- Modify: `.gitignore`

- [ ] **Step 1: Install recharts and geist**

```bash
npm install recharts geist
```

- [ ] **Step 2: Update .gitignore**

Add to `.gitignore`:
```
.superpowers/
```

- [ ] **Step 3: Update brand colors in globals.css**

In `app/globals.css`, replace the brand color block (lines 16-21):

```css
/* OLD */
--brand-rgb: 20 184 166;
--brand-hover-rgb: 13 148 136;
--brand-tint: rgba(20, 184, 166, 0.12);
--brand-ring: rgba(20, 184, 166, 0.35);
--brand-glow: rgba(20, 184, 166, 0.25);

/* NEW */
--brand-rgb: 234 88 12;
--brand-hover-rgb: 194 65 12;
--brand-tint: rgba(234, 88, 12, 0.12);
--brand-ring: rgba(234, 88, 12, 0.35);
--brand-glow: rgba(234, 88, 12, 0.25);
```

Also update the `@theme inline` block in `globals.css`: replace `--font-serif: var(--font-playfair);` with `--font-mono: var(--font-geist-mono);`. This registers Geist Mono so `font-mono` utility works everywhere.

Also update dark mode brand variables (lines 36-51) to match orange:

```css
--brand-tint: rgba(234, 88, 12, 0.15);
--brand-ring: rgba(234, 88, 12, 0.4);
--brand-glow: rgba(234, 88, 12, 0.3);
```

- [ ] **Step 4: Add Geist Mono font to layout.tsx**

Replace `app/layout.tsx` font imports and config:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rezoomind",
  description: "Internship command center — real-time job data for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${GeistMono.variable} bg-stone-50 text-stone-900 antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

Key changes:
- Remove `Playfair_Display` import (no longer used)
- Add `GeistMono` from `geist/font/mono`
- Remove `Header` and `Footer` from root layout (each page handles its own)
- Change body bg from `bg-white` to `bg-stone-50`
- Update metadata description

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: No build errors. Pages may look different due to removed Header/Footer — that's expected.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/globals.css app/layout.tsx .gitignore
git commit -m "chore: install recharts + geist, update brand to orange, add mono font"
```

---

## Task 2: Add DashboardSnapshot model and migration

**Files:**
- Modify: `prisma/schema.prisma:199` (add model after job_postings)

- [ ] **Step 1: Add DashboardSnapshot model to schema**

Add after the `job_postings` model in `prisma/schema.prisma`:

```prisma
model DashboardSnapshot {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date             DateTime @unique @db.Date
  usa_internships  Int      @default(0)
  usa_new_grad     Int      @default(0)
  intl_internships Int      @default(0)
  intl_new_grad    Int      @default(0)
  created_at       DateTime @default(now()) @db.Timestamptz
}
```

- [ ] **Step 2: Generate Prisma client**

```bash
npx prisma generate
```

Expected: "✔ Generated Prisma Client"

- [ ] **Step 3: Create and run migration**

```bash
npx prisma migrate dev --name add-dashboard-snapshot
```

Expected: Migration created and applied.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add DashboardSnapshot model for market trend tracking"
```

---

## Task 3: Create getDashboardStats() data layer

**Files:**
- Create: `lib/dashboard.ts`

- [ ] **Step 1: Create lib/dashboard.ts**

```typescript
import { prisma } from "@/lib/prisma";

interface CategoryCount {
  total: number;
  faang: number;
  quant: number;
  other: number;
}

interface DashboardStats {
  categories: {
    usaInternships: CategoryCount;
    usaNewGrad: CategoryCount;
    intlInternships: CategoryCount;
    intlNewGrad: CategoryCount;
  };
  totalJobs: number;
  recentPostings: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    postedAt: string;
    category: string;
    url: string | null;
  }>;
  topHiring: Array<{ company: string; count: number }>;
  marketTrend: Array<{
    date: string;
    usaInternships: number;
    usaNewGrad: number;
    intlInternships: number;
    intlNewGrad: number;
  }>;
  lastSynced: string;
}

async function countByCategory(
  jobType: string,
  region: string
): Promise<CategoryCount> {
  const baseWhere = {
    tags: { hasEvery: [jobType, region] },
  };

  const [total, faang, quant] = await Promise.all([
    prisma.job_postings.count({ where: baseWhere }),
    prisma.job_postings.count({
      where: { tags: { hasEvery: [jobType, region, "faang"] } },
    }),
    prisma.job_postings.count({
      where: { tags: { hasEvery: [jobType, region, "quant"] } },
    }),
  ]);

  return { total, faang, quant, other: total - faang - quant };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    usaInternships,
    usaNewGrad,
    intlInternships,
    intlNewGrad,
    recentPostingsRaw,
    topHiringRaw,
    marketTrendRaw,
    lastSyncedRaw,
  ] = await Promise.all([
    countByCategory("internship", "usa"),
    countByCategory("new-grad", "usa"),
    countByCategory("internship", "international"),
    countByCategory("new-grad", "international"),

    // Recent postings — 5 most recent
    prisma.job_postings.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        role: true,
        company: true,
        location: true,
        date_posted: true,
        created_at: true,
        tags: true,
        url: true,
      },
    }),

    // Top hiring — top 5 companies by count
    prisma.job_postings.groupBy({
      by: ["company"],
      _count: { company: true },
      orderBy: { _count: { company: "desc" } },
      take: 5,
    }),

    // Market trend — all snapshots ordered by date
    prisma.dashboardSnapshot.findMany({
      orderBy: { date: "asc" },
      select: {
        date: true,
        usa_internships: true,
        usa_new_grad: true,
        intl_internships: true,
        intl_new_grad: true,
      },
    }),

    // Last synced
    prisma.job_postings.aggregate({
      _max: { created_at: true },
    }),
  ]);

  const totalJobs =
    usaInternships.total +
    usaNewGrad.total +
    intlInternships.total +
    intlNewGrad.total;

  const recentPostings = recentPostingsRaw.map((job) => {
    let category = "uncategorized";
    if (job.tags.includes("usa") && job.tags.includes("internship"))
      category = "usa-intern";
    else if (job.tags.includes("usa") && job.tags.includes("new-grad"))
      category = "usa-newgrad";
    else if (
      job.tags.includes("international") &&
      job.tags.includes("internship")
    )
      category = "intl-intern";
    else if (
      job.tags.includes("international") &&
      job.tags.includes("new-grad")
    )
      category = "intl-newgrad";

    return {
      id: job.id,
      title: job.role,
      company: job.company,
      location: job.location,
      postedAt: (job.date_posted ?? job.created_at).toISOString(),
      category,
      url: job.url,
    };
  });

  const topHiring = topHiringRaw.map((row) => ({
    company: row.company,
    count: row._count.company,
  }));

  const marketTrend = marketTrendRaw.map((snap) => ({
    date: snap.date.toISOString().split("T")[0],
    usaInternships: snap.usa_internships,
    usaNewGrad: snap.usa_new_grad,
    intlInternships: snap.intl_internships,
    intlNewGrad: snap.intl_new_grad,
  }));

  const lastSynced =
    lastSyncedRaw._max.created_at?.toISOString() ?? new Date().toISOString();

  return {
    categories: { usaInternships, usaNewGrad, intlInternships, intlNewGrad },
    totalJobs,
    recentPostings,
    topHiring,
    marketTrend,
    lastSynced,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

If Prisma client types aren't resolving, run `npx prisma generate` first.

- [ ] **Step 3: Commit**

```bash
git add lib/dashboard.ts
git commit -m "feat: add getDashboardStats() data layer for dashboard"
```

---

## Task 4: Add snapshot recording to cron job

**Files:**
- Modify: `app/api/cron/scrape-jobs/route.ts`

- [ ] **Step 1: Add snapshot function after the existing upsert loop**

At the end of the cron handler (before the response JSON), add a snapshot recording step. Import Prisma at top if not already available, and add this block after the job upserts complete:

```typescript
// Record daily dashboard snapshot
try {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [usaIntern, usaNewGrad, intlIntern, intlNewGrad] = await Promise.all([
    prisma.job_postings.count({ where: { tags: { hasEvery: ["internship", "usa"] } } }),
    prisma.job_postings.count({ where: { tags: { hasEvery: ["new-grad", "usa"] } } }),
    prisma.job_postings.count({ where: { tags: { hasEvery: ["internship", "international"] } } }),
    prisma.job_postings.count({ where: { tags: { hasEvery: ["new-grad", "international"] } } }),
  ]);

  await prisma.dashboardSnapshot.upsert({
    where: { date: today },
    update: {
      usa_internships: usaIntern,
      usa_new_grad: usaNewGrad,
      intl_internships: intlIntern,
      intl_new_grad: intlNewGrad,
    },
    create: {
      date: today,
      usa_internships: usaIntern,
      usa_new_grad: usaNewGrad,
      intl_internships: intlIntern,
      intl_new_grad: intlNewGrad,
    },
  });
} catch (snapErr) {
  console.error("Dashboard snapshot failed:", snapErr);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/scrape-jobs/route.ts
git commit -m "feat: record daily DashboardSnapshot in cron job"
```

---

## Task 5: Build dashboard UI components

**Files:**
- Create: `components/dashboard/DashboardHeader.tsx`
- Create: `components/dashboard/CategoryBreakdown.tsx`
- Create: `components/dashboard/MarketChart.tsx`
- Create: `components/dashboard/JobsTable.tsx`
- Create: `components/dashboard/TopHiring.tsx`
- Create: `components/dashboard/LockedCard.tsx`
- Create: `components/dashboard/DashboardFooter.tsx`

### Step 1: DashboardHeader

- [ ] **Create `components/dashboard/DashboardHeader.tsx`**

```tsx
import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200">
      <div className="flex items-center gap-5">
        {/* Terminal dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-300" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-200" />
        </div>
        <span className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase">
          rezoomind
        </span>
        <span className="text-stone-300">|</span>
        <nav className="hidden sm:flex gap-4">
          <a
            href="#jobs"
            className="font-mono text-xs text-stone-500 hover:text-orange-600 transition-colors"
          >
            ~/jobs
          </a>
          <a
            href="#insights"
            className="font-mono text-xs text-stone-500 hover:text-orange-600 transition-colors"
          >
            ~/insights
          </a>
        </nav>
      </div>
      <Link
        href="/login"
        className="border-[1.5px] border-orange-600 text-orange-600 px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wide hover:bg-orange-600 hover:text-white transition-colors"
      >
        sign_in →
      </Link>
    </header>
  );
}
```

### Step 2: CategoryBreakdown

- [ ] **Create `components/dashboard/CategoryBreakdown.tsx`**

```tsx
"use client";

interface CategoryCount {
  total: number;
  faang: number;
  quant: number;
  other: number;
}

interface Props {
  usaInternships: CategoryCount;
  usaNewGrad: CategoryCount;
  intlInternships: CategoryCount;
  intlNewGrad: CategoryCount;
}

const CATEGORY_COLORS = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
};

function CategoryRow({
  label,
  color,
  data,
}: {
  label: string;
  color: string;
  data: CategoryCount;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-[13px] text-stone-950 font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-extrabold text-stone-950">
          {data.total}
        </span>
        <div className="hidden sm:flex gap-1.5">
          <span className="text-[10px] px-2 py-0.5 border border-blue-200 rounded text-blue-500 bg-blue-50 font-medium">
            FAANG+ {data.faang}
          </span>
          <span className="text-[10px] px-2 py-0.5 border border-purple-200 rounded text-purple-500 bg-purple-50 font-medium">
            Quant {data.quant}
          </span>
          <span className="text-[10px] px-2 py-0.5 border border-stone-200 rounded text-stone-500 bg-stone-50 font-medium">
            Other {data.other}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CategoryBreakdown({
  usaInternships,
  usaNewGrad,
  intlInternships,
  intlNewGrad,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 px-7">
      {/* USA */}
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-base">🇺🇸</span>
          <span className="text-sm font-bold text-stone-950">
            USA Positions
          </span>
        </div>
        <CategoryRow
          label="Internships"
          color={CATEGORY_COLORS["usa-intern"]}
          data={usaInternships}
        />
        <div className="border-t border-stone-100" />
        <CategoryRow
          label="New Graduate"
          color={CATEGORY_COLORS["usa-newgrad"]}
          data={usaNewGrad}
        />
      </div>

      {/* International */}
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
        <div className="flex items-center gap-2 mb-3.5">
          <span className="text-base">🌐</span>
          <span className="text-sm font-bold text-stone-950">
            International Positions
          </span>
        </div>
        <CategoryRow
          label="Internships"
          color={CATEGORY_COLORS["intl-intern"]}
          data={intlInternships}
        />
        <div className="border-t border-stone-100" />
        <CategoryRow
          label="New Graduate"
          color={CATEGORY_COLORS["intl-newgrad"]}
          data={intlNewGrad}
        />
      </div>
    </div>
  );
}
```

### Step 3: MarketChart

- [ ] **Create `components/dashboard/MarketChart.tsx`**

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendPoint {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

interface Props {
  data: TrendPoint[];
}

type Period = "3M" | "6M" | "ALL";

const LINES = [
  { key: "usaInternships", color: "#3b82f6", label: "USA Internships" },
  { key: "usaNewGrad", color: "#22c55e", label: "USA New Grad" },
  { key: "intlInternships", color: "#a855f7", label: "Intl Internships" },
  { key: "intlNewGrad", color: "#ef4444", label: "Intl New Grad" },
] as const;

function filterByPeriod(data: TrendPoint[], period: Period): TrendPoint[] {
  if (period === "ALL") return data;
  const now = new Date();
  const months = period === "3M" ? 3 : 6;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

export function MarketChart({ data }: Props) {
  const [period, setPeriod] = useState<Period>("ALL");
  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);

  if (data.length === 0) {
    return (
      <div className="border-[1.5px] border-stone-200 rounded-[10px] p-6 bg-white mx-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-600 font-mono text-[13px]">
            ▸
          </span>
          <span className="font-mono text-[15px] font-bold text-stone-950">
            Software Engineering College Job Market
          </span>
        </div>
        <div className="flex items-center justify-center h-[200px] text-stone-400 text-sm">
          Collecting data... Chart will populate as daily snapshots accumulate.
        </div>
      </div>
    );
  }

  return (
    <div
      id="insights"
      className="border-[1.5px] border-stone-200 rounded-[10px] p-6 bg-white mx-7"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-orange-600 font-mono text-[13px]">
            ▸
          </span>
          <span className="font-mono text-[15px] font-bold text-stone-950">
            Software Engineering College Job Market
          </span>
        </div>
        <div className="flex gap-1">
          {(["3M", "6M", "ALL"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] px-2.5 py-1 rounded font-semibold transition-colors ${
                period === p
                  ? "bg-orange-600 text-white"
                  : "border border-stone-200 text-stone-400 hover:text-stone-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filtered}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#a8a29e" }}
            tickFormatter={(d: string) => {
              const date = new Date(d);
              return date.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              });
            }}
          />
          <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} width={40} />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1.5px solid #e7e5e4",
            }}
          />
          {LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3, fill: "white", stroke: line.color, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          ))}
          <Legend
            formatter={(value: string) => {
              const line = LINES.find((l) => l.key === value);
              return (
                <span style={{ color: "#44403c", fontSize: 11 }}>
                  {line?.label ?? value}
                </span>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Step 4: JobsTable

- [ ] **Create `components/dashboard/JobsTable.tsx`**

```tsx
import Link from "next/link";

interface Posting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  postedAt: string;
  category: string;
  url: string | null;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
  uncategorized: "#a8a29e",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function JobsTable({ postings }: { postings: Posting[] }) {
  return (
    <div
      id="jobs"
      className="border-[1.5px] border-stone-200 rounded-[10px] bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">
            ▸
          </span>
          <span className="font-mono text-[13px] font-bold text-stone-950">
            recent_postings
          </span>
          <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 rounded font-semibold border border-orange-200">
            new
          </span>
        </div>
        <Link
          href="/jobs"
          className="text-[11px] text-orange-600 font-semibold font-mono hover:underline"
        >
          view_all →
        </Link>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1.2fr_1fr_0.6fr] gap-1.5 px-5 py-2 bg-stone-50 border-b border-stone-100">
        <span className="text-[9px] text-stone-400 uppercase tracking-widest">
          Role
        </span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest">
          Company
        </span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest hidden md:block">
          Location
        </span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest text-right">
          Time
        </span>
      </div>

      {/* Rows */}
      {postings.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-stone-400">
          No recent postings
        </div>
      ) : (
        postings.map((job) => (
          <div
            key={job.id}
            className="grid grid-cols-[2fr_1.2fr_1fr_0.6fr] gap-1.5 px-5 py-2.5 border-b border-stone-50 items-center"
          >
            <span className="text-xs font-semibold text-stone-950 truncate">
              {job.title}
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    CATEGORY_DOT_COLORS[job.category] ?? "#a8a29e",
                }}
              />
              <span className="text-xs text-stone-700 truncate">
                {job.company}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 truncate hidden md:block">
              {job.location ?? "—"}
            </span>
            <span className="text-[10px] text-stone-400 text-right">
              {timeAgo(job.postedAt)}
            </span>
          </div>
        ))
      )}
    </div>
  );
}
```

### Step 5: TopHiring

- [ ] **Create `components/dashboard/TopHiring.tsx`**

```tsx
const BAR_COLORS = [
  "bg-orange-600",
  "bg-orange-400",
  "bg-orange-300",
  "bg-orange-200",
  "bg-orange-100",
];

export function TopHiring({
  companies,
}: {
  companies: Array<{ company: string; count: number }>;
}) {
  const max = companies[0]?.count ?? 1;

  return (
    <div className="border-[1.5px] border-stone-200 rounded-[10px] p-5 bg-white">
      <div className="flex items-center gap-1.5 mb-3.5">
        <span className="text-orange-600 font-mono text-xs">
          ▸
        </span>
        <span className="font-mono text-[13px] font-bold text-stone-950">
          top_hiring
        </span>
      </div>
      <div className="space-y-3">
        {companies.map((c, i) => (
          <div key={c.company}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-stone-700 font-medium">
                {c.company}
              </span>
              <span className="text-[11px] text-orange-600 font-bold">
                {c.count}
              </span>
            </div>
            <div className="h-[5px] bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i] ?? "bg-orange-100"}`}
                style={{ width: `${(c.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 6: LockedCard

- [ ] **Create `components/dashboard/LockedCard.tsx`**

```tsx
import Link from "next/link";
import { Lock } from "lucide-react";

export function LockedCard() {
  return (
    <div className="border-[1.5px] border-dashed border-stone-200 rounded-[10px] p-5 bg-stone-50 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-stone-400 font-mono text-[11px]">
          ▸
        </span>
        <span className="font-mono text-[11px] font-bold text-stone-400">
          your_matches
        </span>
      </div>

      {/* Blurred donut */}
      <div className="relative mb-4">
        <svg
          width="70"
          height="70"
          viewBox="0 0 70 70"
          className="blur-[2px] opacity-35"
        >
          <circle
            cx="35"
            cy="35"
            r="25"
            fill="none"
            stroke="#e7e5e4"
            strokeWidth="5"
          />
          <circle
            cx="35"
            cy="35"
            r="25"
            fill="none"
            stroke="#ea580c"
            strokeWidth="5"
            strokeDasharray="110 157"
            transform="rotate(-90 35 35)"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Lock className="w-[18px] h-[18px] text-stone-400" />
        </div>
      </div>

      <div className="text-[10px] text-stone-400 leading-relaxed mb-4">
        <span className="text-stone-500 font-semibold">AI matching</span>
        <br />
        resume analysis
        <br />
        saved jobs
      </div>

      <Link
        href="/login"
        className="bg-stone-950 text-stone-50 px-5 py-2 rounded-md text-xs font-semibold font-mono w-full text-center hover:bg-stone-800 transition-colors"
      >
        sign_in →
      </Link>
    </div>
  );
}
```

### Step 7: DashboardFooter

- [ ] **Create `components/dashboard/DashboardFooter.tsx`**

```tsx
import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="flex items-center justify-between px-7 py-4 border-t border-stone-100">
      <div className="flex items-center gap-2 font-mono">
        <span className="text-[11px] text-stone-300">$</span>
        <span className="text-[11px] text-stone-400">
          rezoomind · data from{" "}
          <a
            href="https://github.com/speedyapply/2026-SWE-College-Jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:underline"
          >
            speedyapply
          </a>{" "}
          · updated daily
        </span>
      </div>
      <div className="flex gap-3.5 font-mono">
        <Link
          href="/about"
          className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
        >
          about
        </Link>
        <a
          href="https://github.com/speedyapply/2026-SWE-College-Jobs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
        >
          github
        </a>
      </div>
    </footer>
  );
}
```

- [ ] **Step 8: Commit all components**

```bash
git add components/dashboard/
git commit -m "feat: add all dashboard UI components"
```

---

## Task 6: Rewrite homepage as Server Component dashboard

**Files:**
- Rewrite: `app/page.tsx`
- Create: `app/loading.tsx` (root-level skeleton — simple, not dashboard-specific)

- [ ] **Step 1: Create skeleton loader `app/loading.tsx`**

This is a generic root-level loading skeleton. Keep it simple since it covers all top-level routes.

```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-stone-50 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200">
        <div className="flex items-center gap-5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-200" />
          </div>
          <div className="w-24 h-4 bg-stone-200 rounded" />
        </div>
        <div className="w-20 h-7 bg-stone-200 rounded" />
      </div>

      <div className="py-6 space-y-4">
        {/* Category breakdown skeleton */}
        <div className="grid grid-cols-2 gap-3.5 px-7">
          <div className="h-28 bg-stone-200 rounded-[10px]" />
          <div className="h-28 bg-stone-200 rounded-[10px]" />
        </div>

        {/* Chart skeleton */}
        <div className="mx-7 h-64 bg-stone-200 rounded-[10px]" />

        {/* Bottom row skeleton */}
        <div className="grid grid-cols-[3fr_1.2fr_1fr] gap-3.5 px-7">
          <div className="h-56 bg-stone-200 rounded-[10px]" />
          <div className="h-56 bg-stone-200 rounded-[10px]" />
          <div className="h-56 bg-stone-200 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/page.tsx`**

Replace the entire file with:

```tsx
import { getDashboardStats } from "@/lib/dashboard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { MarketChart } from "@/components/dashboard/MarketChart";
import { JobsTable } from "@/components/dashboard/JobsTable";
import { TopHiring } from "@/components/dashboard/TopHiring";
import { LockedCard } from "@/components/dashboard/LockedCard";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";

export const revalidate = 3600; // ISR: regenerate every hour

export default async function HomePage() {
  const stats = await getDashboardStats();

  // Time since last sync
  const syncMs = Date.now() - new Date(stats.lastSynced).getTime();
  const syncHours = Math.floor(syncMs / 3600000);
  const syncLabel = syncHours < 1 ? "<1h" : `${syncHours}h`;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader />

      {/* Status line */}
      <div className="flex items-center gap-2 px-7 pt-5 pb-2">
        <span className="text-orange-600 font-mono text-[13px] font-bold">
          ▸
        </span>
        <span className="font-mono text-[13px] font-semibold text-stone-950">
          internship_market
        </span>
        <span className="text-stone-400">—</span>
        <span className="text-stone-400 text-xs">
          real-time data · synced {syncLabel} ago
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[11px] text-green-500 tracking-wide">
            LIVE
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="pt-3 pb-4">
        <CategoryBreakdown
          usaInternships={stats.categories.usaInternships}
          usaNewGrad={stats.categories.usaNewGrad}
          intlInternships={stats.categories.intlInternships}
          intlNewGrad={stats.categories.intlNewGrad}
        />
      </div>

      {/* Market Chart */}
      <div className="pb-3.5">
        <MarketChart data={stats.marketTrend} />
      </div>

      {/* Bottom Bento: Jobs + Top Hiring + Locked */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1.2fr_1fr] gap-3.5 px-7 pb-4">
        <JobsTable postings={stats.recentPostings} />
        <TopHiring companies={stats.topHiring} />
        <LockedCard />
      </div>

      <div className="mt-auto">
        <DashboardFooter />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify dev server renders the dashboard**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Dashboard layout renders with real data from the database. If DB is empty, you'll see 0 counts and "No recent postings" — that's correct.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/loading.tsx
git commit -m "feat: rewrite homepage as dashboard command center"
```

---

## Task 7: Add Header/Footer back to non-homepage routes

**Files:**
- Create: `app/(app)/layout.tsx`
- Move existing routes under `(app)` group or add layout wrappers

- [ ] **Step 1: Create app/(app)/layout.tsx for non-dashboard pages**

The root layout no longer includes Header/Footer. For pages like `/jobs`, `/about`, `/pricing`, etc., create a group layout:

```tsx
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Move existing route directories under (app)**

Move these directories into `app/(app)/`:
```bash
mkdir -p "app/(app)"
# Move all routes that need the old Header/Footer layout
mv app/about "app/(app)/about"
mv app/contact "app/(app)/contact"
mv app/pricing "app/(app)/pricing"
mv app/stem "app/(app)/stem"
mv app/alerts "app/(app)/alerts"
mv app/jobs "app/(app)/jobs"
mv app/dashboard "app/(app)/dashboard"
mv app/resume "app/(app)/resume"
mv app/preferences "app/(app)/preferences"
mv app/interests "app/(app)/interests"
mv app/matches "app/(app)/matches"
mv app/admin "app/(app)/admin"
mv app/subscribe "app/(app)/subscribe"
mv app/unsubscribe "app/(app)/unsubscribe"
mv app/sign-in "app/(app)/sign-in"
mv app/sign-up "app/(app)/sign-up"
```

The `app/(auth)/` group (login/signup) already has its own layout — move it under `(app)` too so it inherits Header/Footer:

```bash
mv "app/(auth)" "app/(app)/(auth)"
```

API routes (`app/api/`) stay at the root — they don't render UI.

- [ ] **Step 3: Verify routes still work**

```bash
npm run dev
```

Test:
- http://localhost:3000 → Dashboard (no old Header/Footer)
- http://localhost:3000/jobs → Jobs page (with old Header/Footer)
- http://localhost:3000/about → About page (with old Header/Footer)

- [ ] **Step 4: Commit**

```bash
git add app/
git commit -m "refactor: use route groups to separate dashboard from app layout"
```

---

## Task 8: Clean up unused components and verify build

**Files:**
- Delete: `components/BackgroundMotion.tsx`
- Delete: `components/LogoMarquee.tsx`
- Delete: `components/HeroMascot.tsx`
- Delete: `components/HeroSignal.tsx`
- Delete: `components/SalePromoBar.tsx`
- Delete: `components/SubscribeForm.tsx`

- [ ] **Step 1: Remove unused components**

```bash
rm components/BackgroundMotion.tsx
rm components/LogoMarquee.tsx
rm components/HeroMascot.tsx
rm components/HeroSignal.tsx
rm components/SalePromoBar.tsx
rm components/SubscribeForm.tsx
```

- [ ] **Step 2: Remove SalePromoBar import from Header.tsx**

The Header imports `SalePromoBar`. Remove that import and usage since the component is deleted. In `components/Header.tsx`:
- Remove the import line for `SalePromoBar`
- Remove the `<SalePromoBar />` JSX element from the header render

- [ ] **Step 3: Clean up dead CSS in globals.css**

Remove the following dead CSS blocks from `app/globals.css` (these powered the deleted components):

- `.logo-marquee`, `.logo-track`, `@keyframes marquee` (LogoMarquee)
- `.bg-blob-inner`, `@keyframes blob-float`, blob animation classes (BackgroundMotion)
- `.mascot-*`, `@keyframes mascot-float`, `@keyframes mascot-envelope` (HeroMascot)
- `.signal-radar`, `@keyframes radar-spin`, signal animation classes (HeroSignal)
- `.neon-glow-teal`, `.neon-glow-purple`, `.neon-text-*` (old aesthetic)
- `.glass`, `.glass-dark` (glassmorphism — check if used elsewhere first)

- [ ] **Step 4: Run full build to verify no broken imports**

```bash
npm run build
```

Expected: Build succeeds with no errors. Fix any broken imports that reference deleted components.

- [ ] **Step 5: Commit**

```bash
git add components/ app/globals.css
git commit -m "chore: remove unused homepage components and dead CSS"
```

---

## Task 9: Seed initial snapshot and final verification

**Files:**
- No new files

- [ ] **Step 1: Seed a DashboardSnapshot with current data**

Create a one-time seed by running against your database (via prisma studio or a quick script):

```bash
npx prisma db execute --stdin <<'SQL'
INSERT INTO "DashboardSnapshot" (id, date, usa_internships, usa_new_grad, intl_internships, intl_new_grad, created_at)
SELECT
  gen_random_uuid(),
  CURRENT_DATE,
  (SELECT count(*) FROM job_postings WHERE 'internship' = ANY(tags) AND 'usa' = ANY(tags)),
  (SELECT count(*) FROM job_postings WHERE 'new-grad' = ANY(tags) AND 'usa' = ANY(tags)),
  (SELECT count(*) FROM job_postings WHERE 'internship' = ANY(tags) AND 'international' = ANY(tags)),
  (SELECT count(*) FROM job_postings WHERE 'new-grad' = ANY(tags) AND 'international' = ANY(tags)),
  NOW()
ON CONFLICT (date) DO NOTHING;
SQL
```

- [ ] **Step 2: Final visual verification**

```bash
npm run dev
```

Check:
1. Dashboard loads with real numbers in category cards
2. Market chart shows at least one data point
3. Recent postings table shows real jobs
4. Top hiring shows real companies
5. Locked card displays with blurred donut
6. Header terminal dots and nav work
7. "view_all →" links to /jobs
8. /jobs page still works with Header/Footer
9. Mobile responsive — check at 375px width

- [ ] **Step 3: Run production build**

```bash
npm run build && npm start
```

Expected: Builds successfully. Homepage loads at http://localhost:3000 with ISR caching.

- [ ] **Step 4: Final commit (if any file changes were needed during verification)**

```bash
git status
# Only stage files that were actually changed during verification
git commit -m "feat: finalize homepage dashboard redesign"
```

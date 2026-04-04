# Historical Chart Data Seed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed ~790 daily snapshots from speedyapply git history into `DashboardSnapshot`, then update the MarketBanner chart to display 4 region-based lines with period toggles.

**Architecture:** One-time seed script extracts counts from git commits → upserts into existing Prisma table. MarketBanner switches from 5 role lines to 4 region lines with client-side date filtering. Data flow in page.tsx is simplified to pass marketTrend directly.

**Tech Stack:** TypeScript, Prisma, Recharts, Node child_process (for git), tsx (script runner)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/seed-historical-snapshots.ts` | Create | Extract counts from speedyapply git history, upsert into DB |
| `components/dashboard/MarketBanner.tsx` | Modify | Switch to 4 region lines, add period toggles, update types |
| `app/page.tsx` | Modify | Remove column-repurposing hack, pass marketTrend directly |

---

### Task 1: Create the seed script

**Files:**
- Create: `scripts/seed-historical-snapshots.ts`

**Context:** The speedyapply repo has daily commits since Feb 4, 2024. Each commit's `README.md` contains 4 job counts in the format `**NNN** available` in order: USA Internships, USA New Grad, Intl Internships, Intl New Grad. The script needs to load env vars (DATABASE_URL) since it runs outside Next.js. Uses `@prisma/client` directly (not `@/lib/prisma`) because tsx can't resolve path aliases.

- [ ] **Step 1: Create the seed script**

```typescript
// scripts/seed-historical-snapshots.ts
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load env vars (same approach as prisma-with-env.js)
// Uses process.cwd() instead of __dirname because tsx runs as ESM where __dirname is undefined
function loadEnv(filePath: string) {
  if (!existsSync(filePath)) return;
  const contents = readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env"));

const REPO_URL = "https://github.com/speedyapply/2026-SWE-College-Jobs.git";
const CLONE_DIR = "/tmp/speedyapply-jobs";
const COUNT_REGEX = /\*\*(\d+)\*\* available/g;

const prisma = new PrismaClient();

async function main() {
  // 1. Clone repo if needed
  if (!existsSync(CLONE_DIR)) {
    console.log("Cloning speedyapply repo...");
    execSync(`git clone ${REPO_URL} ${CLONE_DIR}`, { stdio: "inherit" });
  } else {
    console.log("Repo already cloned, pulling latest...");
    execSync("git pull", { cwd: CLONE_DIR, stdio: "inherit" });
  }

  // 2. Get all commits with dates (oldest first)
  const logOutput = execSync(
    'git log --reverse --format="%h %ad" --date=short',
    { cwd: CLONE_DIR, encoding: "utf8" }
  );

  const lines = logOutput.trim().split("\n");

  // 3. Deduplicate by date (keep first commit per day)
  const commitsByDate = new Map<string, string>();
  for (const line of lines) {
    const [hash, date] = line.split(" ");
    if (!commitsByDate.has(date)) {
      commitsByDate.set(date, hash);
    }
  }

  console.log(`Found ${commitsByDate.size} unique days of data`);

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  const entries = Array.from(commitsByDate.entries());
  for (let i = 0; i < entries.length; i++) {
    const [date, hash] = entries[i];

    // 4. Extract README for this commit
    let readme: string;
    try {
      readme = execSync(`git show ${hash}:README.md`, {
        cwd: CLONE_DIR,
        encoding: "utf8",
      });
    } catch {
      failed++;
      continue;
    }

    // 5. Extract counts
    const matches = [...readme.matchAll(COUNT_REGEX)];
    if (matches.length < 4) {
      skipped++;
      continue; // README format didn't have counts yet
    }

    const [usaIntern, usaNewGrad, intlIntern, intlNewGrad] = matches.map(
      (m) => parseInt(m[1], 10)
    );

    // 6. Upsert — empty update to not overwrite existing cron data
    try {
      await prisma.dashboardSnapshot.upsert({
        where: { date: new Date(date) },
        create: {
          date: new Date(date),
          usa_internships: usaIntern,
          usa_new_grad: usaNewGrad,
          intl_internships: intlIntern,
          intl_new_grad: intlNewGrad,
        },
        update: {}, // don't overwrite if cron already recorded this date
      });
      inserted++;
    } catch (err) {
      console.error(`  Error on ${date}:`, err);
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  Progress: ${i + 1}/${entries.length}`);
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed script**

```bash
npx tsx scripts/seed-historical-snapshots.ts
```

Expected: ~790 rows inserted into `DashboardSnapshot`. Output shows progress every 50 commits and final summary.

- [ ] **Step 3: Verify the data**

```bash
node scripts/prisma-with-env.js studio
```

Open Prisma Studio and check `DashboardSnapshot` table has ~790 rows spanning Feb 2024 to Apr 2026.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-historical-snapshots.ts
git commit -m "feat: add seed script for historical chart snapshots"
```

---

### Task 2: Update MarketBanner to 4 region lines with period toggles

**Files:**
- Modify: `components/dashboard/MarketBanner.tsx`

**Context:** Currently displays 5 role-based lines (SWE, DS/ML, Hardware, PM, Quant). Must switch to 4 region-based lines matching the spec colors: blue (USA Internships), green (USA New Grad), purple (Intl Internships), red (Intl New Grad). Add 3M/6M/ALL period toggles for client-side date filtering.

- [ ] **Step 1: Update TrendPoint interface and LINES config**

In `components/dashboard/MarketBanner.tsx`, replace the interface and LINES:

```typescript
interface TrendPoint {
  date: string;
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

const LINES = [
  { key: "usaInternships", color: "#3b82f6", label: "USA Internships" },
  { key: "usaNewGrad", color: "#22c55e", label: "USA New Grad" },
  { key: "intlInternships", color: "#a855f7", label: "Intl Internships" },
  { key: "intlNewGrad", color: "#ef4444", label: "Intl New Grad" },
] as const;
```

- [ ] **Step 2: Add period toggle state and filtering logic**

Add after the existing state declarations inside `MarketBanner`:

```typescript
type Period = "3M" | "6M" | "ALL";
const [period, setPeriod] = useState<Period>("ALL");

const filteredTrend = (() => {
  if (period === "ALL") return trend;
  const now = new Date();
  const months = period === "3M" ? 3 : 6;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return trend.filter((t) => t.date >= cutoffStr);
})();
```

- [ ] **Step 3: Add period toggle buttons UI**

Insert the toggle buttons inside the existing toggle bar `<div>` (line 72 of MarketBanner.tsx), between the title `<button>` and the dismiss `<button>`. The full toggle bar should look like:

```tsx
<div className="flex items-center justify-between px-5 lg:px-7 py-2">
  {/* Existing title button — unchanged */}
  <button onClick={toggle} className="flex items-center gap-1.5 font-mono text-[11px] ...">
    ...market_trend...
  </button>

  {/* NEW: Period toggles — insert here */}
  <div className="flex items-center gap-1 ml-auto mr-3">
    {(["3M", "6M", "ALL"] as Period[]).map((p) => (
      <button
        key={p}
        onClick={() => setPeriod(p)}
        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
          period === p
            ? "bg-orange-600 text-white"
            : "text-stone-400 hover:text-stone-600 border border-stone-200 dark:border-stone-700"
        }`}
      >
        {p}
      </button>
    ))}
  </div>

  {/* Existing dismiss button — unchanged */}
  <button onClick={dismiss} className="text-stone-300 ..." aria-label="Dismiss chart">
    <X className="w-3.5 h-3.5" />
  </button>
</div>
```

- [ ] **Step 4: Update chart to use filteredTrend and increase height**

Change the chart data from `trend` to `filteredTrend`, increase height from 180 to 300, update the title text, and format X-axis for monthly labels:

- `<LineChart data={filteredTrend}>`
- `<ResponsiveContainer width="100%" height={300}>`
- Update the section title from `market_trend` to `Software Engineering College Job Market`
- Update X-axis tickFormatter to show `Mon 'YY` format for the longer date range
- Remove dots from lines (too many data points for visible dots)
- Update source text to show `filteredTrend.length` data points

- [ ] **Step 5: Verify locally**

```bash
npm run dev
```

Open `http://localhost:3000` — chart should show 4 colored lines spanning Feb 2024 → Apr 2026 with working period toggles.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/MarketBanner.tsx
git commit -m "feat: update MarketBanner to 4 region lines with period toggles"
```

---

### Task 3: Fix data flow in page.tsx

**Files:**
- Modify: `app/page.tsx`

**Context:** Currently `page.tsx` repurposes snapshot columns into role-based fields (`swe: s.usaInternships`, `pm: 0`, etc.). Now that MarketBanner expects region-based fields, pass `marketTrend` through directly.

- [ ] **Step 1: Remove trend mapping, pass marketTrend directly**

In `app/page.tsx`, replace lines 26-33:

```typescript
// Before (remove this):
const trend = (dbStats?.marketTrend ?? []).map((s) => ({
  date: s.date,
  swe: s.usaInternships,
  pm: 0,
  dsml: s.usaNewGrad,
  quant: s.intlInternships,
  hardware: s.intlNewGrad,
}));

// After:
const trend = dbStats?.marketTrend ?? [];
```

And in the JSX, `<MarketBanner trend={trend} />` stays the same — just the data shape changes.

- [ ] **Step 2: Verify locally**

```bash
npm run dev
```

Open `http://localhost:3000` — everything should render correctly with real data.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "fix: pass marketTrend directly to MarketBanner"
```

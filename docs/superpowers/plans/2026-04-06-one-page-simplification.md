# One-Page Simplification — Rezoomind Redesign

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the entire app into a single homepage (`/`) that progressively enhances based on auth and resume state — upload PDF, see matches, tailor with AI suggestions, apply. No page jumping.

**Architecture:** The homepage remains a server component for fast SSR job data. A thin client wrapper detects auth state (via `useSession`) and swaps sidebar content: anonymous → sign-up CTA, logged-in-no-resume → PDF upload dropzone, logged-in-with-resume → match scores on jobs + resume status card. The existing QuickTailorPanel (suggestion-based, format-preserving) becomes the core AI interaction. No new pages created; `/dashboard`, `/jobs`, `/resume` are deprecated.

**Tech Stack:** Next.js 15 (App Router), NextAuth v4, Tailwind CSS v4, Framer Motion, Gemini AI, pdf-parse (already installed), Prisma/Neon PostgreSQL

---

## Design Decisions

### Why suggestion-based tailoring (not AI rewriting)?

When AI rewrites a resume, it outputs plain text — destroying the user's PDF layout, fonts, spacing, columns, and design. This is the #1 complaint about resume tools. Instead:

1. AI analyzes resume text vs job description
2. Shows **specific, actionable suggestions**: "Add Docker to your skills section", "Quantify your React project impact"
3. Shows **matched keywords** (green) and **missing keywords** (red)
4. User applies changes manually to their own document → **format preserved perfectly**

The existing `QuickTailorPanel` already does this. We keep it as-is and make it more prominent.

### Why one page instead of many?

Current flow: Homepage → Login → Dashboard → Resume → back to Dashboard → Jobs → back to Dashboard → Tailor
New flow: Homepage → Login → Homepage (now enhanced) → Upload PDF → Tailor

Every "page" is really just a different state of the same view.

### Progressive enhancement states

| State | Header | Sidebar | JobsTable | Tailor |
|-------|--------|---------|-----------|--------|
| **Anonymous** | `sign_in →` button | MatchingPreviewCard (CTA) | Jobs with priority badges only | Disabled (prompts login) |
| **Logged in, no resume** | Avatar + `sign_out` | ResumeUploadCard (dropzone) | Same as anonymous | Disabled (prompts upload) |
| **Logged in, has resume** | Avatar + `sign_out` | ResumeStatusCard (skills, re-upload) | Jobs + match score badges | Enabled → QuickTailorPanel |

---

## File Structure

### New files to create
| File | Responsibility |
|------|---------------|
| `components/dashboard/HomeClientShell.tsx` | Client wrapper that reads auth/resume state and renders the right sidebar + passes match data to JobsTable |
| `components/dashboard/ResumeUploadCard.tsx` | Drag-and-drop PDF upload card for sidebar (replaces MatchingPreviewCard when logged in) |
| `components/dashboard/ResumeStatusCard.tsx` | Shows loaded resume info: key skills, match readiness, re-upload button |
| `components/dashboard/MatchBadge.tsx` | Small inline match score indicator for JobsTable rows |
| `components/dashboard/AuthHeader.tsx` | Auth-aware version of DashboardHeader (sign_in vs avatar) |
| `lib/pdf-extract.ts` | Server utility: PDF buffer → plain text extraction |

### Files to modify
| File | Change |
|------|--------|
| `app/page.tsx` | Split into server data layer + `<HomeClientShell>` client wrapper |
| `components/dashboard/JobsTable.tsx` | Accept optional `matchScores` prop, render MatchBadge, gate tailor button on auth state |
| `components/dashboard/QuickTailorPanel.tsx` | Accept `jobUrl` for direct "Apply after tailoring" link; no other changes needed |
| `app/api/resume/data/route.ts` | Add PDF file handling (accept multipart form data, extract text with pdf-parse) |
| `package.json` | Add `pdf-parse` dependency |

### Files deprecated (not deleted yet, just unused)
| File | Reason |
|------|--------|
| `app/(app)/dashboard/page.tsx` | Merged into homepage |
| `app/(app)/jobs/page.tsx` | Merged into homepage |
| `app/(app)/resume/page.tsx` | Upload is now inline on homepage |
| `components/dashboard/MatchingPreviewCard.tsx` | Replaced by conditional sidebar |

---

## Tasks

### Task 1: Create PDF text extraction utility

**Files:**
- Create: `lib/pdf-extract.ts`

> Note: `pdf-parse` is already installed (`"pdf-parse": "^1.1.4"` in package.json). No `npm install` needed.

> **Bundler caution:** `pdf-parse@1.1.4` has a known issue where it tries to load a test PDF file on import in some bundler configs. If the build fails after this step, use the direct path `pdf-parse/lib/pdf-parse.js` or switch to `pdfjs-dist`.

- [ ] **Step 1: Create the PDF extraction utility**

Create `lib/pdf-extract.ts`:

```typescript
import pdf from "pdf-parse";

/**
 * Extract plain text from a PDF buffer.
 * Returns the concatenated text of all pages.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text.trim();
}
```

- [ ] **Step 2: Verify it compiles and builds**

```bash
npm run build 2>&1 | head -20
```

If build fails with `pdf-parse` test file error, change import to:
```typescript
import pdf from "pdf-parse/lib/pdf-parse.js";
```

- [ ] **Step 3: Commit**

```bash
git add lib/pdf-extract.ts
git commit -m "feat: add pdf-parse utility for resume text extraction"
```

---

### Task 2: Update resume data API to extract text from PDF uploads

**Files:**
- Modify: `app/api/resume/data/route.ts`

The current API already uses `request.formData()` and accepts a `file` field, but it doesn't extract text from the PDF — it returns an error saying "PDF parsing is coming soon." We need to add actual PDF text extraction when a file is uploaded without `resumeText`.

Also: the GET handler selects `created_at` but not `parsed_at`. Add `parsed_at` to the GET select so the frontend can show when the resume was last processed.

- [ ] **Step 1: Read the current resume data route**

Read `app/api/resume/data/route.ts` to confirm the current handler structure. It already calls `request.formData()`, reads `resumeText` and `file` fields, and does keyword extraction + Prisma upsert.

- [ ] **Step 2: Replace the "coming soon" error with actual PDF extraction**

Add the import at the top:
```typescript
import { extractTextFromPDF } from "@/lib/pdf-extract";
```

Replace lines 30-45 (the formData parsing + "coming soon" error) with:

```typescript
const formData = await request.formData();
let resumeText = (formData.get("resumeText") as string | null)?.trim() || null;
const file = formData.get("file") as File | null;

let fileUrl: string | null = null;
if (file) {
  fileUrl = `/uploads/${file.name}`;
  // Extract text from PDF if no resumeText was provided
  if (!resumeText) {
    const buffer = Buffer.from(await file.arrayBuffer());
    resumeText = await extractTextFromPDF(buffer);
  }
}

if (!resumeText) {
  return NextResponse.json(
    { ok: false, error: "No resume text found. Upload a PDF or paste text." },
    { status: 400 }
  );
}
```

- [ ] **Step 3: Add `parsed_at` to GET select**

In the GET handler, change the select to include `parsed_at`:
```typescript
select: { resume_text: true, file_url: true, resume_keywords: true, parsed_at: true },
```

- [ ] **Step 4: Verify the API compiles**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add app/api/resume/data/route.ts
git commit -m "feat: extract text from PDF uploads in resume data API"
```

---

### Task 3: Create AuthHeader component (auth-aware navigation)

**Files:**
- Create: `components/dashboard/AuthHeader.tsx`

This replaces `DashboardHeader` on the homepage. It shows `sign_in →` for anonymous users and an avatar/sign-out for authenticated users. Must use `"use client"` for `useSession()`.

- [ ] **Step 1: Create AuthHeader component**

```typescript
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut } from "lucide-react";

export function AuthHeader() {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated";

  return (
    <header className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200 dark:border-stone-800">
      <div className="flex items-center gap-5">
        {/* Terminal dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-300 dark:border-orange-700" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-200 dark:border-stone-700" />
        </div>
        <span className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase">
          rezoomind
        </span>
        <span className="text-stone-300 dark:text-stone-700">|</span>
        <nav className="hidden sm:flex gap-4">
          <a href="#jobs" className="font-mono text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            ~/jobs
          </a>
          <Link href="/insights" className="font-mono text-xs text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            ~/insights
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {isAuth ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
              {session?.user?.email?.split("@")[0]}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 border-[1.5px] border-stone-300 dark:border-stone-700 text-stone-500 px-3 py-1.5 rounded font-mono text-xs hover:border-red-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              sign_out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="border-[1.5px] border-orange-600 text-orange-600 px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wide hover:bg-orange-600 hover:text-white transition-colors"
          >
            sign_in →
          </Link>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit components/dashboard/AuthHeader.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/AuthHeader.tsx
git commit -m "feat: add auth-aware header component"
```

---

### Task 4: Create ResumeUploadCard component (PDF dropzone)

**Files:**
- Create: `components/dashboard/ResumeUploadCard.tsx`

Sidebar card with drag-and-drop PDF upload. Shown when user is logged in but has no resume. On drop/select, uploads to `/api/resume/data` as multipart form data, then calls `onUploaded()` callback.

- [ ] **Step 1: Create ResumeUploadCard component**

```typescript
"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";

interface ResumeUploadCardProps {
  onUploaded: () => void;
}

export function ResumeUploadCard({ onUploaded }: ResumeUploadCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/data", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onUploaded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-5 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">
          upload_resume
        </span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
          ${dragOver
            ? "border-orange-500 bg-orange-600/10"
            : "border-stone-300 dark:border-stone-700 hover:border-orange-500/50 hover:bg-orange-600/5"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <>
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-2" />
            <p className="text-[11px] text-orange-500 font-mono">processing...</p>
          </>
        ) : (
          <>
            <Upload className="w-6 h-6 text-stone-400 mb-2" />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center">
              Drop your resume PDF here
            </p>
            <p className="text-[10px] text-stone-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 font-mono mt-2">✗ {error}</p>
      )}

      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <FileText className="w-3 h-3 text-orange-600" />
          <span>AI extracts skills & generates match scores</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="text-orange-600 ml-[1px]">✦</span>
          <span>Your PDF format is never modified</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit components/dashboard/ResumeUploadCard.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ResumeUploadCard.tsx
git commit -m "feat: add PDF resume upload card with drag-and-drop"
```

---

### Task 5: Create ResumeStatusCard component

**Files:**
- Create: `components/dashboard/ResumeStatusCard.tsx`

Sidebar card shown when user has a resume loaded. Displays top skills extracted, match readiness indicator, and a re-upload button.

- [ ] **Step 1: Create ResumeStatusCard component**

```typescript
"use client";

import { FileText, RefreshCw } from "lucide-react";

interface ResumeStatusCardProps {
  keywords: string[];
  parsedAt: string | null;
  onReUpload: () => void;
  matchLoading?: boolean;
}

export function ResumeStatusCard({ keywords, parsedAt, onReUpload, matchLoading }: ResumeStatusCardProps) {
  const topSkills = keywords.slice(0, 8);
  const remaining = keywords.length - topSkills.length;

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-5 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-green-500 font-mono text-xs font-bold">▸</span>
          <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">
            resume_loaded
          </span>
        </div>
        <button
          onClick={onReUpload}
          className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-orange-500 font-mono transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          re-upload
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded bg-green-600/10 border border-green-600/20 flex items-center justify-center">
          <FileText className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <p className="text-[11px] font-mono text-stone-700 dark:text-stone-300 font-medium">
            Resume active
          </p>
          {parsedAt && (
            <p className="text-[9px] text-stone-400 font-mono">
              parsed {new Date(parsedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {topSkills.map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded text-[10px] border border-orange-100 dark:border-orange-900/40"
          >
            {skill}
          </span>
        ))}
        {remaining > 0 && (
          <span className="px-2 py-0.5 text-[10px] text-stone-400">
            +{remaining} more
          </span>
        )}
      </div>

      {matchLoading ? (
        <p className="text-[10px] text-orange-400 font-mono mt-1 animate-pulse">
          ⋯ computing match scores...
        </p>
      ) : (
        <p className="text-[10px] text-stone-400 font-mono mt-1">
          ✦ match scores active on all jobs below
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit components/dashboard/ResumeStatusCard.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/ResumeStatusCard.tsx
git commit -m "feat: add resume status card showing skills and match readiness"
```

---

### Task 6: Create MatchBadge component for inline job scores

**Files:**
- Create: `components/dashboard/MatchBadge.tsx`

Small circular badge showing match score percentage next to each job in the table. Color-coded: orange >=75, amber >=50, gray <50.

- [ ] **Step 1: Create MatchBadge component**

```typescript
interface MatchBadgeProps {
  score: number; // 0-100
}

export function MatchBadge({ score }: MatchBadgeProps) {
  const color =
    score >= 75
      ? "text-orange-500 border-orange-500/40 bg-orange-500/10"
      : score >= 50
        ? "text-amber-500 border-amber-500/40 bg-amber-500/10"
        : "text-stone-400 border-stone-400/30 bg-stone-400/10";

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}
      title={`${score}% match`}
    >
      {score}%
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/MatchBadge.tsx
git commit -m "feat: add match score badge component"
```

---

### Task 7: Update JobsTable to show match scores and gate tailor on auth

**Files:**
- Modify: `components/dashboard/JobsTable.tsx`

Add optional `matchScores` prop (map of job ID → score). When present, render MatchBadge next to company name. Gate the "tailor ✨" button: if no `onTailorClick` callback, show "sign in to tailor" tooltip. Pass `savedResumeText` through to QuickTailorPanel.

- [ ] **Step 1: Read the full current JobsTable**

Read `components/dashboard/JobsTable.tsx` completely to understand the current rendering and state.

- [ ] **Step 2: Add matchScores prop and MatchBadge rendering**

Update the component props interface:

```typescript
interface JobsTableProps {
  postings: Posting[];
  priorities?: Record<string, PriorityBadge | null>;
  fitBadges?: Record<string, string[]>;
  matchScores?: Record<string, number>;       // NEW: job ID → match score (0-100)
  savedResumeText?: string | null;             // NEW: pre-fill tailor panel
  isAuthenticated?: boolean;                   // NEW: gate tailor button
}
```

In the company name cell, after the company name span, look up by composite key (matching the key format used in HomeClientShell):

```tsx
{(() => {
  const key = `${job.company.toLowerCase().trim()}|${job.role.toLowerCase().trim()}`;
  const score = matchScores?.[key];
  return score != null ? <MatchBadge score={score} /> : null;
})()}
```

Alternatively, compute the key once per row at the top of the map callback:
```tsx
const matchKey = `${job.company.toLowerCase().trim()}|${job.role.toLowerCase().trim()}`;
const matchScore = matchScores?.[matchKey];
```
Then use `{matchScore != null && <MatchBadge score={matchScore} />}` in the JSX. This is cleaner.

For the tailor button, wrap the click handler:

```tsx
<button
  onClick={() => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!savedResumeText) {
      // Scroll to upload section
      document.getElementById("resume-upload")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setTailorJob({ company: job.company, role: job.role });
  }}
  className="..."
>
  tailor ✨
</button>
```

Pass `savedResumeText` to `<QuickTailorPanel savedResumeText={savedResumeText} ... />`.

- [ ] **Step 3: Verify it compiles and renders correctly**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/JobsTable.tsx
git commit -m "feat: add match scores and auth-gated tailor to jobs table"
```

---

### Task 8: Create HomeClientShell — the client wrapper for progressive enhancement

**Files:**
- Create: `components/dashboard/HomeClientShell.tsx`

This is the key orchestration component. It:
1. Reads auth state via `useSession()`
2. If authenticated, fetches resume data from `/api/resume/data`
3. If resume exists, fetches match scores from `/api/dashboard/data`
4. Renders the correct sidebar (MatchingPreviewCard / ResumeUploadCard / ResumeStatusCard)
5. Passes match scores down to JobsTable

It receives server-rendered children (insight cards, stats bar, etc.) as props/children, so the page still benefits from SSR for the core job data.

- [ ] **Step 1: Create HomeClientShell component**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AuthHeader } from "./AuthHeader";
import { MatchingPreviewCard } from "./MatchingPreviewCard";
import { ResumeUploadCard } from "./ResumeUploadCard";
import { ResumeStatusCard } from "./ResumeStatusCard";
import { MarketChart } from "./MarketChart";
import { JobsTable } from "./JobsTable";
import { DashboardFooter } from "./DashboardFooter";

import type { PriorityBadge } from "@/lib/job-priority";

interface Posting {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
}

interface HomeClientShellProps {
  // Server-rendered content passed through
  children: React.ReactNode; // SummaryStrip + MainInsightCard + MarketBanner + InsightCards + stats bar
  // Data from server
  postings: Posting[];
  priorities: Record<string, PriorityBadge | null>;
  fitBadges: Record<string, string[]>;
  counts: { swe: number; pm: number; dsml: number; quant: number; hardware: number; total: number };
}

interface ResumeData {
  resumeText: string;
  keywords: string[];
  parsedAt: string | null;
}

export function HomeClientShell({
  children,
  postings,
  priorities,
  fitBadges,
  counts,
}: HomeClientShellProps) {
  const { data: session, status } = useSession();
  const isAuth = status === "authenticated";

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch resume data when authenticated
  // API shape: { ok: true, resume: { resume_text, resume_keywords, parsed_at, ... } }
  const fetchResume = useCallback(async () => {
    if (!isAuth) return;
    try {
      const res = await fetch("/api/resume/data");
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.resume?.resume_text) {
          setResume({
            resumeText: json.resume.resume_text,
            keywords: json.resume.resume_keywords || [],
            parsedAt: json.resume.parsed_at || null,
          });
          setShowUpload(false);
        }
      }
    } catch {
      // Silently fail — user just won't see match scores
    }
  }, [isAuth]);

  // Fetch match scores when resume is available
  // API shape: { ok, hasResume, matchRows: [{ match_score, job_postings: { company, role, ... } }] }
  //
  // IMPORTANT: The dashboard API returns jobs from the DATABASE (Prisma job_postings),
  // but the homepage JobsTable displays jobs from the GITHUB CSV source.
  // These have DIFFERENT IDs. We match by composite key: "company|role" (lowercased).
  const fetchMatchScores = useCallback(async () => {
    if (!resume) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/data");
      if (res.ok) {
        const data = await res.json();
        const scores: Record<string, number> = {};
        if (data.ok && data.matchRows) {
          for (const row of data.matchRows) {
            if (row.match_score == null || !row.job_postings) continue;
            const jp = row.job_postings;
            // Composite key matches GitHub jobs by company+role
            const key = `${(jp.company || "").toLowerCase().trim()}|${(jp.role || "").toLowerCase().trim()}`;
            scores[key] = Math.round(row.match_score);
          }
        }
        setMatchScores(scores);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [resume]);

  useEffect(() => { fetchResume(); }, [fetchResume]);
  useEffect(() => { fetchMatchScores(); }, [fetchMatchScores]);

  const handleUploaded = () => {
    fetchResume(); // Re-fetch resume data after upload
  };

  // Determine sidebar content
  const renderSidebar = () => {
    if (!isAuth) {
      return <MatchingPreviewCard />;
    }
    if (!resume || showUpload) {
      return (
        <ResumeUploadCard onUploaded={handleUploaded} />
      );
    }
    return (
      <ResumeStatusCard
        keywords={resume.keywords}
        parsedAt={resume.parsedAt}
        onReUpload={() => setShowUpload(true)}
        matchLoading={loading}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col transition-colors">
      <AuthHeader />

      {/* Server-rendered insight components */}
      {children}

      {/* Main: Jobs + Sidebar */}
      <div className="flex-1 px-5 lg:px-7 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3.5">
          <JobsTable
            postings={postings}
            priorities={priorities}
            fitBadges={fitBadges}
            matchScores={matchScores}
            savedResumeText={resume?.resumeText}
            isAuthenticated={isAuth}
          />

          <div className="flex flex-col gap-3.5" id="resume-upload">
            <MarketChart
              swe={counts.swe}
              pm={counts.pm}
              dsml={counts.dsml}
              quant={counts.quant}
              hardware={counts.hardware}
              total={counts.total}
            />
            {renderSidebar()}
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit components/dashboard/HomeClientShell.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/HomeClientShell.tsx
git commit -m "feat: add HomeClientShell for progressive auth-aware homepage"
```

---

### Task 9: Rewire the homepage to use HomeClientShell

**Files:**
- Modify: `app/page.tsx`

The homepage keeps its server-side data fetching (SSR for fast load). But instead of directly rendering all components, it passes data into `<HomeClientShell>`, which handles the client-side auth logic. The insight components (SummaryStrip, MainInsightCard, MarketBanner, InsightCards) are passed as `children` so they remain server-rendered.

- [ ] **Step 1: Read the current homepage**

Read `app/page.tsx` fully.

- [ ] **Step 2: Refactor to use HomeClientShell**

Replace the current return JSX. The server component still fetches all data, but delegates rendering to `HomeClientShell`:

```typescript
import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { computeMarketInsights } from "@/lib/insights";
import { computeJobPriority, computeFitBadges, parseDatePostedToAge } from "@/lib/job-priority";
import { SummaryStrip } from "@/components/dashboard/SummaryStrip";
import { MainInsightCard } from "@/components/dashboard/MainInsightCard";
import { MarketBanner } from "@/components/dashboard/MarketBanner";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { HomeClientShell } from "@/components/dashboard/HomeClientShell";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const { counts } = githubData;
  const trend = dbStats?.marketTrend ?? [];
  const insights = computeMarketInsights(trend);
  const displayJobs = githubData.jobs.slice(0, 60);

  const freshToday = displayJobs.filter((j) => {
    const age = parseDatePostedToAge(j.datePosted);
    return age !== null && age <= 1;
  }).length;

  const priorities: Record<string, ReturnType<typeof computeJobPriority>> = {};
  const fitBadges: Record<string, string[]> = {};
  for (const job of displayJobs) {
    priorities[job.id] = computeJobPriority(job.datePosted, job.category, insights.trends);
    fitBadges[job.id] = computeFitBadges(job.role, job.category);
  }

  return (
    <HomeClientShell
      postings={displayJobs}
      priorities={priorities}
      fitBadges={fitBadges}
      counts={counts}
    >
      {/* These render server-side inside the client shell */}
      <SummaryStrip
        marketHeat={insights.marketHeat}
        freshToday={freshToday}
        competitionLevel={insights.competitionLevel}
      />
      <MainInsightCard
        summary={insights.plainEnglishSummary}
        seasonLabel={insights.seasonLabel}
        seasonColor={insights.seasonColor}
      />
      <MarketBanner trend={trend} />
      <InsightCards insights={insights} />

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-5 lg:px-7 py-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-xs font-semibold text-stone-950 dark:text-stone-50">
          {counts.total} internships
        </span>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <span className="text-stone-400 text-[11px]">5 categories · updated daily from SimplifyJobs</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          <span className="font-mono text-[10px] text-green-500 tracking-wide">LIVE</span>
        </div>
      </div>
    </HomeClientShell>
  );
}
```

**Important note:** The `counts` variable is referenced inside `children` (the stats bar). Since the stats bar is a simple div, you have two options:
1. Keep it in the server component as a child (shown above)
2. Move it into HomeClientShell as a prop-driven component

Option 1 is simpler. The `children` are server-rendered React elements that get passed into the client shell.

- [ ] **Step 3: Verify it builds**

```bash
npm run build 2>&1 | head -50
```

Expected: Build succeeds. The page now renders with auth-aware header, progressive sidebar, and match scores on jobs.

- [ ] **Step 4: Manual smoke test**

```bash
npm run dev
```

Test these scenarios:
1. Visit `/` as anonymous → see jobs + MatchingPreviewCard sidebar + `sign_in →` button
2. Log in → redirected back to `/` → see ResumeUploadCard in sidebar + `sign_out` button
3. Upload a PDF → ResumeStatusCard appears with skills + match scores appear on jobs
4. Click "tailor ✨" → QuickTailorPanel opens pre-filled with resume text

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rewire homepage to progressive auth-aware single-page app"
```

---

### Task 10: Update login redirect to return to homepage

**Files:**
- Modify: `app/(auth)/login/LoginClient.tsx`

Currently, login redirects to `/dashboard`. Change the default redirect to `/` (homepage), since that's now the main experience.

- [ ] **Step 1: Read LoginClient.tsx**

Read `app/(auth)/login/LoginClient.tsx` to find the redirect logic.

- [ ] **Step 2: Change redirect target**

Find the `callbackUrl` or redirect URL and change `/dashboard` to `/`:

```typescript
// Before:
const callbackUrl = searchParams.get("next") || "/dashboard";

// After:
const callbackUrl = searchParams.get("next") || "/";
```

Also find any `signIn()` call with a callbackUrl and update it.

- [ ] **Step 3: Commit**

```bash
git add app/(auth)/login/LoginClient.tsx
git commit -m "fix: redirect login to homepage instead of /dashboard"
```

---

### Task 11: Clean up — remove old DashboardHeader import from homepage

**Files:**
- Verify: `app/page.tsx` no longer imports `DashboardHeader` (replaced by `AuthHeader` inside `HomeClientShell`)
- Verify: No broken imports or unused references

- [ ] **Step 1: Check for stale imports**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Fix any TypeScript errors from the refactor.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: Clean build with no errors.

- [ ] **Step 3: Commit any cleanup**

```bash
git add app/page.tsx components/dashboard/
git commit -m "chore: clean up stale imports after homepage refactor"
```

---

### Task 12: End-to-end manual verification

**Files:** None (testing only)

- [ ] **Step 1: Start dev server and test full flow**

```bash
npm run dev
```

**Test matrix:**

| Scenario | Expected |
|----------|----------|
| Anonymous visit to `/` | Jobs table, market insights, sidebar CTA, `sign_in →` header |
| Click `sign_in →` | Goes to `/login` |
| Login with credentials | Redirects to `/`, header shows username + `sign_out` |
| Sidebar shows upload card | Drag-and-drop PDF zone visible |
| Upload a PDF resume | Card changes to ResumeStatusCard with skills |
| Jobs show match scores | MatchBadge appears next to job names |
| Click "tailor ✨" | QuickTailorPanel slides in with resume pre-filled |
| Paste job description + click "Analyze Match" | Shows match score, keywords, suggestions |
| Click `sign_out` | Returns to anonymous view |
| Visit `/insights` | Still works (separate page) |
| Visit `/login` directly | Login page works |

- [ ] **Step 2: Test mobile responsiveness**

Open Chrome DevTools → toggle device toolbar → verify:
- Header collapses nav links on mobile
- Sidebar stacks below jobs on mobile
- Upload card is touch-friendly
- Tailor panel works on mobile

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during e2e testing"
```

---

## Summary of the new flow

```
Anonymous user lands on /
  │
  │  Sees: jobs + market insights + "Sign up to match" CTA
  │
  ├─ Clicks sign_in → /login → authenticates → back to /
  │
  │  Sees: same page + PDF upload dropzone in sidebar
  │
  ├─ Drops resume PDF → auto-extracted → keywords + embedding stored
  │
  │  Sees: same page + match scores on every job + resume skills card
  │
  ├─ Clicks "tailor ✨" on a job
  │
  │  Sees: slide-over panel with match %, keywords, 3 suggestions
  │        (format-preserving: user applies suggestions manually)
  │
  ├─ Clicks "apply →" on a job
  │
  │  Opens job URL in new tab
  │
  └─ Done. Zero page navigation beyond login.
```

## What's NOT in this plan (future work)

- **Deleting deprecated pages** (`/dashboard`, `/jobs`, `/resume`) — keep them for now as fallbacks, deprecate in a separate PR
- **AI chat copilot on homepage** — the QuickTailorPanel covers the core need; full chat can be added later as a floating widget
- **Search/filters on homepage JobsTable** — the current table shows 60 most recent jobs sorted by priority; search can be added as a follow-up
- **Re-uploading updates match scores** — the `fetchResume → fetchMatchScores` chain handles this automatically

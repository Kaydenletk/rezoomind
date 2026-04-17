# Phase 1 — Landing Redesign (Feed-is-the-Hero)

**Date:** 2026-04-17
**Phase:** 1 of 6
**Status:** approved design — ready for implementation plan
**Depends on:** Phase 0.5 design tokens.
- ✅ Available: `:root` CSS custom properties (Tasks 1–2 done — brand hues, type scale, radius, spacing, motion)
- ❗ Needed before Phase 1 ships: `@theme` directive exposure (Task 3), extended `<Button>` variants (Task 4), `<Chip>` component (Task 5). The Phase 1 implementation plan MUST either (a) complete Phase 0.5 Tasks 3–5 as its first three tasks, or (b) inline equivalent local implementations and retrofit once Phase 0.5 resumes. Option (a) is recommended — avoids duplicate work.

---

## Problem

The current landing at `app/page.tsx` shows ~120 words of copy across 8 content blocks before a user can see a single real job posting. On mobile this pushes roles below the fold; on desktop the right-side "How it works" panel wastes the highest-attention real estate explaining the product instead of BEING the product.

User's explicit feedback: *"it seem like im reading a wall of text before seeing roles."*

## Goals

1. **Roles visible on screen 1** — on both desktop (1280+) and mobile (375+).
2. **Above-the-fold copy under 30 words.**
3. **Single primary CTA** — no competing buttons.
4. **Premium/minimal 2026 aesthetic** — generous whitespace, display typography, product-as-art.
5. **Preserve brand identity** — terminal dots + `rezoomind` logo + Geist Mono + three-hue token system (orange/cyan/violet).
6. **No regression for authenticated users** — their match scores and saved state still surface.

## Non-goals

- No detail panel / bottom sheet implementation (Phase 3).
- No filter logic beyond basic chip toggles (full filter redesign is Phase 3).
- No authentication UX change (Phase 2).
- No changes to `/insights`, `/resume`, `/preferences`.
- No new market stats beyond the hero count.

---

## The layout

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  ● ○ ○  rezoomind                           log in  [sign up]    │  ← topbar  (56px)
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   14,209 live roles.                                              │  ← hero   (~96px)
│   updated hourly · paste your resume for personal match scores    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ > search roles, companies, skills…  [internship] [remote]  │  │  ← search (sticky)
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│   847 matching · sorted by freshness              sort: newest ↕  │  ← meta
│                                                                   │
│  ┌──┐ SWE Intern — Summer 2026        [python][llm]   [apply →]  │  ← role row
│  │88│ Anthropic · San Francisco · 3h ago                          │
│  └──┘                                                              │
│  ┌──┐ ML Engineer — New Grad          [pytorch]       [explore]   │
│  │62│ OpenAI · Remote · 5h ago                                    │
│  └──┘                                                              │
│  … (3–5 rows total above the fold at 1280×800 viewport) …        │
│                                                                   │
│                ↓ scroll for 842 more · or sign up                │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (≤640px)

```
┌────────────────────────┐
│ rezoomind    [sign up] │  ← topbar (48px)
├────────────────────────┤
│                         │
│  14,209                 │  ← hero (2-line)
│  live roles.            │
│  updated hourly ·       │
│  paste resume for …     │
│                         │
│  > search roles…        │  ← search (sticky)
│  [intern][new grad][⋯]  │  ← filter strip (horiz scroll)
│                         │
│  ┌──┐ SWE Intern — …    │
│  │88│ Anthropic · SF    │  ← role rows
│  └──┘  3h    [apply]    │
│                         │
│  ┌──┐ ML Engineer…      │
│  │62│ OpenAI · Rem 5h   │
│  └──┘         [explore] │
│                         │
│  … 3 rows total above    │
│  the fold at 375×667    │
└────────────────────────┘
```

---

## Copy (locked)

| Element | Text |
|---------|------|
| Logo | `rezoomind` (lowercase, Geist Mono, orange-600, bold, letter-spacing 0.08em) |
| Topbar nav (unauthed) | `log in` (ghost) · `sign up free` (primary-solid) |
| Topbar nav (authed) | avatar initial + username + `log out` (ghost) |
| Hero number | `{liveCount.toLocaleString()} live roles.` — orange-600 on stone-50 |
| Hero sub | `updated hourly · paste your resume for personal match scores` |
| Search placeholder | `search roles, companies, skills…` |
| Meta row | `{filteredCount} matching · sorted by freshness` · `sort: newest ↕` |
| Tier CTA labels | `apply →` / `explore` / `tailor` / (skip tier: no CTA) |
| Empty filter results | `no matches. try: [remove 'remote'] [widen to new-grad]` (suggested filters are clickable) |
| Footer hint | `↓ scroll for {remaining} more · or sign up to see personal match scores` (unauthed only) |
| Auth-no-resume nudge | `upload resume in 20 seconds to unlock match scores` (appears after 3rd row, dismissible per session) |

**Retired copy** — remove these strings entirely from landing:
- "Stop applying blind. See your fit score before you hit submit."
- "Live internship + new-grad roles. AI match score on every posting. Skip the resume roulette."
- "How it works" panel (4 bullets about upload → score → tailor)
- "82% match" mockup card
- 4 stat cards (live roles count moves to hero; the other 3 stats go to `/insights`)

---

## State variants

### A. Unauthenticated default

- Rings render **grayscale** (stone-600 background, stone-400 number) — no color tiers.
- No per-user match scores; scores shown are a synthetic "general interest" proxy for display only, or **hidden entirely** (show company + role, no ring). *Implementation detail:* prefer hiding the ring + number when no resume uploaded; the ring is a signal, not decoration.
- Actually: **v1 of this phase hides the match ring entirely when no resume is uploaded.** Replace the 32px ring with a vertical `border-l-2 border-stone-800` rail. Removes the "is this real?" doubt.
- Footer hint visible; sign-up CTA in topbar is solid orange.

### B. Authenticated, resume uploaded

- Rings render in **full color per tier** (orange/cyan/violet/neutral) from design-tokens spec.
- Topbar replaces `sign up` button with user avatar + username + logout.
- Filter chips gain a `~/saved` toggle (shows only saved jobs when active).
- Footer hint hidden.

### C. Authenticated, no resume yet

- Rings still hidden (as in state A) — rail instead of ring.
- After the 3rd role row, an orange-tinted inline card appears:
  ```
  upload resume in 20 seconds to unlock match scores  →
  ```
  Dismissible via small `×` (dismiss persists for session via `sessionStorage`, not localStorage — re-appears next visit).

### D. Filters yield zero results

- Role list container replaced with:
  ```
  no matches.
  try: [× remove 'remote'] [+ widen to new-grad]
  ```
  Each bracketed suggestion is a clickable button that adjusts the active filter set. No stock-illustration empty state.

### E. Loading (initial, or filter change)

- Skeleton rows matching final layout: grayscale rail + stone-800 shimmer blocks at role-title and role-meta positions. 3 skeleton rows max.
- Meta row shows `loading…` in stone-500.
- Never a blank white flash. Always the topbar + hero stays rendered.

---

## Interaction model

| Action | Behavior |
|--------|----------|
| Click a role row (anywhere in the row) | Opens detail view. On desktop: slide-in pane from right (420px wide). On mobile: bottom sheet (85vh). Row remains in place in feed; scroll position preserved. |
| Press `Esc` with detail open | Closes pane/sheet. Focus returns to the originating row. |
| Click apply CTA | Opens `role.url` in new tab via `target="_blank" rel="noopener noreferrer"`. Does NOT open detail pane. Authed: optimistically marks as "applied" (Phase 5 will persist). |
| Click explore CTA | Opens detail pane (same as clicking row). |
| Click tailor CTA | Opens detail pane with Tailor Wizard modal auto-triggered (authed only; unauthed → redirect to `/signup?return=/&job={id}`). |
| Focus search input | Debounce 200ms, filters inline; URL `?q=...` updates (replaceState, no navigation). |
| `Cmd+K` / `Ctrl+K` anywhere on page | Focuses search input. |
| Toggle filter chip | Multi-select, URL updates (`?filters=internship,remote`). Triggers refetch with 100ms debounce. |
| Hover a role row (desktop, pointer:fine) | Row gets `bg-stone-900`. Ring gets 200ms pulse animation (opacity 1.0 → 0.7 → 1.0). Skipped under `prefers-reduced-motion: reduce`. |
| Scroll near bottom | Lazy-loads next 20 rows via intersection observer. No pagination controls. Spinner: small 10px dot pulse below last row. |
| `sign up free` click | Navigates to `/signup`. After successful signup, returns to `/` with resume-upload nudge visible. |

---

## Typography, color, and spacing

All values consume design-tokens from `docs/superpowers/specs/2026-04-16-design-tokens-design.md`. This spec does not redefine tokens — it maps landing elements to them.

| Element | Token reference | Computed value |
|---------|-----------------|----------------|
| Hero number | `--text-heading-lg` + font-weight 800 | 32px bold |
| Hero number "14,209" | `text-brand-primary` | orange-600 |
| Hero sub | `--text-label` | 11px Geist Mono stone-500 |
| Role title | `--text-body` | 13px Geist Mono stone-50 |
| Role meta | `--text-caption` | 10px Geist Mono stone-500 |
| Search input placeholder | `--text-label` | 11px stone-400 |
| Filter chip | `Chip variant="info"` active, `Chip variant="neutral"` inactive | — |
| Ring color (authed, score-based) | match-score token tiers (apply/explore/tailor/skip) | — |
| Role row bg | `bg-transparent` default, `bg-stone-900` on hover | — |
| Row border | `border-t border-stone-800/60` hairline | — |
| Row padding | `--space-3` (16px) vertical, `--space-2` (12px) horizontal | — |
| Topbar height | 56px desktop, 48px mobile | — |
| Search bar top (sticky) | `top: 56px` desktop / `top: 48px` mobile | — |
| Primary CTA | `btn-primary-solid` from tokens | — |
| Tier CTAs (apply/explore/tailor) | `btn-primary-tint` / Chip info / Chip ai (reused) | — |

---

## Data requirements

All data flows through existing APIs — no new endpoints for this phase.

| UI need | Source | Notes |
|---------|--------|-------|
| Hero count (`14,209`) | `GET /api/dashboard/data` existing `stats.totalLive` (or compute from `job_postings.count()`) | Cache 5min at CDN |
| Role rows | `GET /api/jobs/data?limit=20&offset=…` existing endpoint | Pagination via infinite scroll |
| Filter by `internship`/`new-grad`/`remote` | Existing `?type=` and `?remote=` query params on `/api/jobs/data` | Verify support, extend if missing |
| Search query | Extend `/api/jobs/data` with `?q=` param — SQL `ILIKE` on role + company | If not present, implement in this phase (minimal addition) |
| Match scores (authed only) | `GET /api/matches/batch-score` with job ids | Skip call when no resume on file |
| Auth state | `useSession()` from NextAuth | Already wired |
| Saved state | `GET /api/jobs/saved` — only when authed | Already exists |

**New/extended:** search `?q=` param on `/api/jobs/data` if not already present. Simple ILIKE, no FTS required for this phase.

---

## Accessibility

- **Keyboard nav:** topbar logo → login → signup → search → each filter chip → each role row → each CTA within row. Tab order must match visual order.
- **Role rows:** `role="link"` semantics via anchor or button wrapper. `aria-label="{title} at {company}, {location}, posted {time}, match score {score} of 100"`.
- **Match ring:** `aria-hidden="true"` (the score is already in the label).
- **Focus rings:** `focus-visible:ring-1 focus-visible:ring-brand-primary` on all interactive elements.
- **Screen reader announcements:** filter change triggers `aria-live="polite"` announcement: "{N} roles matching".
- **Color contrast:** verify orange-600 meets 4.5:1 on stone-50 (light mode) — per design-tokens contrast audit, use orange-700 for body text on light bg if needed.
- **Reduced motion:** ring pulse animation wrapped in `@media (prefers-reduced-motion: no-preference)`.
- **Touch targets:** minimum 44×44px on mobile. Role row is 64px; CTA buttons are 32×44 minimum.

---

## Migration & compatibility

| Concern | Approach |
|---------|----------|
| `components/dashboard/HomeClientShell.tsx` | Current production homepage shell — **replace** with new `LandingShell.tsx`. Keep HomeClientShell.tsx for one release with a deprecation comment, delete in Phase 3. |
| `components/dashboard/SummaryStrip.tsx` | Not used by new landing. Keep file (used elsewhere) but remove from `/` route. |
| `components/dashboard/MainInsightCard.tsx` | Not used by new landing. Moves to `/insights` page entirely. |
| `components/dashboard/MarketBanner.tsx` | Trend chart — moves to `/insights` page entirely (per design decision). |
| `components/dashboard/InsightCards.tsx` | 3-column insight cards — moves to `/insights` entirely. |
| `components/dashboard/JobsTable.tsx` | Legacy job table — **superseded** by new role rows. Keep for `/(app)/dashboard/` which still uses it until Phase 3. |
| `components/Header.tsx`, `Footer.tsx` | Unused on landing after redesign. Keep for `(app)` layout (legacy marketing pages). |
| `CLAUDE.md` "Protected Landing Page Files" rules | **Updated in this phase** — the protection list reflected the old shell. New protection list will cover `LandingShell.tsx`, `RoleRow.tsx`, and copy constants. |

**Route:** `/` stays the landing URL. `/feed` becomes an alias (redirects to `/` for authenticated users too). No URL restructuring beyond this.

---

## Component structure

New files (all consume design-tokens primitives):

| File | Responsibility | Approx size |
|------|----------------|-------------|
| `components/landing/LandingShell.tsx` | Orchestrator — composes topbar + hero + search + feed. Owns state: query, filters, scroll position, auth. | ~180 lines |
| `components/landing/LandingTopbar.tsx` | Sticky header — logo, login/signup OR avatar/logout. | ~80 lines |
| `components/landing/LandingHero.tsx` | Hero number + sub. Consumes liveCount prop. | ~40 lines |
| `components/landing/SearchBar.tsx` | Sticky search input + inline filter chips. URL sync. Cmd+K handler. | ~120 lines |
| `components/landing/RoleList.tsx` | Infinite-scroll container. Loading skeletons. Empty state. | ~140 lines |
| `components/landing/RoleRow.tsx` | Single role row — ring/rail, title, meta, chips, CTA. Click handler → detail pane. | ~100 lines |
| `components/landing/AuthNudgeCard.tsx` | Inline "upload resume" nudge (authed, no resume). Dismissible. | ~50 lines |
| `app/page.tsx` | Thin server component — fetches initial 20 roles + liveCount, passes to `<LandingShell>`. | ~40 lines |

**Reused from elsewhere:**
- `components/ui/Button.tsx` (Phase 0.5 extended — primary-solid, ai variants)
- `components/ui/Chip.tsx` (Phase 0.5 created — neutral, info, ai, active)
- `components/smart-feed/DetailPanel.tsx` (existing; opened by row click)
- `components/smart-feed/tailor/TailorWizardModal.tsx` (existing; opened by tailor CTA)

---

## Acceptance criteria

- [ ] New `/` route renders in `<800ms` on cold load (Lighthouse). First 3 role rows visible without scroll on 1280×800 desktop and 375×667 mobile.
- [ ] Above-the-fold copy ≤ 30 words on either viewport.
- [ ] `SummaryStrip`, `MainInsightCard`, `MarketBanner`, `InsightCards`, `HomeClientShell` are NOT imported by `app/page.tsx` after this phase.
- [ ] `/` works without authentication — no redirect, no 401.
- [ ] All 5 state variants render (verified via Playwright screenshot tests or manual QA).
- [ ] Keyboard navigation: Tab traverses topbar → search → filter chips → row 1 CTA → row 2 CTA (etc.) in visual order.
- [ ] Cmd+K focuses search from anywhere on page.
- [ ] Filter chip change updates URL `?filters=…`, and a reload restores the filter state.
- [ ] Auth state toggle: signing in mid-session (new tab) does not reset scroll or filter state on return.
- [ ] `prefers-reduced-motion: reduce` disables the ring pulse.
- [ ] No regression: existing Vitest suite (75 tests after Phase 0.5 Tasks 1–2) passes. Existing `/dashboard`, `/insights`, `/resume` routes unaffected.
- [ ] Design-token drift guard (`tests/ui/token-drift.test.ts` — will be added in remaining Phase 0.5 tasks) does not increase; ideally this phase REDUCES the drift count by consuming new tokens instead of legacy patterns.
- [ ] `CLAUDE.md` "Protected Landing Page Files" section updated to reference the new shell + constants file.

---

## Out of scope

- Bottom sheet / slide-in pane implementation (Phase 3 — DetailPanel rework).
- Match-score loading skeletons in DetailPanel (Phase 3).
- Full-text search indexing (Postgres FTS) — ILIKE suffices for this phase.
- Resume upload UX fixes (Phase 2).
- Google OAuth / passkey / magic link auth (Phase 2).
- Saved/Applied pipeline tracking UI (Phase 5).
- A/B testing framework to validate copy choices (separate infra phase).
- i18n of any landing copy.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Removing 4-stat grid reduces perceived "data-rich" signal and hurts conversion | Hero number + `847 matching` meta row preserve key data. If conversion drops >15% in first week, add one secondary stat below search bar (not above). |
| "How it works" panel retirement loses first-timer onboarding | Replace with a single `?` icon button in topbar that opens a 3-step modal. Cheap, opt-in, not in the main flow. (Defer to post-launch polish if not needed.) |
| Sticky search bar eats vertical space on small screens | Auto-hide on scroll-down, re-show on scroll-up (standard mobile pattern). |
| Existing production homepage users may be confused by missing elements | Release note + changelog entry. The new landing is CLEARLY better; this is a feature, not a regression. |

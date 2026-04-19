# Phase 3 — Feed Redesign + Login Close-out

**Date:** 2026-04-19
**Status:** Design approved, ready for implementation plan
**Owner:** Khanh Le
**Supersedes:** Relevant sections of `2026-04-06-unified-dashboard-design.md` (Feed parts only — Phases 4/5/6 still TBD)

---

## 1. Goals

1. Lift `/feed` density, signal clarity, and trust cues to 2026 standard (Linear / Simplify / Jobright v3 level) **without breaking the terminal aesthetic** defined in `CLAUDE.md`.
2. Close the login flow: a user who signs up lands in a feed that guides them to first-value (resume → preferences → first apply) in under 90 seconds.
3. Pre-empt Phase 5 rework by adding a `status` pill slot on `JobCard` now, even though the backing schema and tracking UX ship later.

## 2. Non-goals

- Real match scoring logic — `/api/dashboard/data` already returns match rows; this phase keeps the existing scoring as-is and only changes presentation. Real keyword extraction and embedding-based scoring is scheduled for Phase 4.
- Apply tracking (Saved → Applied → Interview pipeline) — Phase 5.
- Settings page — Phase 6.
- Resume upload UX rewrite — the existing `/resume` page is reached via onboarding; its internal UX is not revised here.

## 3. Design system guardrails (unchanged)

All changes MUST follow the Terminal Control Panel rules in `CLAUDE.md`:
- Palette: warm stone + orange. No `bg-black`, no pure black. Use `bg-surface`, `bg-surface-raised`, `bg-surface-sunken`, `text-fg`, `text-fg-muted`, `text-fg-subtle`, `border-line`, `border-line-subtle`, `text-orange-700 dark:text-orange-400`.
- Font: mono (Geist Mono) for labels/data/nav. Sans (Inter) only for long-form body.
- No rounded corners on cards. No drop shadows. Sharp 1px borders.
- Both themes must work (light default, dark toggle).

## 4. Visual changes — component by component

### 4.1 New component: `TrustStrip.tsx`

One compact row placed between `SummaryStrip` and `TabBar`/`FilterBar`. Pure data-derived, no decorative copy.

```
───────────────────────────────────────────────
 87 fresh · cron verified · refreshed 2h ago · 12 applied today
───────────────────────────────────────────────
```

- Height: 28px.
- Style: `px-5 py-1.5 border-b border-line-subtle bg-surface-sunken/40 text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono`.
- Items (ordered left → right):
  1. `{freshToday} fresh` — already in shell state.
  2. `cron verified` — static for now; Phase 6 makes it dynamic from cron health check.
  3. `refreshed {relativeTime}` — derived from `Date.now()` at server render.
  4. `{appliedToday} applied today` — authed only; fetched once on mount from a lightweight aggregate (new endpoint, see §7.1).
- Items 3 and 4 are hidden if the underlying number is missing or `0`; never show placeholder or zero values that misrepresent trust. In Phase 3 `appliedToday` returns `0` → item hidden until Phase 5 wires `appliedAt`.

### 4.2 `JobCard.tsx` — compact signal-first rewrite

**Target:** ≥ 10 cards above the fold at 1080p (currently ≈ 6).

**Layout (single row, 60px tall):**
```
[RING 32px]  company · role                                  [NEW] [♥]
             SF, CA · $90–110k · 3h ago
             ✦ Strong fit — Python, SQL match; missing: Kafka
```

Details:
- Padding: `px-4 py-2.5` (was `px-4 py-3`).
- `MatchScoreRing` size 32 (was 36). Muted when `score < 50` via wrapper `opacity-60`.
- Row 1: company bold mono + `·` separator + role regular. Truncate with `min-w-0`. No salary here.
- Row 2: meta — location, salary, relative time. Separator `·`. `text-[11px] text-fg-subtle`.
- Row 3 (NEW): single-line AI reason. `text-[11px] text-fg-muted font-mono`. Prefix `✦` orange. Format:
  - Authed + score ≥ 75: `✦ Strong fit — {matched[0..2].join(', ')}; missing: {missing[0]}`
  - Authed + score 50–74: `✦ Partial fit — {matched[0..2].join(', ')}; gap: {missing[0..1].join(', ')}`
  - Authed + score < 50: `✦ Weak fit — only {matched.length} overlap`
  - Unauth: hide row 3 entirely.
- Right column: vertical stack top-to-bottom — status pill (if any), heart button. Status pill (§4.3) replaces the top of the right column only when present.
- Selected state:
  - Background `bg-orange-50 dark:bg-orange-950/40`.
  - Left rail `border-l-[3px] border-l-orange-500` (was `border-l-2`).
  - `translate-x-[2px]` transform.
  - Company name `font-bold` (was `font-semibold`).
- Confidence weighting: wrapper class `opacity-70` when `isAuthenticated && score != null && score < 50`. Hover clears opacity. Dimming is only for the row content — selected state overrides.

### 4.3 `StatusPill.tsx` — new, micro-component

Reserved slot on `JobCard` for Phase 5 to fill in, but shipped now with three states so nothing moves later:

| State | Label | Visual |
|---|---|---|
| `new` | `NEW` | `text-orange-700 dark:text-orange-400 bg-orange-600/10 border border-orange-600/40` |
| `saved` | `SAVED` | `text-fg-muted bg-surface-sunken border border-line` |
| `applied` | `APPLIED ✓` | `text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-600/40` |

Style shared: `text-[9px] uppercase tracking-[0.15em] font-mono px-1.5 py-0.5 leading-none`.

Phase 3 logic:
- `new` when `datePosted` within last 24h AND user has not yet interacted (for unauth: always within 24h).
- `saved` when `savedJobIds.has(job.id)` and not `applied`.
- `applied` stays dormant until Phase 5 migration lands. Guarded by a prop so Phase 5 is a prop change, not a re-layout.

### 4.4 `DetailPanel.tsx` — merge Explain into Overview, strengthen Apply

Changes:
- **Remove "✦ Explain" tab.** Stream the explanation inline inside Overview, below Match Analysis.
  - On tab-select of a new job, `MatchExplanationStream` mounts with `autoStart=true`, `compact=true`.
  - Add a `compact` prop to `MatchExplanationStream` that renders as an inline block (no faux card chrome) instead of a standalone terminal window. Tokens `<40 chars` fit in ~3 lines.
- **Tabs after change:** `Overview` and `Cover Letter`. Two tabs look pointless — replace the tab bar with a single inline expand-button under the match block. The button is a plain mono text row, not a checkbox:
  - Collapsed: `✉ cover letter — generate →` (label + arrow, `text-orange-700 dark:text-orange-400`, left-aligned, full-width, single-line click target, border-top-only `border-t border-line-subtle`).
  - Expanded: same row flips to `✉ cover letter — hide ×` and `CoverLetterStream` renders below.
  - State is local to `DetailPanel`, reset whenever `selectedJobId` changes.
- **Apply button:** keep orange fill but use semantic token `bg-brand-primary hover:bg-brand-primary-hover text-brand-primary-fg` (these tokens already exist in `app/globals.css` — verify and add if missing). Append a mono arrow `→` that `translate-x-0.5` on hover.
- **Tailor button:** no change — the existing outlined orange style matches the terminal spec.
- **"View on site" link:** add a small text link below Apply row: `→ view source posting`. Opens `job.url` in new tab. Redundant with Apply when Apply also opens `job.url`, but valuable when Phase 4 routes Apply through an internal tracker.

### 4.5 `FilterBar.tsx` — one-row variant

Currently two rows. Collapse to one:

```
> search jobs...               [Role ▾] [Remote ▾] [Fresh ▾] [H1B] [more…] clear
```

Changes:
- Move chips onto the same horizontal line as search. Search flex-grows; chips shrink.
- Visible chips: `Role`, `Remote`, `Fresh`. `H1B` is the only extra filter in Phase 3 — it lives behind a `[more…]` chip that opens a small popover anchored to itself. Popover is terminal-styled (mono, border-line, `bg-surface-raised`). Phase 4+ can add company size, salary band, etc. to this popover without touching the bar.
- Remove the standalone "Recency" label; rename to `Fresh` to match the trust strip language.
- Search input keeps the `>` mono cursor. Add a right-aligned hint `⌘K` on desktop that fades on focus.
- `clear` stays as plain-text link at end.

### 4.6 Keyboard map

Global listener registered in `SmartFeedShell`. Active only when focus is not in an input.

| Key | Action |
|---|---|
| `j` | Select next job in filtered list |
| `k` | Select previous job |
| `s` | Toggle save on selected job |
| `t` | Open Tailor panel for selected job |
| `a` | Open Apply URL (`window.open(job.url)`) |
| `/` | Focus search input |
| `?` | Toggle help overlay |
| `esc` | Close open modal/popover; clear selected |

Footer hint (inside feed column, sticky bottom): `j/k navigate · s save · t tailor · a apply · / search · ? help` — `text-[10px] tracking-[0.2em] text-fg-subtle font-mono px-5 py-2 border-t border-line-subtle`. Hidden on `lg:hidden` (mobile).

Help overlay is a centered modal with the full map rendered as a two-column mono table. Toggle via `?` or close button.

### 4.7 Onboarding strip — post-signup guided flow

**Component:** `OnboardingStrip.tsx` (new). Replaces the existing `OnboardingBanner.tsx` which only handles the no-resume case.

**Placement:** Between `TabBar` (if authed) and `FilterBar`. Only renders when authed AND any step is incomplete.

**Layout:**
```
╭─ getting_started ──────────────────────────────╮
│  [✓] 01 upload_resume    [ ] 02 set_preferences    [ ] 03 first_apply   ×  │
╰────────────────────────────────────────────────╯
```

- Styled as a single-row bar, `px-5 py-2 border-b border-line bg-surface-sunken/60`.
- Each step is mono `text-[11px]`.
  - Incomplete: `[ ]` + orange `text-orange-700 dark:text-orange-400`, clickable → triggers step action.
  - Complete: `[✓]` + `text-status-success line-through`.
- `×` at end dismisses for session (sessionStorage `onboarding_dismissed=1`). Does not persist across logins.

**Step definitions:**
| # | Label | Complete when | Click action |
|---|---|---|---|
| 01 | `upload_resume` | `resume.resume_text` non-empty | Open slide-over that iframes `/resume` upload (or navigate on mobile) |
| 02 | `set_preferences` | `interest.roles.length > 0` | Open slide-over with role-picker + location checkboxes. Posts to new `/api/interest` endpoint. |
| 03 | `first_apply` | `savedJob` count ≥ 1 OR any apply tracked | Scroll to first `For You` card + highlight its Apply button for 2s. No persistence needed in Phase 3 — flips when Phase 5 applies tracking. |

Hide the entire strip once all 3 are complete, without dismissal.

### 4.8 `SmartFeedShell.tsx` wiring changes

- Replace `OnboardingBanner` mount with `OnboardingStrip` and pass `{ hasResume, hasInterest, hasFirstAction }`.
- Fetch `/api/interest` on auth (new endpoint, see §7.2) alongside existing `/api/dashboard/data` and `/api/resume/data`. Use `Promise.allSettled` to avoid one failure breaking the others.
- Register keyboard listener effect. Depend on `filteredJobs`, `selectedJobId`, `panelMode`.
- Remove explicit `panelMode` tab logic for "explain" — Overview is the only non-cover-letter view now.

## 5. Copy locked

| Location | String |
|---|---|
| Trust strip separator | ` · ` |
| AI reason prefix | `✦ ` |
| AI reason strong | `Strong fit — {skills}; missing: {skill}` |
| AI reason partial | `Partial fit — {skills}; gap: {skills}` |
| AI reason weak | `Weak fit — only {n} overlap` |
| Keyboard footer | `j/k navigate · s save · t tailor · a apply · / search · ? help` |
| Onboarding title | `getting_started` |
| Onboarding steps | `01 upload_resume`, `02 set_preferences`, `03 first_apply` |
| Apply button | `Apply →` |
| Cover letter toggle | `[ ] cover letter — generate →` |

All copy lives in `components/smart-feed/copy.ts` (new file) so Phase 4/5 can extend without inline edits.

## 6. Data / state changes

### 6.1 No schema migration in this phase

Phase 3 is UI-only. `status` pill uses derived state (`new` from `datePosted`, `saved` from `savedJobIds`). `applied` state is wired through a prop but always `false` until Phase 5 adds the column.

### 6.2 Client-side derived fields

Add these derivations in `SmartFeedShell` or a `lib/feed-derivations.ts`:

```ts
export function deriveStatus(
  job: SmartFeedJob,
  savedIds: Set<string>,
  appliedIds: Set<string>
): 'new' | 'saved' | 'applied' | null

export function deriveAIReason(match: JobMatch | null): string | null
```

Keep these pure and exportable so tests can cover them directly.

## 7. New API endpoints

### 7.1 `GET /api/feed/aggregate`

Lightweight counts for the TrustStrip. Public; no auth required.

Response:
```json
{ "appliedToday": 12, "lastRefreshedAt": "2026-04-19T12:00:00Z" }
```

Implementation:
- `appliedToday` comes from `SavedJob` where `appliedAt >= startOfToday()`. Phase 3 returns `0` because `appliedAt` doesn't exist yet — deliberate. Endpoint stub exists so Phase 5 drops in one query without touching the UI.
- `lastRefreshedAt` = newest `job_postings.created_at`.

### 7.2 `GET /api/interest`

Returns the user's interest row if exists.

```json
{ "ok": true, "interest": { "roles": ["swe"], "locations": ["sf"], "grad_year": 2027 } | null }
```

### 7.3 `POST /api/interest`

Upsert the user's interest row. Body: `{ roles: string[], locations: string[], grad_year?: number }`. Zod-validated. Returns the row.

## 8. Files touched

### New
- `components/smart-feed/TrustStrip.tsx`
- `components/smart-feed/StatusPill.tsx`
- `components/smart-feed/OnboardingStrip.tsx`
- `components/smart-feed/KeyboardHelpOverlay.tsx`
- `components/smart-feed/copy.ts`
- `hooks/useFeedKeyboard.ts`
- `lib/feed-derivations.ts`
- `app/api/feed/aggregate/route.ts`
- `app/api/interest/route.ts`

### Modified
- `components/smart-feed/JobCard.tsx` — compact layout, AI reason row, status pill slot
- `components/smart-feed/DetailPanel.tsx` — remove Explain tab, inline stream, Apply token change
- `components/smart-feed/FilterBar.tsx` — one-row, `⌘K` hint, `more…` popover
- `components/smart-feed/SmartFeedShell.tsx` — wire onboarding strip, keyboard, trust strip, derivations
- `components/smart-feed/MatchExplanationStream.tsx` — add `compact` prop
- `components/dashboard/MatchScoreRing.tsx` — confirm `size` prop + muted state when `score < 50` (add `muted` prop)
- `app/globals.css` — verify `--color-brand-primary` / `--color-brand-primary-hover` / `--color-brand-primary-fg` tokens; add if missing
- `CLAUDE.md` — add `components/smart-feed/*` to protected-files table for Phase 3+

### Deleted
- `components/smart-feed/OnboardingBanner.tsx` — replaced by `OnboardingStrip`

## 9. Testing strategy

### Playwright E2E
Add `tests/e2e/feed.spec.ts` with:
1. Unauth: visits `/feed`, sees trust strip, can filter, cannot see AI reason row, cannot save.
2. Authed new signup: sees onboarding strip with 3 incomplete steps.
3. Authed with resume + interest: onboarding strip hidden.
4. Keyboard: presses `j`/`k`/`s`/`/` and asserts expected state changes.

### Visual regression
Snapshot at 320, 768, 1024, 1440 widths for:
- Unauth feed
- Authed feed with onboarding strip visible
- Authed feed with a job selected

### Unit
- `deriveStatus` and `deriveAIReason` in `lib/feed-derivations.test.ts`.
- `useFeedKeyboard` hook tested with jsdom keydown simulation.

### Accessibility
- Help overlay must be a focus trap.
- Keyboard shortcuts must not fire when focus is in `<input>`, `<textarea>`, or `contenteditable`.
- All new buttons must have accessible names.
- Onboarding strip steps must be reachable via Tab and activated via Enter/Space.

## 10. Performance budget

- `/feed` JS bundle budget: stay under 300kb gzipped (current estimated 210kb). New components must not exceed +30kb total.
- No new client-side libraries. `Framer Motion` reused, no Lottie or similar.
- Trust strip refresh is fetched once on mount, cached via `fetch` default semantics. No polling.
- Keyboard listener is attached once, debounced via `requestAnimationFrame` to avoid thrashing selection state on held keys.

## 11. Rollout order

Implementation order is picked to leave `main` shippable at every step:

1. Tokens + derivations + copy file (zero UI change).
2. `TrustStrip` → wired with shell.
3. `StatusPill` + `JobCard` compact rewrite.
4. `DetailPanel` merge Explain into Overview.
5. `FilterBar` one-row.
6. Keyboard hook + footer hint + help overlay.
7. `/api/interest` + `/api/feed/aggregate` endpoints.
8. `OnboardingStrip` wiring to shell.
9. CLAUDE.md protected-files update + E2E tests.

Each step = one commit with conventional message.

## 12. Open questions (to resolve during planning)

- Should the AI-reason line be client-derived (cheap) or server-derived (consistent for Phase 4 real scoring)? **Default: client-derived from existing match fields. Phase 4 can replace the deriver with a server call if scoring becomes expensive.**
- Does the confidence dimming affect saved/applied pipeline view later? **Default: yes, same rule; Phase 5 can opt-out on the `Applied` tab where scores are less relevant.**
- Should onboarding persist across devices? **Default: no — session-only dismissal for Phase 3. Phase 6 Settings can add a persistent flag if the user explicitly turns it off.**

---

## Appendix A — Keyboard shortcuts reference

```
Navigation          Actions
─────────────       ─────────────
j   next job        s   save / unsave
k   prev job        t   open tailor
/   focus search    a   apply (open url)
esc clear / close   ?   help overlay
```

## Appendix B — JobCard ASCII visual spec (compact mode)

```
┌────────────────────────────────────────────────────────────────────┐
│  ⏺   company_name · role_name                         [NEW]   [♥]  │
│      SF, CA · $90–110k · 3h ago                                     │
│      ✦ Strong fit — Python, SQL match; missing: Kafka              │
└────────────────────────────────────────────────────────────────────┘
     ↑
     MatchScoreRing 32px (muted if score < 50)
```

Selected state adds `border-l-[3px]` orange rail on the left and shifts content `translate-x-[2px]`.

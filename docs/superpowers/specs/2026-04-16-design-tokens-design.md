# Design Tokens — Design Spec

**Date:** 2026-04-16
**Phase:** 0.5 (cross-cutting prerequisite to Phases 1–6)
**Status:** approved design — ready for implementation plan

---

## Problem

The audit of 6 surfaces (Landing, Auth, Onboarding, Feed, Tailor, Insights) found systemic design-system drift:

- **Type scale:** 4+ uncoordinated font-sizes (`[9px]`, `[10px]`, `[11px]`, `text-xs`, mixed `text-sm`)
- **Radius:** `rounded-[10px]`, `rounded-[14px]`, `rounded-md`, and sharp 0px used without rule
- **Buttons:** 3+ conflicting "primary" styles (`bg-orange-600`, `bg-orange-600/10`, `bg-stone-950`)
- **Palette:** effectively orange-only, which reads austere and gives zero wayfinding across routes
- **Spacing:** `p-3`, `p-4`, `p-5`, `p-6` used interchangeably with no rhythm

The drift blocks Phases 1–6 from producing a coherent experience. Each phase would re-discover and re-solve the same token questions, compounding inconsistency.

## Goals

1. Lock a minimal, opinionated token system before any surface redesign.
2. Preserve the "Terminal Control Panel" identity (per `CLAUDE.md`): Geist Mono typography, flat cards, sharp borders, no shadows.
3. Introduce **wayfinding through color** — three brand hues, each with a dedicated semantic role.
4. Stay Tailwind-native — tokens become Tailwind theme extensions, not a parallel CSS system.
5. Support light + dark mode equivalently (existing theme toggle must keep working).

## Non-goals

- No refactor of existing components in this phase. Tokens land as new classes; migration is per-phase.
- No new fonts. Geist Mono stays primary; Inter stays as body fallback where readability demands it.
- No runtime theming beyond the existing light/dark toggle.

---

## The three brand hues

| Token | Tailwind | Hex | Role | Usage examples |
|-------|----------|-----|------|----------------|
| `--brand-primary` | `orange-600` | `#ea580c` | **Action** | apply button, primary CTA, logo, active `/feed` nav, focus rings, strong match score ≥75% |
| `--brand-info` | `cyan-500` | `#06b6d4` | **Information** | `/insights` chart lines, market data, info toasts, middle-tier match 50–74%, tech skill chips, streaming indicators |
| `--brand-ai` | `violet-500` | `#8b5cf6` | **Intelligence** | tailor button, ask-AI button, explain-match stream, cover letter generator, AI-derived chips, premium signals, low-tier match 30–49% ("tailor to fit") |

**Harmony rationale:** three hues at roughly 30° / 190° / 270° on the color wheel — triadic, no muddying. Similar luminance (all 500/600 Tailwind weight) so none visually dominates another. Warm primary (orange) anchors CTAs; cool accents (cyan, violet) provide variety without competing with action.

**Saturation cap:** no color on screen may be brighter than `orange-600`. Any accent brighter than the brand breaks hierarchy.

**Discipline:** these three + neutral grayscale (stone-950/900/800/400/200/50) are the entire palette. Everything else inherits from this set.

### Accent tints (for backgrounds)

Each brand hue gets a `/10` tint for background use and a `/30` or `/50` tint for borders:

- `bg-orange-600/10` + `border-orange-600/50` → primary tint button, "you are here" nav highlight
- `bg-cyan-500/10` + `border-cyan-500/40` → info-chip background, middle-tier match row
- `bg-violet-500/10` + `border-violet-500/40` → AI-chip background, tailor button surface

---

## Semantic status colors — outside the brand palette

Two exceptions for states users expect from every modern UI:

| Token | Tailwind | Hex | Rule |
|-------|----------|-----|------|
| `--status-success` | `green-500` | `#22c55e` | ONLY inline ticks (▸ saved), applied-status pill. Never backgrounds, never CTAs. |
| `--status-error` | `red-500` | `#ef4444` | ONLY inline error text (✗ failed), destructive confirmations ("delete account"). Never decorative. |

Keeping red/green off the brand palette signals "this is a status, not a feature" and keeps the three brand hues instantly recognizable.

---

## Type scale — 6 tokens, Geist Mono

| Token | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| `--text-caption` | 10px | regular | 0.2em | `MARKET STATUS` uppercase labels |
| `--text-label` | 11px | regular | normal | meta, small secondary text |
| `--text-body` | 13px | regular | normal | descriptions, paragraphs |
| `--text-heading-sm` | 18px | semibold | normal | `~/resume` page titles, subsection |
| `--text-heading-md` | 24px | semibold | normal | main page title (`Resume`, `Insights`) |
| `--text-heading-lg` | 32px | bold | -0.02em | hero / landing headline |

**Retiring:** `text-[9px]`, standalone `text-xs` without scale alignment, `text-[11px]` as a heading size, ad-hoc `text-sm` for captions.

**Line-height:** `leading-tight` (1.25) for headings, `leading-normal` (1.5) for body, `leading-snug` (1.375) for multi-line labels.

---

## Radius — 3 tiers

| Token | Value | Use |
|-------|-------|-----|
| `--radius-none` | 0 | all cards, panels, sections, major surfaces (core terminal aesthetic) |
| `--radius-sm` | 2px | buttons, inputs, small interactive elements |
| `--radius-pill` | 9999px | badges, status pills, avatars |

**Retiring:** `rounded-[10px]`, `rounded-[14px]`, `rounded-md`, `rounded-lg`. Any radius not in the 3-tier scale is banned.

---

## Spacing — 8pt grid

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 8px | tight cluster (icon + label) |
| `--space-2` | 12px | inline gap in a row |
| `--space-3` | 16px | card internal padding |
| `--space-4` | 24px | section gap inside a page |
| `--space-5` | 32px | page padding, major section breaks |
| `--space-6` | 48px | hero margins, landing rhythm |
| `--space-7` | 64px | between-major-surfaces (rare) |

**Retiring:** ad-hoc `p-3`, `p-4`, `p-5`, `p-6`, `p-7` without thought. Prefer `space-3` (card), `space-4` (section), `space-5` (page) as defaults.

---

## Button variants — 4 styles

| Variant | Classes (conceptual) | Use |
|---------|---------------------|-----|
| `btn-primary-solid` | `bg-orange-600 text-stone-950 border-orange-600 hover:bg-orange-500` | THE one primary CTA per screen (apply, save resume). Max one per screen. |
| `btn-primary-tint` | `bg-orange-600/10 text-orange-500 border-orange-600/50 hover:bg-orange-600/20` | In-context primary actions, "active" chips. Current default. |
| `btn-ai` | `bg-violet-500/10 text-violet-300 border-violet-500/50 hover:bg-violet-500/20` | Tailor, Ask AI, Explain — anything AI-driven. |
| `btn-ghost` | `text-stone-400 hover:text-orange-500 border-transparent` | Nav links, text-only actions, low-emphasis. |
| `btn-secondary` | `bg-stone-900/30 text-stone-400 border-stone-800 hover:text-stone-100` | Cancel, dismiss, tertiary. |
| `btn-danger` | `bg-transparent text-red-400 border-red-500/30` | Destructive only (delete account). |

**Discipline:** `btn-primary-solid` appears **once per screen**. All other primary actions use `btn-primary-tint` or `btn-ai`. Never mix solid primaries.

---

## Match score — color-tier alignment

The match score visualization uses brand hues, not a red→green traffic-light gradient. Each tier **prescribes an action**:

| Score | Hue | Tier label | Action |
|-------|-----|-----------|--------|
| ≥75% | orange-600 | `apply now` | Ready as-is. Main CTA = apply. |
| 50–74% | cyan-500 | `worth exploring` | Investigate. Main CTA = tailor or explain. |
| 30–49% | violet-500 | `tailor to fit` | AI can bridge the gap. Main CTA = tailor. |
| <30% | stone-600 | `skip` | Don't bother. Main CTA = none (muted). |

This couples the score color to the recommended next action — the UI becomes self-documenting.

---

## Navigation wayfinding

Each primary route gets a color-coded active state:

| Route | Active underline | Active text |
|-------|-----------------|-------------|
| `/feed` (or `/`) | `orange-600` | `orange-400` |
| `/insights` | `cyan-500` | `cyan-400` |
| `/tailor` (or AI-modal surfaces) | `violet-500` | `violet-300` |
| `/saved`, `/applied`, `/preferences` | `stone-50` | `stone-50` (neutral — these are personal spaces; no theme) |

Users can tell which "room" they're in by color alone, even with peripheral vision.

---

## Motion — 3 durations

| Token | Value | Use |
|-------|-------|-----|
| `--motion-fast` | 150ms ease-out | hover, focus, button press, chip toggle |
| `--motion-normal` | 250ms ease-out | panel slide, modal, tab change |
| `--motion-slow` | 400ms ease-out | hero reveal, landing-only transitions |

All wrapped in `@media (prefers-reduced-motion: reduce) { transition-duration: 0ms; }`.

---

## Implementation strategy

### Token layer

Tokens live in `tailwind.config.js` (existing Tailwind v4 config) as theme extensions. Two layers:

1. **Primitives** — pure values (hex codes, px sizes, ms durations).
2. **Semantic aliases** — primitives mapped to roles (`brand-primary` → `orange-600`).

Component classes consume semantic aliases; new components never reference primitives directly.

### File additions

- `app/globals.css` — CSS custom properties for tokens (single source of truth), light + dark theme blocks.
- `tailwind.config.js` — extend `theme.colors`, `theme.fontSize`, `theme.spacing`, `theme.borderRadius`, `theme.transitionDuration` to reference the custom properties.
- `components/ui/Button.tsx` — **new** unified Button component implementing the 6 variants. Replaces ad-hoc button classes across the app.
- `components/ui/Badge.tsx` / `Chip.tsx` — **new** standardized chip component supporting the 3 brand tints + neutral.

### Migration strategy

Not part of this spec — each Phase 1–6 plan will migrate its own surface to the new tokens. The spec delivers the tokens + `<Button>` / `<Chip>` primitives; phases consume them.

**Exception:** one cleanup PR migrates the existing `components/Header.tsx` and `components/dashboard/AuthHeader.tsx` to the new nav-color tokens, since they appear on every authenticated route and a half-migrated header looks broken.

---

## Testing

- **Visual regression:** capture screenshots of all 6 surfaces before migration. Phase plans compare against baseline.
- **A11y:** all brand hues paired with stone backgrounds must meet WCAG AA contrast (4.5:1 for text, 3:1 for interactive borders). Verify via `@axe-core/react` in dev, lock in CI.
- **Token unit tests:** a single Vitest spec asserts all token exports resolve to the documented hex values (catches accidental drift).

---

## Out of scope

- Component library beyond Button and Badge/Chip — DetailPanel, JobCard, etc. are redesigned in their respective phases.
- Typography for marketing copy font (sans-serif). Geist Mono dominates; Inter is used sparingly and has no scale changes.
- Animations library choice (Framer Motion is kept).
- Dark mode color re-derivation — existing dark base (`stone-950`) remains authoritative. Light mode inverts the stone scale only (light surfaces `stone-50/100/200`, light text `stone-900/800`); the three brand hues render identically in both modes at their defined 500/600 weights. WCAG AA contrast must be verified in light mode since brand hues are optimized for dark backgrounds.
- Illustration / iconography system (Lucide React stays).

---

## Acceptance criteria

- [ ] `tailwind.config.js` exports all 6 brand+semantic color tokens, 6 type tokens, 3 radius tokens, 7 spacing tokens, 3 motion tokens.
- [ ] `app/globals.css` declares CSS custom properties for all tokens in both `:root` (light) and `.dark` blocks.
- [ ] `components/ui/Button.tsx` renders all 6 variants with correct hover/focus/active/disabled states.
- [ ] `components/ui/Chip.tsx` renders neutral + 3 brand-tint variants.
- [ ] Header components consume the new nav-color tokens (orange/cyan/violet per route).
- [ ] Token drift audit: grep for `text-\[9px\]`, `rounded-\[10px\]`, `rounded-\[14px\]` returns zero hits in `components/` and `app/` after this phase + header migration.
- [ ] No existing functionality regresses — Vitest + existing UI tests pass.

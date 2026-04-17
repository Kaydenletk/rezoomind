# Phase 1 — Landing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-heavy landing at `app/page.tsx` with a "feed-is-the-hero" layout: ~22 words above the fold, 3–5 live role rows on screen 1, sticky search with inline filter chips, tier-colored match rings (orange/cyan/violet per Phase 0.5 tokens), bottom-sheet/slide-in detail pane entry.

**Architecture:** 8 new presentational components in `components/landing/`, each with one responsibility. `LandingShell.tsx` is the client-side orchestrator; `app/page.tsx` becomes a thin server component that fetches `jobs[]` + `liveCount` and hydrates the shell. Filtering is entirely client-side on the loaded job array (existing `/api/jobs/data` is unchanged — no new API). Phase 0.5 Tasks 3–5 (`@theme` directive, extended Button variants, new Chip component) are folded in as the first 3 tasks.

**Tech Stack:** Next.js 16 App Router, React 19 client/server components, Tailwind CSS v4 (`@theme inline`), TypeScript, NextAuth v4 (`useSession`), Vitest (pure-function unit tests), Geist Mono.

**Spec:** [docs/superpowers/specs/2026-04-17-phase1-landing-design.md](../specs/2026-04-17-phase1-landing-design.md)

**Token dependency:** [docs/superpowers/specs/2026-04-16-design-tokens-design.md](../specs/2026-04-16-design-tokens-design.md)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/globals.css` | Add `@theme inline` directive exposing Phase 0.5 tokens to Tailwind utilities |
| Modify | `tailwind.config.js` | Remove legacy `theme.extend.colors.brand` shim (superseded by `@theme`) |
| Modify | `components/ui/Button.tsx` | Extend variants from 3 to 6 (`primary-solid`, `ai`, `danger` added; legacy `primary` aliased) |
| Create | `tests/ui/button-variants.test.ts` | Pure-function tests for the 6 Button variants |
| Create | `components/ui/Chip.tsx` | New 4-variant Chip (`neutral` / `info` / `ai` / `active`) |
| Create | `tests/ui/chip-variants.test.ts` | Pure-function tests for Chip variants |
| Create | `hooks/useSearchFilters.ts` | Hook: query + filter-chip state synced to URL (`?q=&filters=`). Cmd+K focus ref. |
| Create | `tests/hooks/search-filters.test.ts` | Unit tests for the URL parse/serialize pure helpers |
| Create | `components/landing/LandingTopbar.tsx` | Sticky 48/56px topbar — logo, auth state, sign-up CTA |
| Create | `components/landing/LandingHero.tsx` | Hero number + one-line sub |
| Create | `components/landing/SearchBar.tsx` | Sticky search input + filter chip row + Cmd+K handler |
| Create | `components/landing/RoleRow.tsx` | Single role row — ring/rail, title, meta, chips, tier CTA |
| Create | `components/landing/AuthNudgeCard.tsx` | Dismissible "upload resume" nudge for authed-no-resume state |
| Create | `components/landing/RoleList.tsx` | Applies client-side filter to loaded jobs; renders RoleRows, skeletons, empty state |
| Create | `components/landing/LandingShell.tsx` | Client orchestrator — composes everything, owns `useSession` + `useSearchFilters` |
| Create | `components/landing/copy.ts` | Locked copy strings (hero, sub, placeholders, empty-state, auth-nudge) |
| Modify | `app/page.tsx` | Thin server component — fetches initial data, renders `<LandingShell />` |
| Modify | `CLAUDE.md` | Update "Protected Landing Page Files" table to the new shell structure |

**Total: 2 modified + 10 created + 4 test files = 16 files touched.**

---

## Task 1: Expose Phase 0.5 tokens via `@theme` directive

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.js`

Makes `bg-brand-primary`, `text-brand-ai`, etc. resolve as Tailwind utilities. Without this, later tasks can't use the brand token classes.

- [ ] **Step 1: Read the current top of `app/globals.css`**

```bash
head -80 "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind/app/globals.css"
```

Note where the `:root { ... }` block ends. Also note any existing `@theme` block (the project already has one for `--font-sans` / `--font-mono`).

- [ ] **Step 2: Add or extend the `@theme inline` block**

If there is NO existing `@theme` block, append this AFTER the closing `}` of `:root`:

```css
@theme inline {
  /* Brand hues */
  --color-brand-primary: rgb(var(--brand-primary));
  --color-brand-info: rgb(var(--brand-info));
  --color-brand-ai: rgb(var(--brand-ai));

  /* Brand tints for backgrounds */
  --color-brand-primary-tint: rgb(var(--brand-primary) / 0.1);
  --color-brand-info-tint: rgb(var(--brand-info) / 0.1);
  --color-brand-ai-tint: rgb(var(--brand-ai) / 0.1);

  /* Status */
  --color-status-success: rgb(var(--status-success));
  --color-status-error: rgb(var(--status-error));

  /* Motion durations */
  --duration-fast: var(--motion-fast);
  --duration-normal: var(--motion-normal);
  --duration-slow: var(--motion-slow);
}
```

If there IS an existing `@theme` block (likely has `--font-sans` / `--font-mono` already), ADD the lines above to the inside of that existing block — do not create a second `@theme`.

- [ ] **Step 3: Trim the legacy shim from `tailwind.config.js`**

Open `tailwind.config.js`. Replace the entire file contents with:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

The legacy `brand` / `brand-hover` colors are superseded by the `@theme` block — Tailwind v4 reads both, but the new names are the source of truth.

- [ ] **Step 4: Smoke-test Tailwind resolves the new classes**

Create a throwaway smoke file:

```bash
cat > /tmp/smoke.tsx <<'EOF'
export const Smoke = () => <div className="bg-brand-primary text-brand-info border-brand-ai" />;
EOF
```

Type-check with the project's tsc — this won't validate Tailwind, but confirms no CSS-level errors from globals.css:

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx tsc --noEmit 2>&1 | grep -iE 'globals\.css|tailwind' || echo "CSS/config OK"
rm /tmp/smoke.tsx
```

Expected: `CSS/config OK`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
git add app/globals.css tailwind.config.js
git commit -m "feat(design): expose brand tokens via @theme directive"
```

---

## Task 2: Extend Button variants (TDD)

**Files:**
- Modify: `components/ui/Button.tsx`
- Create: `tests/ui/button-variants.test.ts`

Current `Button` has 3 variants (`primary` / `secondary` / `ghost`). Add 3 new (`primary-solid`, `ai`, `danger`). Keep legacy `primary` as an alias for backward compat.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/button-variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/Button';

describe('buttonVariants', () => {
  it('primary-solid uses solid orange bg with dark text', () => {
    expect(buttonVariants['primary-solid']).toContain('bg-brand-primary');
    expect(buttonVariants['primary-solid']).toContain('text-stone-950');
  });

  it('primary-tint uses orange-tint bg', () => {
    expect(buttonVariants['primary-tint']).toContain('bg-brand-primary-tint');
    expect(buttonVariants['primary-tint']).toContain('text-orange-500');
  });

  it('ai variant uses violet tint', () => {
    expect(buttonVariants.ai).toContain('bg-brand-ai-tint');
    expect(buttonVariants.ai).toContain('text-violet-300');
  });

  it('danger variant uses red border, transparent bg', () => {
    expect(buttonVariants.danger).toContain('text-red-400');
    expect(buttonVariants.danger).toContain('bg-transparent');
  });

  it('ghost variant is text-only with no background class', () => {
    expect(buttonVariants.ghost).toContain('text-stone-500');
    expect(buttonVariants.ghost).not.toMatch(/\bbg-(?!transparent)/);
  });

  it('secondary has a visible border and muted text', () => {
    expect(buttonVariants.secondary).toContain('border');
    expect(buttonVariants.secondary).toContain('text-stone-400');
  });

  it('legacy "primary" is aliased to primary-tint', () => {
    expect(buttonVariants.primary).toBe(buttonVariants['primary-tint']);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx vitest run tests/ui/button-variants.test.ts 2>&1 | tail -10
```

Expected: FAIL with `buttonVariants is not exported` (or similar).

- [ ] **Step 3: Rewrite `components/ui/Button.tsx` with the extended variants**

Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";
import type { LinkProps } from "next/link";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary-solid"
  | "primary-tint"
  | "ai"
  | "secondary"
  | "ghost"
  | "danger"
  | "primary";

type ButtonSize = "sm" | "md";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type ButtonAsLink = CommonProps &
  Partial<Pick<LinkProps, "prefetch" | "replace" | "scroll" | "shallow" | "locale">> & {
    href: LinkProps["href"];
    target?: string;
    rel?: string;
  } & Omit<HTMLAttributes<HTMLAnchorElement>, "className" | "children">;

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

export type ButtonProps = ButtonAsLink | ButtonAsButton;

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-60";

const primaryTint =
  "border border-orange-600/50 bg-brand-primary-tint text-orange-500 hover:bg-orange-600/20";

export const buttonVariants: Record<ButtonVariant, string> = {
  "primary-solid":
    "border border-brand-primary bg-brand-primary text-stone-950 hover:bg-orange-500",
  "primary-tint": primaryTint,
  primary: primaryTint,
  ai: "border border-violet-500/50 bg-brand-ai-tint text-violet-300 hover:bg-violet-500/20",
  secondary:
    "border border-stone-700 bg-transparent text-stone-400 hover:border-orange-600/50 hover:text-orange-500",
  ghost: "text-stone-500 hover:text-orange-500",
  danger:
    "border border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-6 py-3",
};

export function Button({
  variant = "primary-tint",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(baseStyles, buttonVariants[variant], sizeStyles[size], className);

  if ("href" in props && props.href) {
    const { href, prefetch, replace, scroll, shallow, locale, target, rel, ...rest } = props;
    return (
      <Link
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        shallow={shallow}
        locale={locale}
        className={classes}
        target={target}
        rel={rel}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const { type, ...rest } = props as ButtonAsButton;
  return (
    <button type={type ?? "button"} className={classes} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run tests/ui/button-variants.test.ts 2>&1 | tail -10
```

Expected: 7/7 pass.

- [ ] **Step 5: Run the full suite to verify no regressions**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all existing tests still pass (default `variant="primary"` still works because it's aliased).

- [ ] **Step 6: Commit**

```bash
git add components/ui/Button.tsx tests/ui/button-variants.test.ts
git commit -m "feat(ui): extend Button to 6 variants with backward-compat alias"
```

---

## Task 3: Create Chip component (TDD)

**Files:**
- Create: `components/ui/Chip.tsx`
- Create: `tests/ui/chip-variants.test.ts`

Four variants: `neutral` (stone), `info` (cyan), `ai` (violet), `active` (orange).

- [ ] **Step 1: Write failing test**

Create `tests/ui/chip-variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { chipVariants } from '@/components/ui/Chip';

describe('chipVariants', () => {
  it('neutral uses stone colors and a border', () => {
    expect(chipVariants.neutral).toContain('text-stone-400');
    expect(chipVariants.neutral).toContain('border');
  });

  it('info uses cyan tint + cyan text', () => {
    expect(chipVariants.info).toContain('text-cyan-300');
    expect(chipVariants.info).toContain('bg-brand-info-tint');
  });

  it('ai uses violet tint + violet text', () => {
    expect(chipVariants.ai).toContain('text-violet-300');
    expect(chipVariants.ai).toContain('bg-brand-ai-tint');
  });

  it('active uses orange tint + orange text', () => {
    expect(chipVariants.active).toContain('text-orange-400');
    expect(chipVariants.active).toContain('bg-brand-primary-tint');
  });

  it('every variant includes font-mono base', () => {
    for (const variant of Object.values(chipVariants)) {
      expect(variant).toContain('font-mono');
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/ui/chip-variants.test.ts 2>&1 | tail -10
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `components/ui/Chip.tsx`**

```tsx
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipVariant = "neutral" | "info" | "ai" | "active";

const baseStyles =
  "inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border tracking-wide lowercase transition-colors";

export const chipVariants: Record<ChipVariant, string> = {
  neutral: "border-stone-700 bg-transparent text-stone-400 hover:border-stone-600",
  info: "border-cyan-500/40 bg-brand-info-tint text-cyan-300 hover:border-cyan-500/70",
  ai: "border-violet-500/40 bg-brand-ai-tint text-violet-300 hover:border-violet-500/70",
  active: "border-orange-600/40 bg-brand-primary-tint text-orange-400 hover:border-orange-600/70",
};

interface ChipBaseProps {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
}

type ChipSpanProps = ChipBaseProps & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children"> & { as?: "span" };
type ChipButtonProps = ChipBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { as: "button" };
export type ChipProps = ChipSpanProps | ChipButtonProps;

export function Chip({ variant = "neutral", className, children, as, ...props }: ChipProps) {
  const classes = cn(baseStyles, chipVariants[variant], className);
  if (as === "button") {
    return (
      <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
  return (
    <span className={classes} {...(props as HTMLAttributes<HTMLSpanElement>)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/ui/chip-variants.test.ts 2>&1 | tail -10
```

Expected: 5/5 pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Chip.tsx tests/ui/chip-variants.test.ts
git commit -m "feat(ui): add Chip component (neutral/info/ai/active + optional button mode)"
```

---

## Task 4: URL-synced filter hook (`useSearchFilters`)

**Files:**
- Create: `hooks/useSearchFilters.ts`
- Create: `tests/hooks/search-filters.test.ts`

Exposes: `query`, `setQuery`, `filters` (Set<string>), `toggleFilter`, `clearFilters`. Persists state to URL (`?q=&filters=a,b,c`). Uses `replaceState` to avoid polluting history.

- [ ] **Step 1: Write failing test for the pure helpers**

Create `tests/hooks/search-filters.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseFiltersParam, serializeFilters } from '@/hooks/useSearchFilters';

describe('parseFiltersParam', () => {
  it('returns empty set for null input', () => {
    expect(parseFiltersParam(null)).toEqual(new Set());
  });

  it('returns empty set for empty string', () => {
    expect(parseFiltersParam('')).toEqual(new Set());
  });

  it('splits csv and trims whitespace', () => {
    expect(parseFiltersParam('a,b , c')).toEqual(new Set(['a', 'b', 'c']));
  });

  it('dedupes duplicate entries', () => {
    expect(parseFiltersParam('a,b,a,c,b')).toEqual(new Set(['a', 'b', 'c']));
  });
});

describe('serializeFilters', () => {
  it('returns null for empty set', () => {
    expect(serializeFilters(new Set())).toBeNull();
  });

  it('joins sorted csv', () => {
    expect(serializeFilters(new Set(['b', 'a', 'c']))).toBe('a,b,c');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run tests/hooks/search-filters.test.ts 2>&1 | tail -10
```

Expected: FAIL (module not found).

- [ ] **Step 3: Create `hooks/useSearchFilters.ts`**

```ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function parseFiltersParam(raw: string | null): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  );
}

export function serializeFilters(filters: Set<string>): string | null {
  if (filters.size === 0) return null;
  return Array.from(filters).sort().join(",");
}

interface UseSearchFiltersResult {
  query: string;
  setQuery: (q: string) => void;
  filters: Set<string>;
  toggleFilter: (f: string) => void;
  clearFilters: () => void;
}

export function useSearchFilters(): UseSearchFiltersResult {
  const [query, setQueryState] = useState<string>("");
  const [filters, setFilters] = useState<Set<string>>(new Set());

  // Hydrate from URL on mount (client-only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQueryState(params.get("q") ?? "");
    setFilters(parseFiltersParam(params.get("filters")));
  }, []);

  const syncUrl = useCallback((q: string, f: Set<string>) => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    const serialized = serializeFilters(f);
    if (serialized) url.searchParams.set("filters", serialized);
    else url.searchParams.delete("filters");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      syncUrl(q, filters);
    },
    [filters, syncUrl]
  );

  const toggleFilter = useCallback(
    (f: string) => {
      setFilters((prev) => {
        const next = new Set(prev);
        if (next.has(f)) next.delete(f);
        else next.add(f);
        syncUrl(query, next);
        return next;
      });
    },
    [query, syncUrl]
  );

  const clearFilters = useCallback(() => {
    setFilters(new Set());
    syncUrl(query, new Set());
  }, [query, syncUrl]);

  return useMemo(
    () => ({ query, setQuery, filters, toggleFilter, clearFilters }),
    [query, setQuery, filters, toggleFilter, clearFilters]
  );
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npx vitest run tests/hooks/search-filters.test.ts 2>&1 | tail -10
```

Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/useSearchFilters.ts tests/hooks/search-filters.test.ts
git commit -m "feat(landing): add URL-synced search + filter hook"
```

---

## Task 5: Locked copy constants

**Files:**
- Create: `components/landing/copy.ts`

Single source of truth for hero / sub / placeholder / empty-state / auth-nudge strings.

- [ ] **Step 1: Create `components/landing/copy.ts`**

```ts
export const LANDING_COPY = {
  hero: {
    heading: (count: number) => `${count.toLocaleString()} live roles.`,
    sub: "updated hourly · paste your resume for personal match scores",
  },
  topbar: {
    login: "log in",
    signup: "sign up free",
    logout: "log out",
  },
  search: {
    placeholder: "search roles, companies, skills…",
    meta: (matching: number) => `${matching.toLocaleString()} matching · sorted by freshness`,
    sortLabel: "sort: newest ↕",
  },
  filters: {
    internship: "internship",
    newGrad: "new grad",
    remote: "remote",
  },
  emptyFilters: {
    headline: "no matches.",
    suggestHint: "try:",
  },
  ctas: {
    apply: "apply →",
    explore: "explore",
    tailor: "tailor",
  },
  footerHint: (remaining: number) =>
    remaining > 0
      ? `↓ scroll for ${remaining.toLocaleString()} more · or sign up to see personal match scores`
      : "sign up to see personal match scores",
  authNudge: {
    text: "upload resume in 20 seconds to unlock match scores",
    cta: "→",
    dismissLabel: "dismiss",
  },
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/copy.ts
git commit -m "feat(landing): add locked copy constants"
```

---

## Task 6: LandingTopbar component

**Files:**
- Create: `components/landing/LandingTopbar.tsx`

Sticky top bar — terminal dots + `rezoomind` logo (left), auth controls (right). Auth-aware via `useSession`.

- [ ] **Step 1: Create `components/landing/LandingTopbar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { LANDING_COPY } from "./copy";

export function LandingTopbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-7 h-12 sm:h-14 bg-stone-950/80 backdrop-blur border-b border-stone-800">
      <div className="flex items-center gap-3">
        <span aria-hidden className="inline-flex gap-1">
          <span className="w-2 h-2 rounded-full bg-brand-primary" />
          <span className="w-2 h-2 rounded-full border border-orange-800" />
          <span className="w-2 h-2 rounded-full border border-stone-800" />
        </span>
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-[0.08em] text-brand-primary"
        >
          rezoomind
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {session?.user ? (
          <>
            <span className="hidden sm:inline font-mono text-[11px] text-stone-400">
              {session.user.name || session.user.email?.split("@")[0]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              {LANDING_COPY.topbar.logout}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" href="/login">
              {LANDING_COPY.topbar.login}
            </Button>
            <Button variant="primary-solid" size="sm" href="/signup">
              {LANDING_COPY.topbar.signup}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx tsc --noEmit 2>&1 | grep -iE 'LandingTopbar' || echo "Topbar OK"
```

Expected: `Topbar OK`.

- [ ] **Step 3: Commit**

```bash
git add components/landing/LandingTopbar.tsx
git commit -m "feat(landing): add LandingTopbar with auth-aware nav"
```

---

## Task 7: LandingHero component

**Files:**
- Create: `components/landing/LandingHero.tsx`

- [ ] **Step 1: Create `components/landing/LandingHero.tsx`**

```tsx
import { LANDING_COPY } from "./copy";

interface LandingHeroProps {
  liveCount: number;
}

export function LandingHero({ liveCount }: LandingHeroProps) {
  return (
    <section className="px-4 sm:px-7 py-6 sm:py-8" aria-labelledby="hero-heading">
      <h1
        id="hero-heading"
        className="font-mono font-extrabold text-[28px] sm:text-[32px] leading-none tracking-[-0.02em] text-stone-50"
      >
        <span className="text-brand-primary">{liveCount.toLocaleString()}</span>{" "}
        live roles.
      </h1>
      <p className="mt-2 font-mono text-[11px] text-stone-500">
        {LANDING_COPY.hero.sub}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/LandingHero.tsx
git commit -m "feat(landing): add LandingHero"
```

---

## Task 8: SearchBar + Cmd+K

**Files:**
- Create: `components/landing/SearchBar.tsx`

Sticky search input with inline filter chips. Cmd+K / Ctrl+K focuses the input. Consumes `useSearchFilters`.

- [ ] **Step 1: Create `components/landing/SearchBar.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Chip } from "@/components/ui/Chip";
import { LANDING_COPY } from "./copy";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilters: Set<string>;
  onToggleFilter: (f: string) => void;
  topOffsetClass?: string;
}

const FILTER_DEFS = [
  { key: "internship", label: LANDING_COPY.filters.internship },
  { key: "newGrad", label: LANDING_COPY.filters.newGrad },
  { key: "remote", label: LANDING_COPY.filters.remote },
];

export function SearchBar({
  query,
  onQueryChange,
  activeFilters,
  onToggleFilter,
  topOffsetClass = "top-12 sm:top-14",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={`sticky z-20 bg-stone-950/90 backdrop-blur border-b border-stone-800 ${topOffsetClass}`}>
      <div className="px-4 sm:px-7 py-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-brand-primary bg-brand-primary-tint">
          <span className="font-mono text-brand-primary text-sm font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={LANDING_COPY.search.placeholder}
            aria-label="Search roles, companies, or skills"
            className="flex-1 bg-transparent outline-none font-mono text-[11px] text-stone-100 placeholder:text-stone-500"
          />
          <span className="hidden sm:inline font-mono text-[9px] text-stone-500">⌘K</span>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-thin">
          {FILTER_DEFS.map(({ key, label }) => (
            <Chip
              key={key}
              as="button"
              variant={activeFilters.has(key) ? "active" : "neutral"}
              onClick={() => onToggleFilter(key)}
              aria-pressed={activeFilters.has(key)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/SearchBar.tsx
git commit -m "feat(landing): add SearchBar with Cmd+K + filter chips"
```

---

## Task 9: RoleRow component

**Files:**
- Create: `components/landing/RoleRow.tsx`

Renders one role. Props: `role`, `score` (nullable — null hides ring), `onSelect`. Tier CTA derived from score.

- [ ] **Step 1: Create `components/landing/RoleRow.tsx`**

```tsx
"use client";

import { MouseEvent, KeyboardEvent } from "react";
import { Chip } from "@/components/ui/Chip";
import { LANDING_COPY } from "./copy";

export interface LandingRole {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  datePosted: string | null;
  tags: string[];
}

type Tier = "apply" | "explore" | "tailor" | "skip";

function tierForScore(score: number | null): Tier | null {
  if (score === null) return null;
  if (score >= 75) return "apply";
  if (score >= 50) return "explore";
  if (score >= 30) return "tailor";
  return "skip";
}

function ringStyle(tier: Tier, score: number): React.CSSProperties {
  const colorMap: Record<Tier, string> = {
    apply: "rgb(var(--brand-primary))",
    explore: "rgb(var(--brand-info))",
    tailor: "rgb(var(--brand-ai))",
    skip: "#44403c",
  };
  return {
    background: `conic-gradient(${colorMap[tier]} 0 ${score}%, rgba(41,37,36,0.3) ${score}%)`,
  };
}

function formatAge(datePosted: string | null): string {
  if (!datePosted) return "";
  const date = new Date(datePosted);
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

interface RoleRowProps {
  role: LandingRole;
  score: number | null;
  onSelect: (role: LandingRole) => void;
}

export function RoleRow({ role, score, onSelect }: RoleRowProps) {
  const tier = tierForScore(score);

  const handleRowClick = () => onSelect(role);
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(role);
    }
  };

  const stop = (e: MouseEvent) => e.stopPropagation();

  const ctaLabel =
    tier === "apply"
      ? LANDING_COPY.ctas.apply
      : tier === "tailor"
      ? LANDING_COPY.ctas.tailor
      : LANDING_COPY.ctas.explore;
  const ctaVariant =
    tier === "apply"
      ? "border-orange-600 text-orange-400 bg-brand-primary-tint"
      : tier === "tailor"
      ? "border-violet-500/50 text-violet-300 bg-brand-ai-tint"
      : "border-cyan-500/50 text-cyan-300 bg-brand-info-tint";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={handleKey}
      aria-label={`${role.role} at ${role.company}${role.location ? `, ${role.location}` : ""}${score !== null ? `, match score ${score} of 100` : ""}`}
      className="grid grid-cols-[32px_1fr_auto] sm:grid-cols-[32px_1fr_auto_auto] gap-2 sm:gap-3 items-center px-2 py-3 border-t border-stone-800/60 hover:bg-stone-900 transition-colors cursor-pointer"
    >
      {tier ? (
        <div
          aria-hidden
          className="w-8 h-8 rounded-full p-[2.5px] flex items-center justify-center"
          style={ringStyle(tier, score!)}
        >
          <div className="w-[27px] h-[27px] rounded-full bg-stone-950 flex items-center justify-center">
            <span
              className="font-mono text-[10px] font-bold"
              style={{
                color:
                  tier === "apply"
                    ? "#fb923c"
                    : tier === "explore"
                    ? "#22d3ee"
                    : tier === "tailor"
                    ? "#c4b5fd"
                    : "#78716c",
              }}
            >
              {score}
            </span>
          </div>
        </div>
      ) : (
        <div aria-hidden className="w-8 flex justify-center">
          <span className="block w-0.5 h-8 bg-stone-800" />
        </div>
      )}

      <div className="min-w-0">
        <div className="font-mono text-[12px] sm:text-[13px] text-stone-50 truncate">
          {role.role}
        </div>
        <div className="font-mono text-[9px] sm:text-[10px] text-stone-500 truncate">
          {role.company}
          {role.location && <span className="text-stone-700 mx-1">·</span>}
          {role.location}
          {role.datePosted && <span className="text-stone-700 mx-1">·</span>}
          {role.datePosted && formatAge(role.datePosted)}
        </div>
      </div>

      <div className="hidden sm:flex gap-1" onClick={stop}>
        {role.tags.slice(0, 2).map((tag) => (
          <Chip key={tag} variant="info">
            {tag}
          </Chip>
        ))}
      </div>

      <a
        href={role.url ?? "#"}
        target={role.url ? "_blank" : undefined}
        rel={role.url ? "noopener noreferrer" : undefined}
        onClick={stop}
        className={`font-mono text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1 sm:py-1.5 border ${ctaVariant} lowercase tracking-wider`}
      >
        {ctaLabel}
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/RoleRow.tsx
git commit -m "feat(landing): add RoleRow with tier-colored ring + CTA"
```

---

## Task 10: AuthNudgeCard

**Files:**
- Create: `components/landing/AuthNudgeCard.tsx`

Dismissible card for authed-no-resume state. Persists dismissal in `sessionStorage` (not localStorage — reappears next visit).

- [ ] **Step 1: Create `components/landing/AuthNudgeCard.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LANDING_COPY } from "./copy";

const DISMISS_KEY = "landing.authNudge.dismissed";

export function AuthNudgeCard() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  return (
    <div className="mx-4 sm:mx-7 my-2 px-4 py-3 border border-orange-600/50 bg-brand-primary-tint flex items-center justify-between gap-3">
      <Link
        href="/resume"
        className="font-mono text-[11px] text-orange-400 flex items-center gap-2 flex-1"
      >
        {LANDING_COPY.authNudge.text}
        <span aria-hidden>{LANDING_COPY.authNudge.cta}</span>
      </Link>
      <button
        onClick={dismiss}
        aria-label={LANDING_COPY.authNudge.dismissLabel}
        className="font-mono text-stone-500 hover:text-stone-300 text-[11px] px-2"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/AuthNudgeCard.tsx
git commit -m "feat(landing): add dismissible AuthNudgeCard for authed-no-resume"
```

---

## Task 11: RoleList — filtering, skeletons, empty state

**Files:**
- Create: `components/landing/RoleList.tsx`

Pure presentational component. Receives `jobs`, `scores` (null-able Record), `query`, `filters`, `onSelect`. Applies filters, renders rows, handles empty/loading states.

- [ ] **Step 1: Create `components/landing/RoleList.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { LANDING_COPY } from "./copy";
import { RoleRow, type LandingRole } from "./RoleRow";
import { Chip } from "@/components/ui/Chip";

function matchesQuery(role: LandingRole, q: string): boolean {
  if (!q.trim()) return true;
  const haystack = `${role.role} ${role.company} ${role.tags.join(" ")}`.toLowerCase();
  return haystack.includes(q.trim().toLowerCase());
}

function matchesFilters(role: LandingRole, filters: Set<string>): boolean {
  if (filters.size === 0) return true;
  const tagsLc = role.tags.map((t) => t.toLowerCase());
  const titleLc = role.role.toLowerCase();
  const locationLc = (role.location ?? "").toLowerCase();

  for (const f of filters) {
    switch (f) {
      case "internship":
        if (!(tagsLc.includes("internship") || titleLc.includes("intern"))) return false;
        break;
      case "newGrad":
        if (!(tagsLc.includes("new-grad") || titleLc.includes("new grad"))) return false;
        break;
      case "remote":
        if (!(tagsLc.includes("remote") || locationLc.includes("remote"))) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

interface RoleListProps {
  jobs: LandingRole[];
  scores: Record<string, number | null>;
  query: string;
  filters: Set<string>;
  onSelectRole: (role: LandingRole) => void;
  onClearFilter: (filter: string) => void;
  loading?: boolean;
}

export function RoleList({
  jobs,
  scores,
  query,
  filters,
  onSelectRole,
  onClearFilter,
  loading = false,
}: RoleListProps) {
  const filtered = useMemo(
    () => jobs.filter((r) => matchesQuery(r, query) && matchesFilters(r, filters)),
    [jobs, query, filters]
  );

  if (loading) {
    return (
      <div className="px-4 sm:px-7" aria-live="polite">
        <div className="font-mono text-[9px] uppercase tracking-wider text-stone-500 py-2">
          loading…
        </div>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[32px_1fr_auto] gap-3 items-center px-2 py-3 border-t border-stone-800/60"
          >
            <div className="w-8 flex justify-center">
              <span className="block w-0.5 h-8 bg-stone-800" />
            </div>
            <div>
              <div className="h-3 w-48 bg-stone-900 animate-pulse" />
              <div className="mt-1.5 h-2 w-32 bg-stone-900/70 animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-stone-900 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-7">
      <div className="flex justify-between items-center py-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">
          {LANDING_COPY.search.meta(filtered.length)}
        </span>
        <span className="font-mono text-[9px] text-stone-600">
          {LANDING_COPY.search.sortLabel}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div
          className="border-t border-stone-800/60 py-8 text-center"
          aria-live="polite"
        >
          <p className="font-mono text-[12px] text-stone-400 mb-3">
            {LANDING_COPY.emptyFilters.headline}
          </p>
          <p className="font-mono text-[10px] text-stone-500 mb-2">
            {LANDING_COPY.emptyFilters.suggestHint}
          </p>
          <div className="inline-flex gap-1.5 flex-wrap justify-center">
            {Array.from(filters).map((f) => (
              <Chip
                key={f}
                as="button"
                variant="active"
                onClick={() => onClearFilter(f)}
              >
                × remove {f}
              </Chip>
            ))}
            {filters.size === 0 && (
              <span className="font-mono text-[10px] text-stone-600">
                try a different search
              </span>
            )}
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((role) => (
            <RoleRow
              key={role.id}
              role={role}
              score={scores[role.id] ?? null}
              onSelect={onSelectRole}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/RoleList.tsx
git commit -m "feat(landing): add RoleList with client-side filter, skeletons, empty state"
```

---

## Task 12: LandingShell orchestrator

**Files:**
- Create: `components/landing/LandingShell.tsx`

Client component. Owns `useSession`, `useSearchFilters`, detail-pane open state. Composes Topbar + Hero + SearchBar + AuthNudge + RoleList. Hands row-select events to detail pane (stubbed — Phase 3 implements the pane).

- [ ] **Step 1: Create `components/landing/LandingShell.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LandingTopbar } from "./LandingTopbar";
import { LandingHero } from "./LandingHero";
import { SearchBar } from "./SearchBar";
import { AuthNudgeCard } from "./AuthNudgeCard";
import { RoleList } from "./RoleList";
import type { LandingRole } from "./RoleRow";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { LANDING_COPY } from "./copy";

interface LandingShellProps {
  initialJobs: LandingRole[];
  liveCount: number;
}

export function LandingShell({ initialJobs, liveCount }: LandingShellProps) {
  const { data: session, status } = useSession();
  const { query, setQuery, filters, toggleFilter } = useSearchFilters();
  const [, setSelectedRole] = useState<LandingRole | null>(null);
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [hasResume, setHasResume] = useState(false);
  const [scoresLoading, setScoresLoading] = useState(false);

  const isAuthed = status === "authenticated" && !!session?.user;

  // Fetch resume presence + batch scores when authed. Failures are silent —
  // grayscale rails are the acceptable fallback state.
  useEffect(() => {
    if (!isAuthed) return;
    let cancelled = false;

    setScoresLoading(true);
    (async () => {
      try {
        const resumeRes = await fetch("/api/resume/data", { credentials: "include" });
        const resumeJson = resumeRes.ok ? await resumeRes.json() : null;
        const resumeText = resumeJson?.data?.resume_text ?? null;
        if (cancelled) return;
        setHasResume(!!resumeText);
        if (!resumeText) {
          setScoresLoading(false);
          return;
        }

        const jobIds = initialJobs.map((j) => j.id);
        const batchRes = await fetch("/api/matches/batch-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobIds }),
        });
        if (!batchRes.ok) throw new Error("batch-score failed");
        const batchJson = await batchRes.json();
        if (cancelled) return;

        // Accept either { scores: Record<id, number> } or an array of { id, score }.
        const next: Record<string, number | null> = {};
        if (batchJson?.scores && typeof batchJson.scores === "object") {
          for (const [id, s] of Object.entries(batchJson.scores)) {
            next[id] = typeof s === "number" ? s : null;
          }
        } else if (Array.isArray(batchJson?.data)) {
          for (const row of batchJson.data) {
            if (row?.id && typeof row.score === "number") next[row.id] = row.score;
          }
        }
        setScores(next);
      } catch {
        // Silent — rails render for all rows.
      } finally {
        if (!cancelled) setScoresLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, initialJobs]);

  const showAuthNudge = isAuthed && !hasResume;

  const handleSelect = (role: LandingRole) => {
    setSelectedRole(role);
    // Phase 3 will open DetailPanel here. For now, open URL in new tab if available.
    if (role.url) {
      window.open(role.url, "_blank", "noopener,noreferrer");
    }
  };

  const remaining = Math.max(liveCount - initialJobs.length, 0);

  return (
    <div className="min-h-dvh bg-stone-950 text-stone-100">
      <LandingTopbar />
      <LandingHero liveCount={liveCount} />
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        activeFilters={filters}
        onToggleFilter={toggleFilter}
      />
      {showAuthNudge && <AuthNudgeCard />}
      <RoleList
        jobs={initialJobs}
        scores={scores}
        query={query}
        filters={filters}
        onSelectRole={handleSelect}
        onClearFilter={toggleFilter}
        loading={scoresLoading && initialJobs.length === 0}
      />
      {!isAuthed && (
        <p className="mt-4 mb-8 text-center font-mono text-[10px] text-stone-500 px-4">
          {LANDING_COPY.footerHint(remaining)}
        </p>
      )}
    </div>
  );
}
```

**Note on score-fetching shape:** the `/api/matches/batch-score` endpoint response shape may be `{ scores: { [jobId]: number } }` or `{ data: [{ id, score }] }` depending on how it was implemented. The code above accepts both shapes. If neither applies when you read the actual endpoint in `app/api/matches/batch-score/route.ts`, adjust the parser in the `useEffect` to match the real shape. If the endpoint is missing entirely, keep the `try { ... } catch {}` — the UI degrades gracefully to grayscale rails.

- [ ] **Step 2: Commit**

```bash
git add components/landing/LandingShell.tsx
git commit -m "feat(landing): add LandingShell client orchestrator"
```

---

## Task 13: Rewrite `app/page.tsx` as thin server component

**Files:**
- Modify: `app/page.tsx`

Retires HomeClientShell, SummaryStrip, MainInsightCard, MarketBanner, InsightCards from the `/` route. Fetches only what the new shell needs: jobs[] + liveCount.

- [ ] **Step 1: Read the current `app/page.tsx` for reference**

```bash
cat app/page.tsx
```

Note the imports — most will be deleted. Note how `getDashboardStats()` and `fetchGitHubJobs()` are used.

- [ ] **Step 2: Replace `app/page.tsx` entirely**

```tsx
import { getDashboardStats } from "@/lib/dashboard";
import { fetchGitHubJobs } from "@/lib/fetch-github-jobs";
import { LandingShell } from "@/components/landing/LandingShell";
import type { LandingRole } from "@/components/landing/RoleRow";

export const revalidate = 3600;

export default async function HomePage() {
  const [dbStats, githubData] = await Promise.all([
    getDashboardStats().catch(() => null),
    fetchGitHubJobs().catch(() => ({
      jobs: [],
      counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 },
    })),
  ]);

  const rawJobs = githubData.jobs.slice(0, 60);

  const initialJobs: LandingRole[] = rawJobs.map((j) => ({
    id: j.sourceId,
    role: j.role,
    company: j.company,
    location: j.location,
    url: j.url,
    datePosted: j.datePosted instanceof Date ? j.datePosted.toISOString() : j.datePosted ?? null,
    tags: j.tags ?? [],
  }));

  const liveCount =
    (dbStats && "totalLive" in dbStats && typeof dbStats.totalLive === "number"
      ? dbStats.totalLive
      : githubData.counts?.total) ?? initialJobs.length;

  return <LandingShell initialJobs={initialJobs} liveCount={liveCount} />;
}
```

**Note:** Resume presence and match scores are fetched client-side in `LandingShell` via `useEffect`. The server component does not need to know about auth state beyond what's inherent in the request; `useSession` handles it on the client.

- [ ] **Step 3: Type-check**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx tsc --noEmit 2>&1 | grep -E 'app/page\.tsx|LandingShell|LandingRole' || echo "page.tsx OK"
```

Expected: `page.tsx OK`. (If `dbStats.totalLive` doesn't exist on the type, fall back to `githubData.counts.total` — already handled.)

- [ ] **Step 4: Run full test suite — no regressions**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): replace homepage with feed-is-the-hero LandingShell"
```

---

## Task 14: Update CLAUDE.md "Protected Landing Page Files"

**Files:**
- Modify: `CLAUDE.md`

The old protection list is now stale — `HomeClientShell` isn't used on `/` anymore.

- [ ] **Step 1: Replace the "Protected Landing Page Files" section**

Find the "### Protected Landing Page Files" table in `CLAUDE.md`. Replace the entire section (from the `### Protected Landing Page Files` heading through the end of the table, before the next `###`) with:

```markdown
### Protected Landing Page Files

After 2026-04-17 redesign (feed-is-the-hero). Spec: `docs/superpowers/specs/2026-04-17-phase1-landing-design.md`.

| File | What it controls | Rule |
|------|-----------------|------|
| `app/page.tsx` | Homepage server component | DO NOT add heavy computations here; keep thin. Hero count + initial jobs only. |
| `components/landing/LandingShell.tsx` | Client orchestrator | DO NOT add features not in the Phase 1 spec without explicit approval |
| `components/landing/LandingTopbar.tsx` | Sticky topbar + auth-aware nav | Keep logo+dots placement; don't add nav links without approval |
| `components/landing/LandingHero.tsx` | Hero count + one-line sub | Headline must stay under 12 words |
| `components/landing/SearchBar.tsx` | Sticky search + filter chips + Cmd+K | DO NOT add a third filter row or change the prompt `>` cursor style |
| `components/landing/RoleRow.tsx` | Single role row | Tier-color logic is load-bearing — don't change the score thresholds (75/50/30) without approval |
| `components/landing/RoleList.tsx` | Filter + skeleton + empty state | Filtering is client-side on the loaded array (Phase 3 will change this) |
| `components/landing/copy.ts` | Locked copy strings | Any copy change goes through this file, not inline |

**Retired from `/` (kept for `(app)` layout):** `HomeClientShell.tsx`, `SummaryStrip.tsx`, `MainInsightCard.tsx`, `MarketBanner.tsx`, `InsightCards.tsx`, `JobsTable.tsx`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude.md): update protected landing files after Phase 1 redesign"
```

---

## Task 15: Final verification

**Files:** none (manual + automated checks)

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass. Test count should be **baseline (56 from main) + 7 button + 5 chip + 6 hook = 74 passing**. (Note: some of these were added in Phase 0.5 Tasks 1–2 already; the `75 → 74` delta reflects the drift-guard test NOT being added yet — that remains a paused Phase 0.5 Task 6.)

- [ ] **Step 2: Type-check all new files**

```bash
npx tsc --noEmit 2>&1 | grep -E 'components/landing|components/ui/Chip|components/ui/Button|hooks/useSearchFilters|app/page\.tsx' || echo "Phase 1 files OK"
```

Expected: `Phase 1 files OK`.

- [ ] **Step 3: Start dev server and spot-check in browser**

```bash
npm run dev &
sleep 5
```

Then open `http://localhost:3000/` in a browser. Verify:

1. **Above the fold** — hero number visible, search bar visible, at least 3 role rows visible on a 1280×800 window. Copy word count ≤ 30.
2. **Cmd+K** focuses the search input from anywhere.
3. **Filter chip toggles** — clicking "internship" filters the list; URL updates to `?filters=internship`.
4. **Mobile** — shrink browser to 375px wide. Rows stack; filter strip scrolls horizontally; still see first row above the fold.
5. **No `HomeClientShell`/`SummaryStrip`/`MainInsightCard`/`MarketBanner`/`InsightCards` imports visible** — check Network tab or view source, none of these component files should appear in the chunk list.

Kill dev server when done:

```bash
pkill -f "next dev" 2>/dev/null || true
```

- [ ] **Step 4: Check token-drift baseline didn't regress**

```bash
echo "text-[9px]: $(grep -rE 'text-\[9px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "text-[11px]: $(grep -rE 'text-\[11px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-[10px]: $(grep -rE 'rounded-\[10px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
```

Compare against the baseline in `docs/superpowers/drift-audit-2026-04-16.md` (22 / 94 / 38). Counts should be EQUAL OR LOWER — the new landing components use `text-[11px]` in some places (limited, intentional) but don't introduce any new `rounded-[10px]` or `rounded-md` usages. If counts increased, review the new files and replace offenders with token classes.

- [ ] **Step 5: Final commit (if any stragglers)**

```bash
git status --short
# If clean, skip. Otherwise:
git add -A
git commit -m "chore(landing): Phase 1 verification passed"
```

- [ ] **Step 6: Do NOT push**

This plan does not push. The executing-plans / subagent-driven-development skill's finishing step will decide merge strategy (to main, to PR, etc.).

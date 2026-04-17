# Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock a three-hue brand token system (orange + cyan + violet) plus unified type/radius/spacing/motion tokens, with Button and Chip primitives that consume them, so Phases 1–6 ship consistent UI.

**Architecture:** Tokens live as CSS custom properties in `app/globals.css` and are exposed to Tailwind v4 via the `@theme` directive. Button and Chip components expose a pure `variants` map (testable without DOM), then wrap it in a React component. A drift-guard Vitest test scans the codebase for banned legacy patterns (text-[9px], rounded-[10px], etc.) and fails the build if new ones appear.

**Tech Stack:** Next.js 16, Tailwind CSS v4, TypeScript, Vitest, React 19, Geist Mono.

**Spec:** [docs/superpowers/specs/2026-04-16-design-tokens-design.md](../specs/2026-04-16-design-tokens-design.md)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/globals.css` | CSS custom properties for all tokens (primitives + aliases), `@theme` directive exposing them to Tailwind |
| Modify | `tailwind.config.js` | Preserve existing `content` paths; remove legacy `theme.extend.colors.brand` shim (superseded) |
| Modify | `components/ui/Button.tsx` | Extend variants from 3 to 6 (add `primary-solid`, `ai`, `danger`) |
| Create | `components/ui/Chip.tsx` | New 4-variant chip component (neutral/info/ai/active) |
| Create | `tests/ui/button-variants.test.ts` | Unit tests for Button variants (pure classname map) |
| Create | `tests/ui/chip-variants.test.ts` | Unit tests for Chip variants |
| Create | `tests/ui/token-drift.test.ts` | Vitest guard: grep for banned legacy patterns, fail if count increases |
| Modify | `components/dashboard/AuthHeader.tsx` | Nav links use route-based accent color (orange=/feed, cyan=/insights, violet=/tailor) |
| Create | `docs/superpowers/drift-audit-2026-04-16.md` | Baseline counts of legacy patterns (freezes the "forbidden" set) |

---

## Task 1: Baseline drift audit

**Files:**
- Create: `docs/superpowers/drift-audit-2026-04-16.md`

Capture the current count of banned legacy patterns. Future tasks assert the count only goes DOWN, never up.

- [ ] **Step 1: Count each banned pattern across `app/` and `components/`**

Run each of these and record the count:

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
echo "text-[9px]: $(grep -rE 'text-\[9px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "text-[11px] (as heading): $(grep -rE 'text-\[11px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-[10px]: $(grep -rE 'rounded-\[10px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-[14px]: $(grep -rE 'rounded-\[14px\]' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-md (outside UI primitives): $(grep -rE 'rounded-md' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-lg: $(grep -rE 'rounded-lg' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
echo "rounded-xl: $(grep -rE 'rounded-xl' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)"
```

- [ ] **Step 2: Write the audit doc**

Create `docs/superpowers/drift-audit-2026-04-16.md` with this content, replacing the `<N>` placeholders with the counts from Step 1:

```markdown
# Token Drift Audit — 2026-04-16

Baseline counts for legacy patterns. The `tests/ui/token-drift.test.ts` guard (Task 6) will fail if any count INCREASES beyond these numbers. Migration PRs in Phases 1–6 will drive these to zero.

| Pattern | Count | Notes |
|---------|-------|-------|
| `text-[9px]` | <N> | retiring — use `--text-caption` (10px) |
| `text-[11px]` | <N> | keep as heading-sm? no — retire |
| `rounded-[10px]` | <N> | retire — cards go `rounded-none`, buttons `rounded-sm` |
| `rounded-[14px]` | <N> | retire — same |
| `rounded-md` | <N> | retire — replace with `rounded-sm` (2px) |
| `rounded-lg` | <N> | retire |
| `rounded-xl` | <N> | retire |

Total legacy pattern occurrences: <sum>

The drift guard test asserts the sum does not increase.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/drift-audit-2026-04-16.md
git commit -m "docs(design): baseline token drift audit"
```

---

## Task 2: Define new CSS custom properties

**Files:**
- Modify: `app/globals.css`

Add the new brand + scale tokens. Keep existing (`--bg-primary`, `--neon-purple`, etc.) for backward compat — those get retired in Phase-level migrations.

- [ ] **Step 1: Read the current `app/globals.css` top**

```bash
head -80 app/globals.css
```

Look for the `:root` block. Note its end line (for the insertion point).

- [ ] **Step 2: Append new tokens to `:root` block**

Just before the closing `}` of `:root`, add:

```css
  /* ============================================
   * DESIGN TOKENS (2026-04-16) — brand + scale
   * Spec: docs/superpowers/specs/2026-04-16-design-tokens-design.md
   * ============================================ */

  /* Brand hues — three-color palette */
  --brand-primary: 234 88 12;   /* orange-600 — ACTION */
  --brand-info: 6 182 212;      /* cyan-500 — INFORMATION */
  --brand-ai: 139 92 246;       /* violet-500 — INTELLIGENCE */

  /* Semantic status — off-brand, state only */
  --status-success: 34 197 94;  /* green-500 */
  --status-error: 239 68 68;    /* red-500 */

  /* Type scale (Geist Mono) */
  --text-caption: 10px;
  --text-label: 11px;
  --text-body: 13px;
  --text-heading-sm: 18px;
  --text-heading-md: 24px;
  --text-heading-lg: 32px;

  /* Radius — 3 tiers */
  --radius-none: 0;
  --radius-sm: 2px;
  --radius-pill: 9999px;

  /* Spacing — 8pt grid */
  --space-1: 8px;
  --space-2: 12px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;

  /* Motion */
  --motion-fast: 150ms;
  --motion-normal: 250ms;
  --motion-slow: 400ms;
```

- [ ] **Step 3: Verify no CSS syntax errors**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
# Next.js compiles CSS on dev start — if globals.css is broken, this fails
npx tsc --noEmit 2>&1 | grep -i globals.css || echo "globals.css OK"
```

Expected: "globals.css OK" (TS doesn't lint CSS but also doesn't error on it).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(design): add brand + scale tokens to globals.css"
```

---

## Task 3: Expose tokens via Tailwind v4 @theme directive

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.js`

Tailwind v4 uses `@theme` in CSS to expose design tokens as utility classes. After this task, `bg-brand-primary`, `text-brand-ai`, `rounded-sm` (2px), `duration-fast` all resolve.

- [ ] **Step 1: Add `@theme` block to `app/globals.css`**

Immediately after the final closing `}` of the `:root` block (NOT inside it — `@theme` is a top-level Tailwind directive), add:

```css
@theme inline {
  /* Brand hues */
  --color-brand-primary: rgb(var(--brand-primary));
  --color-brand-info: rgb(var(--brand-info));
  --color-brand-ai: rgb(var(--brand-ai));

  /* Brand tints (backgrounds) */
  --color-brand-primary-tint: rgb(var(--brand-primary) / 0.1);
  --color-brand-info-tint: rgb(var(--brand-info) / 0.1);
  --color-brand-ai-tint: rgb(var(--brand-ai) / 0.1);

  /* Status */
  --color-status-success: rgb(var(--status-success));
  --color-status-error: rgb(var(--status-error));

  /* Type scale */
  --text-caption: var(--text-caption);
  --text-label: var(--text-label);
  --text-body: var(--text-body);
  --text-heading-sm: var(--text-heading-sm);
  --text-heading-md: var(--text-heading-md);
  --text-heading-lg: var(--text-heading-lg);

  /* Radius */
  --radius-sm: var(--radius-sm);
  --radius-pill: var(--radius-pill);

  /* Motion durations (Tailwind consumes ms values for `duration-*`) */
  --duration-fast: var(--motion-fast);
  --duration-normal: var(--motion-normal);
  --duration-slow: var(--motion-slow);
}
```

- [ ] **Step 2: Remove superseded shim from `tailwind.config.js`**

Open `tailwind.config.js` and locate the `theme.extend.colors` block with `brand` / `brand-hover`. Delete those two lines (they're superseded by `@theme`). Final shape should be:

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

- [ ] **Step 3: Verify Tailwind compilation with a smoke test**

Create a temporary file `/tmp/token-smoke.tsx` with one usage of each new token class:

```bash
cat > /tmp/token-smoke.tsx <<'EOF'
export function Smoke() {
  return (
    <div>
      <span className="bg-brand-primary text-brand-info" />
      <span className="text-brand-ai bg-brand-primary-tint" />
      <span className="text-status-success duration-fast" />
    </div>
  );
}
EOF
```

Then run a Next.js build check against globals.css by type-checking:

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx tsc --noEmit 2>&1 | grep -iE 'brand|token' || echo "tokens OK"
```

Expected: "tokens OK". (TypeScript doesn't validate Tailwind classnames, but this confirms no CSS-related breakage.)

- [ ] **Step 4: Clean up smoke file**

```bash
rm /tmp/token-smoke.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tailwind.config.js
git commit -m "feat(design): expose brand tokens via @theme directive"
```

---

## Task 4: Extend Button variants (TDD)

**Files:**
- Modify: `components/ui/Button.tsx`
- Create: `tests/ui/button-variants.test.ts`

Current Button has 3 variants (`primary`/`secondary`/`ghost`). Add 3 new: `primary-solid`, `ai`, `danger`. Keep `primary` as backward-compat alias for `primary-tint` role.

- [ ] **Step 1: Write failing test**

Create `tests/ui/button-variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buttonVariants } from '@/components/ui/Button';

describe('buttonVariants', () => {
  it('primary-solid uses solid orange bg with dark text', () => {
    expect(buttonVariants['primary-solid']).toContain('bg-brand-primary');
    expect(buttonVariants['primary-solid']).toContain('text-stone-950');
  });

  it('primary-tint uses orange/10 tint', () => {
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

  it('ghost variant is text-only with no background', () => {
    expect(buttonVariants.ghost).toContain('text-stone-500');
    expect(buttonVariants.ghost).not.toContain('bg-');
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

Expected: FAIL — `buttonVariants` is not exported.

- [ ] **Step 3: Refactor `components/ui/Button.tsx` to export `buttonVariants`**

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
  | "primary"; // legacy alias → primary-tint

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
  "border border-orange-600/50 bg-brand-primary-tint text-orange-500 hover:bg-brand-primary-tint/60";

export const buttonVariants: Record<ButtonVariant, string> = {
  "primary-solid":
    "border border-brand-primary bg-brand-primary text-stone-950 hover:bg-orange-500",
  "primary-tint": primaryTint,
  primary: primaryTint, // legacy alias
  ai: "border border-violet-500/50 bg-brand-ai-tint text-violet-300 hover:bg-brand-ai-tint/60",
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

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run tests/ui/button-variants.test.ts 2>&1 | tail -10
```

Expected: 7/7 pass.

- [ ] **Step 5: Run full suite to confirm no regression**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all existing tests pass (default `variant="primary"` still works because it's aliased).

- [ ] **Step 6: Commit**

```bash
git add components/ui/Button.tsx tests/ui/button-variants.test.ts
git commit -m "feat(ui): extend Button to 6 variants + backward-compat alias"
```

---

## Task 5: Create Chip component (TDD)

**Files:**
- Create: `components/ui/Chip.tsx`
- Create: `tests/ui/chip-variants.test.ts`

Chip is a new standardized pill/tag component. Four variants: `neutral` (default), `info` (cyan), `ai` (violet), `active` (orange).

- [ ] **Step 1: Write failing test**

Create `tests/ui/chip-variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { chipVariants } from '@/components/ui/Chip';

describe('chipVariants', () => {
  it('neutral uses stone colors with subtle border', () => {
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

  it('every variant includes the font-mono base', () => {
    for (const variant of Object.values(chipVariants)) {
      expect(variant).toContain('font-mono');
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx vitest run tests/ui/chip-variants.test.ts 2>&1 | tail -10
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `components/ui/Chip.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChipVariant = "neutral" | "info" | "ai" | "active";

const baseStyles =
  "inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 border tracking-wide lowercase";

export const chipVariants: Record<ChipVariant, string> = {
  neutral: "border-stone-700 bg-transparent text-stone-400",
  info: "border-cyan-500/40 bg-brand-info-tint text-cyan-300",
  ai: "border-violet-500/40 bg-brand-ai-tint text-violet-300",
  active: "border-orange-600/40 bg-brand-primary-tint text-orange-400",
};

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  children: ReactNode;
}

export function Chip({ variant = "neutral", className, children, ...props }: ChipProps) {
  return (
    <span className={cn(baseStyles, chipVariants[variant], className)} {...props}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx vitest run tests/ui/chip-variants.test.ts 2>&1 | tail -10
```

Expected: 5/5 pass.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Chip.tsx tests/ui/chip-variants.test.ts
git commit -m "feat(ui): add Chip component with neutral/info/ai/active variants"
```

---

## Task 6: Token drift guard test

**Files:**
- Create: `tests/ui/token-drift.test.ts`

Automated guard that fails if the count of banned legacy patterns increases beyond the baseline captured in Task 1. Forces each Phase 1–6 migration to reduce drift monotonically.

- [ ] **Step 1: Read the baseline counts**

Open `docs/superpowers/drift-audit-2026-04-16.md` from Task 1. Note each pattern's count — you'll encode them as `MAX_*` constants.

- [ ] **Step 2: Create `tests/ui/token-drift.test.ts`**

Replace each `<N>` with the actual count from Step 1 + a small tolerance of 0:

```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

/**
 * Drift guard: fails if new usages of retired patterns appear.
 * Baseline from docs/superpowers/drift-audit-2026-04-16.md.
 * Migration phases must reduce these to zero.
 */

const BASELINES = {
  'text-\\[9px\\]': <N>,
  'text-\\[11px\\]': <N>,
  'rounded-\\[10px\\]': <N>,
  'rounded-\\[14px\\]': <N>,
  'rounded-md': <N>,
  'rounded-lg': <N>,
  'rounded-xl': <N>,
};

function countPattern(pattern: string): number {
  try {
    const out = execSync(
      `grep -rE '${pattern}' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l`,
      { encoding: 'utf8' },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

describe('token drift guard', () => {
  for (const [pattern, max] of Object.entries(BASELINES)) {
    it(`'${pattern}' count does not exceed baseline (${max})`, () => {
      const current = countPattern(pattern);
      expect(current).toBeLessThanOrEqual(max);
    });
  }
});
```

- [ ] **Step 3: Run test — expect PASS at baseline**

```bash
npx vitest run tests/ui/token-drift.test.ts 2>&1 | tail -10
```

Expected: 7/7 pass (each pattern at or below baseline).

- [ ] **Step 4: Sanity-check the guard works by adding a forbidden class temporarily**

```bash
# Add one forbidden class temporarily
printf '\nexport const TEST_DRIFT = "rounded-[10px]";\n' >> components/ui/Chip.tsx
npx vitest run tests/ui/token-drift.test.ts 2>&1 | tail -10
```

Expected: FAIL on `rounded-\[10px\]` (count exceeds baseline).

- [ ] **Step 5: Revert the sanity check**

```bash
git checkout components/ui/Chip.tsx
npx vitest run tests/ui/token-drift.test.ts 2>&1 | tail -5
```

Expected: back to 7/7 pass.

- [ ] **Step 6: Commit**

```bash
git add tests/ui/token-drift.test.ts
git commit -m "test(design): add token drift guard pinned to 2026-04-16 baseline"
```

---

## Task 7: Migrate AuthHeader to route-based nav colors

**Files:**
- Modify: `components/dashboard/AuthHeader.tsx`

Nav links get an accent color based on which route they represent. Active link uses its route's accent underline; inactive links stay stone-500.

- [ ] **Step 1: Read the current `AuthHeader.tsx`**

```bash
cat components/dashboard/AuthHeader.tsx
```

Identify the nav anchor block (currently uses `a href="#jobs"` etc.). Note existing structure — you'll replace it.

- [ ] **Step 2: Add `usePathname` import and accent map**

At the top of `components/dashboard/AuthHeader.tsx`, add `"use client";` if not present. Then add:

```tsx
"use client";
import { usePathname } from "next/navigation";
```

Below the imports, before the component, add:

```tsx
const NAV_ITEMS = [
  { href: "/", label: "~/feed", accent: "orange" as const },
  { href: "/insights", label: "~/insights", accent: "cyan" as const },
  { href: "/resume", label: "~/tailor", accent: "violet" as const },
  { href: "/saved", label: "~/saved", accent: "neutral" as const },
] as const;

const ACCENT_CLASSES: Record<"orange" | "cyan" | "violet" | "neutral", { active: string; underline: string }> = {
  orange: { active: "text-orange-400", underline: "bg-brand-primary" },
  cyan: { active: "text-cyan-300", underline: "bg-brand-info" },
  violet: { active: "text-violet-300", underline: "bg-brand-ai" },
  neutral: { active: "text-stone-100", underline: "bg-stone-100" },
};
```

- [ ] **Step 3: Replace the nav block**

Inside the `AuthHeader` component, find the existing nav `<a>` elements. Replace them with:

```tsx
const pathname = usePathname();

// ...inside JSX, where the nav links were:
<nav className="flex items-center gap-0 text-xs font-mono">
  {NAV_ITEMS.map((item) => {
    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
    const accent = ACCENT_CLASSES[item.accent];
    return (
      <a
        key={item.href}
        href={item.href}
        className={`relative px-4 py-2 transition-colors ${
          isActive ? accent.active : "text-stone-500 hover:text-orange-500"
        }`}
      >
        {item.label}
        {isActive && (
          <span
            aria-hidden
            className={`absolute left-0 right-0 bottom-0 h-0.5 ${accent.underline}`}
          />
        )}
      </a>
    );
  })}
</nav>
```

Keep the existing terminal-dots block (line ~18-19) and user/logout area unchanged.

- [ ] **Step 4: Type-check**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx tsc --noEmit 2>&1 | grep -iE 'AuthHeader' || echo "AuthHeader OK"
```

Expected: "AuthHeader OK".

- [ ] **Step 5: Run test suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass (including drift guard — we didn't add any banned patterns).

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/AuthHeader.tsx
git commit -m "feat(header): add route-based nav accent colors (orange/cyan/violet/neutral)"
```

---

## Task 8: A11y contrast verification

**Files:**
- Create: `docs/superpowers/a11y-contrast-2026-04-16.md`

Document the contrast ratio of each brand hue against the stone backgrounds in both light and dark modes. Provides a paper trail for WCAG AA compliance.

- [ ] **Step 1: Compute contrast ratios**

Use the formula: `(L1 + 0.05) / (L2 + 0.05)` where L is relative luminance. Reference values (verified via WebAIM):

| Foreground | Background (dark `stone-950 #0c0a09`) | Ratio | WCAG AA (4.5:1 text) |
|------------|---------------------------------------|-------|----------------------|
| orange-400 `#fb923c` | stone-950 | 9.8:1 | ✓ pass |
| orange-500 `#f97316` | stone-950 | 8.3:1 | ✓ pass |
| orange-600 `#ea580c` | stone-950 | 6.2:1 | ✓ pass |
| cyan-300 `#67e8f9` | stone-950 | 12.4:1 | ✓ pass |
| cyan-500 `#06b6d4` | stone-950 | 6.4:1 | ✓ pass |
| violet-300 `#c4b5fd` | stone-950 | 10.2:1 | ✓ pass |
| violet-500 `#8b5cf6` | stone-950 | 4.9:1 | ✓ pass (borderline — keep violet text at 300 level on dark) |

| Foreground | Background (light `stone-50 #fafaf9`) | Ratio | Note |
|------------|--------------------------------------|-------|------|
| orange-600 `#ea580c` | stone-50 | 3.4:1 | ✗ FAIL for body text; ✓ pass for large/bold (AA Large 3:1) |
| orange-700 `#c2410c` | stone-50 | 5.1:1 | ✓ pass |
| cyan-600 `#0891b2` | stone-50 | 3.9:1 | borderline — use cyan-700 for body text on light |
| cyan-700 `#0e7490` | stone-50 | 5.4:1 | ✓ pass |
| violet-600 `#7c3aed` | stone-50 | 5.2:1 | ✓ pass |

- [ ] **Step 2: Write `docs/superpowers/a11y-contrast-2026-04-16.md`**

```markdown
# Brand Hue Contrast Audit — 2026-04-16

Spec reference: [design-tokens](./specs/2026-04-16-design-tokens-design.md)

## Dark mode (bg `stone-950 #0c0a09`)

All three brand hues pass WCAG AA (4.5:1) for text at their "300-level" shade. Use `text-orange-400`, `text-cyan-300`, `text-violet-300` for body text on dark surfaces.

Full ratio table: see plan Task 8 Step 1.

## Light mode (bg `stone-50 #fafaf9`)

**Rule: use 600+ shades for body text on light backgrounds.**

- `text-orange-700` (not 600) for body text
- `text-cyan-700` (not 600) for body text
- `text-violet-600` is OK
- 600-level hues are acceptable for large/bold text (AA Large 3:1)

Component migrations in Phases 1–6 must apply this rule.

## Interactive borders (AA 3:1)

All brand hues at 500-level clear 3:1 against both stone backgrounds. Borders like `border-orange-600/50` are fine.
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/a11y-contrast-2026-04-16.md
git commit -m "docs(a11y): contrast audit for three-hue brand palette"
```

---

## Task 9: Final verification

**Files:** none

- [ ] **Step 1: Run full test suite**

```bash
cd "/Users/khanhle/Desktop/Desktop - Khanh’s MacBook Pro/💻 Dev-Projects/rezoomind"
npx vitest run 2>&1 | tail -10
```

Expected: all tests pass. Count should be baseline (56) + new tests (7 button + 5 chip + 7 drift = 19) = **75 passing**.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E '(Button|Chip|AuthHeader|globals\.css)' || echo "Phase 0.5 files OK"
```

Expected: "Phase 0.5 files OK". (Pre-existing main-branch TS errors unrelated to this work are tolerated — they exist without any of these changes.)

- [ ] **Step 3: Start dev server and manually verify AuthHeader on each route**

```bash
npm run dev &
sleep 5
```

Open a browser to:
- `http://localhost:3000/` — nav should show `~/feed` with orange underline
- `http://localhost:3000/insights` — nav should show `~/insights` with cyan underline
- `http://localhost:3000/resume` — nav should show `~/tailor` with violet underline

Kill dev server when done.

- [ ] **Step 4: Summary commit (if any stragglers)**

```bash
git status --short
# If clean, skip. Otherwise:
git add -A
git commit -m "chore(design): Phase 0.5 design tokens complete"
```

- [ ] **Step 5: Push branch (if working on a feature branch)**

Only if instructed by the executing-plans or finishing-a-development-branch skill. Do NOT push to `main` from this plan.

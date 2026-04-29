# Contributing to Rezoomind

Thanks for the interest. Rezoomind is a Next.js 15 app built around an
AI-assisted, multi-role workflow. This guide covers how to get the repo
running and what's expected of every change.

## 1. Local setup

```bash
# 1. Clone and enter
git clone https://github.com/kaydenletk/rezoomind.git
cd rezoomind

# 2. Install Node 20 + npm deps
nvm use 20   # or: corepack use npm@latest
npm install

# 3. Pull env from Vercel (or copy .env.example)
vercel env pull .env.local
# otherwise: cp .env.example .env.local  and fill in secrets

# 4. Generate Prisma client + run the app
npx prisma generate
npm run dev
```

Open http://localhost:3000. See [README.md](README.md) for what each route does.

## 2. The AI team workflow (gstack)

This repo **requires gstack** for AI-assisted work. The enforcement hook in
`.claude/settings.json` blocks Skill invocations when gstack is missing.

One-time install:

```bash
git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup --team
```

Then restart your AI tool. gstack exposes specialist slash commands mapped to a
linear product workflow:

| Stage    | Commands |
|----------|----------|
| Think    | `/office-hours`, `/autoplan` |
| Plan     | `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/plan-devex-review`, `/design-consultation` |
| Build    | `/design-html`, `/design-shotgun`, `/pair-agent` |
| Review   | `/review`, `/design-review`, `/devex-review`, `/cso` (security), `/codex` (cross-model) |
| Test     | `/qa`, `/qa-only`, `/benchmark` |
| Ship     | `/ship`, `/land-and-deploy`, `/canary`, `/document-release` |
| Reflect  | `/retro`, `/learn` |
| Safety   | `/careful`, `/guard`, `/freeze`, `/unfreeze` |
| Browse   | `/browse` — **required** for any web browsing; never use `mcp__claude-in-chrome__*` |

Use the right stage for the work. Don't improvise.

## 3. Branches & commits

- Work on a feature branch off `main`. Never push directly to `main`.
- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Commit format (conventional commits):
  ```
  <type>: <description>

  <optional body>
  ```
  Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.
- One logical change per commit. Keep diffs reviewable.

## 4. Quality gates (local, before PR)

```bash
npm run lint       # eslint
npx tsc --noEmit   # typecheck
npm run build      # prisma generate + next build
npm test           # vitest (if you touched tested code)
```

CI (`.github/workflows/ci.yml`) re-runs all four on every PR against `main`.
A PR must be green before merge.

## 5. Pull requests

- Use the template in `.github/PULL_REQUEST_TEMPLATE.md`.
- Include **before/after screenshots** at 320, 768, 1440 widths for any UI change, in both **light and dark** themes.
- Run gstack `/review` on the diff and paste notable findings into the PR description.
- If the change touches security-sensitive code (auth, user input, DB queries), also run `/cso`.

## 6. Protected surfaces

Several files are load-bearing and **must not** be edited without prior approval:

- Landing page: `app/page.tsx`, `components/landing/**`
- Smart feed: `components/smart-feed/**`, `hooks/useFeedKeyboard.ts`, `lib/feed-derivations.ts`
- Infra: `.github/**`, `.claude/**`, `prisma/schema.prisma`, `vercel.ts`

See the "Protected Landing Page Files" and "Protected Smart-Feed Files" tables
in the private `CLAUDE.md` for the full list and why each file is protected.

## 7. Design system

Rezoomind follows the **Terminal Control Panel** aesthetic. No pure black
backgrounds — use the `bg-surface`, `bg-surface-raised`, `bg-surface-sunken`
tokens. Mono font (Geist Mono) for headings/labels, sharp 1px borders, orange
brand color. New pages must support both light and dark themes.

## 8. Reporting issues

- **Bugs** → use `.github/ISSUE_TEMPLATE/bug_report.md`
- **Features** → use `.github/ISSUE_TEMPLATE/feature_request.md`
- **Security vulnerabilities** → do NOT open a public issue. See [SECURITY.md](SECURITY.md).

## 9. Code of Conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

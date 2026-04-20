# Security Policy

## Supported versions

Only the `main` branch and the currently-deployed production build at
https://rezoomind.vercel.app receive security fixes.

## Reporting a vulnerability

**Do not open a public GitHub issue.** Report privately through one of:

1. GitHub Security Advisories — https://github.com/kaydenletk/rezoomind/security/advisories/new
2. Email — khanhleetk@gmail.com with subject `[SECURITY] Rezoomind: <short description>`

Please include:

- A clear description of the issue
- Reproduction steps (URL, payload, account role if relevant)
- Impact assessment (what an attacker can do / access)
- Any proof-of-concept code or screenshots
- Your name / handle if you'd like credit

You'll get an initial response within **72 hours**.

## Scope

In scope:

- The production app at `rezoomind.vercel.app`
- The source code in this repository
- Auth flows (NextAuth credentials + Google OAuth)
- The AI endpoints under `app/api/` (quick-tailor, chat, resume analyze, matches)
- Database access patterns (Prisma → Neon Postgres)

Out of scope:

- Third-party services (Vercel, Neon, Resend, Google OAuth) — report those to their respective providers
- Social-engineering or physical attacks
- Rate limiting of unauthenticated endpoints without a clear exploit path
- Missing security headers on non-sensitive routes (we welcome fixes, but these are hardening, not vulnerabilities)

## Our process

1. Acknowledge receipt within 72 hours.
2. Confirm/reproduce the issue.
3. Assess severity (CRITICAL / HIGH / MEDIUM / LOW).
4. Develop and test a fix.
5. Deploy to production.
6. Publish a security advisory once the fix is live, crediting the reporter (unless they prefer to stay anonymous).

For internal security review we use the gstack `/cso` (Chief Security Officer)
workflow on the relevant diff before shipping.

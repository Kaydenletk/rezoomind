# Rezoomind

1. Create or edit `.env.local` at the repo root.
2. Edit with nano: `nano .env.local`.
3. Paste `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, and `EMAIL_SIGNING_SECRET`.
4. Optional: add `APP_URL` (ex: `http://localhost:3000`) for email links.
5. Add `JOBS_SYNC_SECRET` and `DIGEST_SECRET` for admin endpoints.
6. Save in nano: Ctrl+O, then Enter.
7. Exit nano: Ctrl+X.
8. Optional: open in VS Code with `code .env.local`.
9. Install deps: `npm install`.
10. Generate Prisma client: `npm run prisma:generate`.
11. Run migrations: `npm run prisma:migrate`.

### Jobs sync
- Trigger manually with:
  `curl -X POST http://localhost:3000/api/jobs/sync -H "x-sync-secret: $JOBS_SYNC_SECRET"`

### Weekly digest
- Trigger manually with:
  `curl -X POST http://localhost:3000/api/digest -H "x-digest-secret: $DIGEST_SECRET"`

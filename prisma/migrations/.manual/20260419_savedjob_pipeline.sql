-- Manual migration — DO NOT run via `prisma migrate deploy`.
-- Apply when ready to move pipeline tracking (status / appliedAt / interviewAt / notes)
-- from client-side localStorage into the database.
--
-- How to apply (one-off):
--   1. Update `prisma/schema.prisma` SavedJob model with the four new fields + index
--      (see bottom of this file for the schema block to paste in).
--   2. Run one of:
--        npx prisma db push              # no migration record, fast, safe for solo repo
--        npx prisma migrate dev --name add_savedjob_pipeline
--      Either choice executes the SQL below against DATABASE_URL.
--   3. Regenerate client:
--        npx prisma generate
--   4. Update the code in hooks/useJobPipeline.ts + app/api/jobs/saved/route.ts
--      to read/write from DB instead of localStorage. See useJobPipeline for the
--      shape the server must return.
--
-- The columns are additive with defaults, so this migration is zero-downtime.

ALTER TABLE "SavedJob"
  ADD COLUMN IF NOT EXISTS "status"      TEXT        NOT NULL DEFAULT 'saved',
  ADD COLUMN IF NOT EXISTS "appliedAt"   TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "interviewAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "notes"       TEXT        NULL;

CREATE INDEX IF NOT EXISTS "SavedJob_userId_status_idx" ON "SavedJob" ("userId", "status");

-- =============================================================================
-- Schema block to paste into prisma/schema.prisma (replace the existing
-- SavedJob model, keeping the generator/datasource blocks above untouched):
-- =============================================================================
--
-- model SavedJob {
--   id          String   @id @default(cuid())
--   userId      String
--   jobSourceId String
--   company     String
--   role        String
--   location    String?
--   url         String?
--   status      String    @default("saved")
--   appliedAt   DateTime? @db.Timestamptz
--   interviewAt DateTime? @db.Timestamptz
--   notes       String?   @db.Text
--   created_at  DateTime  @default(now()) @db.Timestamptz
--   updated_at  DateTime  @default(now()) @updatedAt @db.Timestamptz
--
--   user User @relation(fields: [userId], references: [id], onDelete: Cascade)
--
--   @@unique([userId, jobSourceId])
--   @@index([userId])
--   @@index([userId, status])
-- }

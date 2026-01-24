-- Migration: Add subscriber preferences and SentJobAlert table
-- Run this in Supabase SQL Editor

-- Add new columns to Subscriber table (if they don't exist)
ALTER TABLE "Subscriber"
ADD COLUMN IF NOT EXISTS "interestedRoles" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "preferredLocations" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "keywords" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "weeklyLimit" INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS "lastEmailSent" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "preferencesToken" TEXT;

-- Create unique index on preferencesToken (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_preferencesToken_key" ON "Subscriber"("preferencesToken");

-- Create SentJobAlert table (if not exists)
CREATE TABLE IF NOT EXISTS "SentJobAlert" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentJobAlert_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on subscriberId + jobId
CREATE UNIQUE INDEX IF NOT EXISTS "SentJobAlert_subscriberId_jobId_key" ON "SentJobAlert"("subscriberId", "jobId");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "SentJobAlert_subscriberId_idx" ON "SentJobAlert"("subscriberId");
CREATE INDEX IF NOT EXISTS "SentJobAlert_jobId_idx" ON "SentJobAlert"("jobId");

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SentJobAlert_subscriberId_fkey') THEN
        ALTER TABLE "SentJobAlert" ADD CONSTRAINT "SentJobAlert_subscriberId_fkey"
        FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SentJobAlert_jobId_fkey') THEN
        ALTER TABLE "SentJobAlert" ADD CONSTRAINT "SentJobAlert_jobId_fkey"
        FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

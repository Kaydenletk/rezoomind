-- AlterEnum
CREATE TYPE "SubscriberStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

ALTER TABLE "Subscriber" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscriber"
  ALTER COLUMN "status" TYPE "SubscriberStatus_new"
  USING (
    CASE
      WHEN "status" = 'active' THEN 'ACTIVE'::"SubscriberStatus_new"
      WHEN "status" = 'unsubscribed' THEN 'UNSUBSCRIBED'::"SubscriberStatus_new"
      ELSE 'PENDING'::"SubscriberStatus_new"
    END
  );
ALTER TABLE "Subscriber" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "SubscriberStatus";
ALTER TYPE "SubscriberStatus_new" RENAME TO "SubscriberStatus";

-- AlterTable
ALTER TABLE "Subscriber"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "unsubscribeAt" TIMESTAMP(3),
  ADD COLUMN "confirmTokenHash" TEXT;

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT,
    "url" TEXT,
    "datePosted" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceId_key" ON "JobPosting"("sourceId");

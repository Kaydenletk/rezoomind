-- AlterEnum
CREATE TYPE "SubscriberStatus_new" AS ENUM ('pending', 'active', 'unsubscribed');

ALTER TABLE "Subscriber" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscriber"
  ALTER COLUMN "status" TYPE "SubscriberStatus_new"
  USING (
    CASE
      WHEN "status" = 'ACTIVE' THEN 'active'::"SubscriberStatus_new"
      WHEN "status" = 'UNSUBSCRIBED' THEN 'unsubscribed'::"SubscriberStatus_new"
      WHEN "status" = 'PENDING' THEN 'pending'::"SubscriberStatus_new"
      WHEN "status" = 'active' THEN 'active'::"SubscriberStatus_new"
      WHEN "status" = 'unsubscribed' THEN 'unsubscribed'::"SubscriberStatus_new"
      ELSE 'pending'::"SubscriberStatus_new"
    END
  );
ALTER TABLE "Subscriber" ALTER COLUMN "status" SET DEFAULT 'pending';

DROP TYPE "SubscriberStatus";
ALTER TYPE "SubscriberStatus_new" RENAME TO "SubscriberStatus";

-- AlterTable
ALTER TABLE "Subscriber"
  ADD COLUMN "interests" JSONB,
  ADD COLUMN "confirmTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "unsubscribeTokenHash" TEXT;

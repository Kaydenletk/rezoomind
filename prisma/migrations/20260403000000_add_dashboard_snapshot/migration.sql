-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "usa_internships" INTEGER NOT NULL DEFAULT 0,
    "usa_new_grad" INTEGER NOT NULL DEFAULT 0,
    "intl_internships" INTEGER NOT NULL DEFAULT 0,
    "intl_new_grad" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSnapshot_date_key" ON "DashboardSnapshot"("date");

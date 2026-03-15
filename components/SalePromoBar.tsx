"use client";

import Link from "next/link";

import { useHolidayPromo } from "@/hooks/useHolidayPromo";

export function SalePromoBar() {
  const { promo, countdown } = useHolidayPromo();

  if (!promo || !countdown) return null;

  return (
    <div className="border-b border-sky-200/70 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-2 text-center text-xs font-medium sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <p className="tracking-[0.12em] uppercase">
          {promo.isActive
            ? `${promo.holidayName} sale live: ${promo.discountPercent}% off Pro today`
            : `${promo.holidayName} sale starts soon: ${promo.discountPercent}% off Pro`}
        </p>
        <div className="flex items-center justify-center gap-3 text-[11px] font-semibold sm:justify-end">
          <span className="rounded-full bg-white/15 px-3 py-1">
            {promo.isActive ? "Ends in" : "Starts in"} {countdown}
          </span>
          <Link
            href="/#pricing"
            className="rounded-full bg-white px-3 py-1 text-[rgb(15,23,42)] transition hover:bg-slate-100"
          >
            View sale
          </Link>
        </div>
      </div>
    </div>
  );
}

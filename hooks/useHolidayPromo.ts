"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatCountdown,
  getHolidayPromoState,
  getDiscountedPrice,
} from "@/lib/sales/holiday-promo";

export function useHolidayPromo() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const promo = useMemo(() => getHolidayPromoState(now), [now]);

  return {
    promo,
    countdown: promo ? formatCountdown(promo.countdownTarget, now) : null,
    getDiscountedPrice,
  };
}

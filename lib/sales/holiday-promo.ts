import Holidays from "date-holidays";

export const HOLIDAY_PROMO_DISCOUNT = 0.2;
export const HOLIDAY_PROMO_PERCENT = Math.round(HOLIDAY_PROMO_DISCOUNT * 100);

export type HolidayPromoState = {
  holidayName: string;
  startsAt: string;
  endsAt: string;
  countdownTarget: string;
  isActive: boolean;
  discountPercent: number;
};

const holidays = new Holidays("US");

export function getHolidayPromoState(now: Date = new Date()): HolidayPromoState | null {
  const years = [now.getFullYear(), now.getFullYear() + 1];
  const publicHolidays = years
    .flatMap((year) => holidays.getHolidays(year))
    .filter(
      (holiday) =>
        holiday.type === "public" &&
        holiday.start instanceof Date &&
        holiday.end instanceof Date
    )
    .sort(
      (left, right) =>
        left.start.getTime() - right.start.getTime()
    );

  const activeHoliday = publicHolidays.find(
    (holiday) => now >= holiday.start && now < holiday.end
  );

  if (activeHoliday) {
    return {
      holidayName: activeHoliday.name,
      startsAt: activeHoliday.start.toISOString(),
      endsAt: activeHoliday.end.toISOString(),
      countdownTarget: activeHoliday.end.toISOString(),
      isActive: true,
      discountPercent: HOLIDAY_PROMO_PERCENT,
    };
  }

  const nextHoliday = publicHolidays.find((holiday) => holiday.start > now);
  if (!nextHoliday) return null;

  return {
    holidayName: nextHoliday.name,
    startsAt: nextHoliday.start.toISOString(),
    endsAt: nextHoliday.end.toISOString(),
    countdownTarget: nextHoliday.start.toISOString(),
    isActive: false,
    discountPercent: HOLIDAY_PROMO_PERCENT,
  };
}

export function getDiscountedPrice(price: number): number {
  return Number((price * (1 - HOLIDAY_PROMO_DISCOUNT)).toFixed(2));
}

export function formatCountdown(targetIso: string, now: Date = new Date()): string {
  const target = new Date(targetIso);
  const remainingMs = target.getTime() - now.getTime();

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

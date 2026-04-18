import { describe, it, expect } from "vitest";
import { computeVelocity } from "@/lib/dashboard";

function snap(date: string, total: number) {
  return {
    date,
    usaInternships: total,
    usaNewGrad: 0,
    intlInternships: 0,
    intlNewGrad: 0,
  };
}

describe("computeVelocity", () => {
  it("returns zeros for an empty trend", () => {
    const out = computeVelocity([]);
    expect(out.newThisWeek).toBe(0);
    expect(out.deltaVsLastWeek).toBe(0);
    expect(out.daily).toEqual([]);
  });

  it("computes positive daily deltas from cumulative totals", () => {
    const trend = [
      snap("2026-04-11", 100),
      snap("2026-04-12", 110),
      snap("2026-04-13", 125),
      snap("2026-04-14", 125),
      snap("2026-04-15", 130),
      snap("2026-04-16", 140),
      snap("2026-04-17", 155),
      snap("2026-04-18", 170),
    ];
    const out = computeVelocity(trend);
    expect(out.daily).toHaveLength(7);
    const counts = out.daily.map((d) => d.count);
    expect(counts).toEqual([10, 15, 0, 5, 10, 15, 15]);
    expect(out.newThisWeek).toBe(70);
  });

  it("treats total drops (removals) as zero, never negative", () => {
    const trend = [
      snap("2026-04-17", 100),
      snap("2026-04-18", 80),
    ];
    const out = computeVelocity(trend);
    expect(out.daily[0].count).toBe(0);
    expect(out.newThisWeek).toBe(0);
  });

  it("computes deltaVsLastWeek from prev 7 vs last 7", () => {
    const trend: ReturnType<typeof snap>[] = [];
    // prev week: +2 per day = +14 total
    for (let i = 0; i < 8; i++) trend.push(snap(`2026-04-${String(i + 1).padStart(2, "0")}`, i * 2));
    // this week: +5 per day starting from day 9 = +35 total
    for (let i = 8; i < 15; i++) trend.push(snap(`2026-04-${String(i + 1).padStart(2, "0")}`, 14 + (i - 7) * 5));
    const out = computeVelocity(trend);
    expect(out.newThisWeek).toBe(35);
    expect(out.deltaVsLastWeek).toBe(35 - 14);
  });
});

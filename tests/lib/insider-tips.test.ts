import { describe, it, expect } from "vitest";
import {
  INSIDER_TIPS,
  dayOfYearUTC,
  getTipForDate,
} from "@/lib/insider-tips";

describe("INSIDER_TIPS data", () => {
  it("has at least 14 tips", () => {
    expect(INSIDER_TIPS.length).toBeGreaterThanOrEqual(14);
  });

  it("has unique ids", () => {
    const ids = INSIDER_TIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every tip links to a valid playbook slug", () => {
    const validSlugs = new Set([
      "before-you-apply",
      "the-timing-game",
      "hidden-gems",
    ]);
    for (const tip of INSIDER_TIPS) {
      expect(validSlugs.has(tip.playbookSlug)).toBe(true);
    }
  });

  it("covers all three playbook slugs so users see variety", () => {
    const slugs = new Set(INSIDER_TIPS.map((t) => t.playbookSlug));
    expect(slugs.size).toBe(3);
  });
});

describe("dayOfYearUTC", () => {
  it("returns 1 for Jan 1 UTC", () => {
    expect(dayOfYearUTC(new Date("2026-01-01T12:00:00Z"))).toBe(1);
  });

  it("returns 32 for Feb 1 UTC", () => {
    expect(dayOfYearUTC(new Date("2026-02-01T00:00:00Z"))).toBe(32);
  });

  it("returns the same value across hours within one UTC day", () => {
    const a = dayOfYearUTC(new Date("2026-04-18T00:00:00Z"));
    const b = dayOfYearUTC(new Date("2026-04-18T23:59:59Z"));
    expect(a).toBe(b);
  });

  it("increments at UTC midnight, not local midnight", () => {
    const a = dayOfYearUTC(new Date("2026-04-18T23:59:00Z"));
    const b = dayOfYearUTC(new Date("2026-04-19T00:00:01Z"));
    expect(b - a).toBe(1);
  });
});

describe("getTipForDate", () => {
  it("returns the same tip for the same UTC day (refresh cannot cherry-pick)", () => {
    const a = getTipForDate(new Date("2026-04-18T05:00:00Z"));
    const b = getTipForDate(new Date("2026-04-18T23:00:00Z"));
    expect(a.id).toBe(b.id);
  });

  it("returns different tips across consecutive days", () => {
    const a = getTipForDate(new Date("2026-04-18T12:00:00Z"));
    const b = getTipForDate(new Date("2026-04-19T12:00:00Z"));
    expect(a.id).not.toBe(b.id);
  });

  it("rotates through all tips within length days", () => {
    const seen = new Set<string>();
    for (let i = 0; i < INSIDER_TIPS.length; i++) {
      const d = new Date("2026-04-18T12:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      seen.add(getTipForDate(d).id);
    }
    expect(seen.size).toBe(INSIDER_TIPS.length);
  });

  it("throws when given an empty tips array", () => {
    expect(() => getTipForDate(new Date(), [])).toThrow();
  });
});

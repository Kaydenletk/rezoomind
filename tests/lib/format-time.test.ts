import { describe, it, expect } from "vitest";
import { formatTimeAgo } from "@/lib/format-time";

describe("formatTimeAgo", () => {
  const now = new Date("2026-04-18T12:00:00Z");

  it("returns 'just now' for diff under 1 minute", () => {
    const t = new Date("2026-04-18T11:59:31Z");
    expect(formatTimeAgo(t, now)).toBe("just now");
  });

  it("returns minutes for diff under 1 hour", () => {
    const t = new Date("2026-04-18T11:45:00Z");
    expect(formatTimeAgo(t, now)).toBe("15m ago");
  });

  it("returns hours for diff under 1 day", () => {
    const t = new Date("2026-04-18T06:00:00Z");
    expect(formatTimeAgo(t, now)).toBe("6h ago");
  });

  it("returns days for diff under 1 week", () => {
    const t = new Date("2026-04-15T12:00:00Z");
    expect(formatTimeAgo(t, now)).toBe("3d ago");
  });

  it("returns weeks for diff 1-3 weeks", () => {
    const t = new Date("2026-04-04T12:00:00Z");
    expect(formatTimeAgo(t, now)).toBe("2w ago");
  });

  it("returns months for diff over 4 weeks", () => {
    const t = new Date("2026-02-18T12:00:00Z");
    expect(formatTimeAgo(t, now)).toBe("2mo ago");
  });

  it("accepts ISO strings", () => {
    expect(formatTimeAgo("2026-04-18T11:00:00Z", now)).toBe("1h ago");
  });

  it("returns 'recently' for invalid dates", () => {
    expect(formatTimeAgo("not-a-date", now)).toBe("recently");
  });

  it("clamps negative diffs to 'just now' (no future dates)", () => {
    const future = new Date("2026-04-18T12:30:00Z");
    expect(formatTimeAgo(future, now)).toBe("just now");
  });
});

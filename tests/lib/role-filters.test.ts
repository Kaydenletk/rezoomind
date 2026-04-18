import { describe, it, expect } from "vitest";
import { matchesFilters, ageHours } from "@/lib/role-filters";
import type { LandingRole } from "@/components/landing/RoleRow";

function mkRole(overrides: Partial<LandingRole> = {}): LandingRole {
  return {
    id: "test-1",
    role: "Software Engineer Intern",
    company: "Acme",
    location: "San Francisco, CA",
    url: null,
    datePosted: null,
    tags: [],
    category: "swe",
    ...overrides,
  };
}

describe("matchesFilters — no filters", () => {
  it("returns true when filter set is empty", () => {
    expect(matchesFilters(mkRole(), new Set())).toBe(true);
  });
});

describe("matchesFilters — category group", () => {
  it("matches when role.category is in the selected set", () => {
    expect(matchesFilters(mkRole({ category: "swe" }), new Set(["swe"]))).toBe(true);
  });
  it("rejects when role.category is not in the selected set", () => {
    expect(matchesFilters(mkRole({ category: "pm" }), new Set(["swe"]))).toBe(false);
  });
  it("OR across categories within the same group", () => {
    expect(matchesFilters(mkRole({ category: "pm" }), new Set(["swe", "pm"]))).toBe(true);
  });
});

describe("matchesFilters — level group", () => {
  it("matches internship from title", () => {
    const r = mkRole({ role: "Software Engineer Intern", tags: [] });
    expect(matchesFilters(r, new Set(["internship"]))).toBe(true);
  });
  it("matches new grad from title", () => {
    const r = mkRole({ role: "New Grad Software Engineer", tags: [] });
    expect(matchesFilters(r, new Set(["newGrad"]))).toBe(true);
  });
  it("rejects level mismatch", () => {
    const r = mkRole({ role: "Senior Engineer", tags: [] });
    expect(matchesFilters(r, new Set(["internship"]))).toBe(false);
  });
});

describe("matchesFilters — location group", () => {
  it("matches remote when role tagged remote", () => {
    const r = mkRole({ location: "Remote", tags: ["remote"] });
    expect(matchesFilters(r, new Set(["remote"]))).toBe(true);
  });
  it("matches usa from state abbreviation", () => {
    const r = mkRole({ location: "Austin, TX" });
    expect(matchesFilters(r, new Set(["usa"]))).toBe(true);
  });
  it("matches usa from full 'USA' string", () => {
    const r = mkRole({ location: "Seattle, USA" });
    expect(matchesFilters(r, new Set(["usa"]))).toBe(true);
  });
  it("matches intl when not USA and not empty", () => {
    const r = mkRole({ location: "London, UK" });
    expect(matchesFilters(r, new Set(["intl"]))).toBe(true);
  });
  it("rejects intl when role is remote", () => {
    const r = mkRole({ location: "Remote in Canada", tags: ["remote"] });
    expect(matchesFilters(r, new Set(["intl"]))).toBe(false);
  });
});

describe("matchesFilters — fresh group", () => {
  const now = new Date("2026-04-18T12:00:00Z");
  it("matches fresh24h when posted within 24h", () => {
    const r = mkRole({ datePosted: "2026-04-18T06:00:00Z" });
    expect(matchesFilters(r, new Set(["fresh24h"]), now)).toBe(true);
  });
  it("rejects fresh24h when posted 3 days ago", () => {
    const r = mkRole({ datePosted: "2026-04-15T12:00:00Z" });
    expect(matchesFilters(r, new Set(["fresh24h"]), now)).toBe(false);
  });
  it("matches freshWeek within 7 days", () => {
    const r = mkRole({ datePosted: "2026-04-13T12:00:00Z" });
    expect(matchesFilters(r, new Set(["freshWeek"]), now)).toBe(true);
  });
  it("rejects freshWeek beyond 7 days", () => {
    const r = mkRole({ datePosted: "2026-04-10T12:00:00Z" });
    expect(matchesFilters(r, new Set(["freshWeek"]), now)).toBe(false);
  });
  it("rejects fresh filter when datePosted is null", () => {
    const r = mkRole({ datePosted: null });
    expect(matchesFilters(r, new Set(["fresh24h"]), now)).toBe(false);
  });
});

describe("matchesFilters — AND across groups", () => {
  const now = new Date("2026-04-18T12:00:00Z");
  it("requires all groups to match", () => {
    const r = mkRole({
      category: "swe",
      role: "Software Engineer Intern",
      location: "New York, NY",
      datePosted: "2026-04-18T06:00:00Z",
    });
    // all four groups picked — every one must match
    const filters = new Set(["swe", "internship", "usa", "fresh24h"]);
    expect(matchesFilters(r, filters, now)).toBe(true);
  });

  it("fails when one group out of four doesn't match", () => {
    const r = mkRole({
      category: "pm", // PM, not SWE
      role: "Product Intern",
      location: "New York, NY",
      datePosted: "2026-04-18T06:00:00Z",
    });
    const filters = new Set(["swe", "internship", "usa", "fresh24h"]);
    expect(matchesFilters(r, filters, now)).toBe(false);
  });
});

describe("ageHours", () => {
  it("returns null for null input", () => {
    expect(ageHours(null)).toBe(null);
  });
  it("returns null for unparseable strings like '0d'", () => {
    expect(ageHours("0d")).toBe(null);
  });
  it("computes hours from ISO timestamp", () => {
    const now = new Date("2026-04-18T12:00:00Z");
    expect(ageHours("2026-04-18T06:00:00Z", now)).toBeCloseTo(6, 1);
  });
});

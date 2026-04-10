import { describe, it, expect } from "vitest";
import { ndcgAtK, precisionAtK } from "@/lib/matching/evaluation";

describe("ndcgAtK", () => {
  it("perfect ranking returns 1.0", () => {
    // Sorted descending = ideal
    const result = ndcgAtK([2, 2, 1, 1, 0], 5);
    expect(result).toBeCloseTo(1.0, 5);
  });

  it("worst ranking (reversed) returns value less than 1", () => {
    const worst = ndcgAtK([0, 1, 1, 2, 2], 5);
    const best = ndcgAtK([2, 2, 1, 1, 0], 5);
    expect(worst).toBeLessThan(best);
  });

  it("all zeros returns 0", () => {
    expect(ndcgAtK([0, 0, 0], 3)).toBe(0);
  });

  it("returns value in [0, 1]", () => {
    const r = ndcgAtK([2, 0, 1, 2, 0], 5);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });

  it("k larger than array length uses available results", () => {
    const r = ndcgAtK([2, 1], 10);
    expect(r).toBeCloseTo(1.0, 5);
  });
});

describe("precisionAtK", () => {
  it("all relevant at top-3 returns 1.0", () => {
    expect(precisionAtK([2, 1, 2, 0, 0], 3)).toBeCloseTo(1.0, 5);
  });

  it("no relevant at top-3 returns 0", () => {
    expect(precisionAtK([0, 0, 0, 2, 2], 3)).toBe(0);
  });

  it("mixed returns correct fraction", () => {
    // 2 relevant out of 4
    expect(precisionAtK([2, 0, 1, 0], 4)).toBeCloseTo(0.5, 5);
  });

  it("custom threshold works", () => {
    // Only relevance=2 counts
    expect(precisionAtK([2, 1, 1, 0], 4, 2)).toBeCloseTo(0.25, 5);
  });
});

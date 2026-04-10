import { describe, it, expect } from "vitest";
import { ndcgAtK, precisionAtK, EVALUATION_DATASET } from "@/lib/matching/evaluation";

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

  it("EVALUATION_DATASET has 8 entries with valid ground truth labels", () => {
    expect(EVALUATION_DATASET).toHaveLength(8);
    for (const entry of EVALUATION_DATASET) {
      expect(entry.groundTruth).toBeGreaterThanOrEqual(0);
      expect(entry.groundTruth).toBeLessThanOrEqual(2);
      expect(typeof entry.label).toBe("string");
    }
    // A good system should rank the 3 highly-relevant jobs first (relevance=2)
    // Extract ground truths in ideal order and verify NDCG = 1.0
    const idealOrder = [...EVALUATION_DATASET]
      .sort((a, b) => b.groundTruth - a.groundTruth)
      .map((e) => e.groundTruth);
    expect(ndcgAtK(idealOrder, 5)).toBeCloseTo(1.0, 5);
  });

  it("k smaller than array length evaluates only top-k with ideal from full pool", () => {
    // Array [0, 2, 1] with k=2:
    // DCG: pos0=0 contribution=0, pos1=2 contribution=(4-1)/log2(3)=1.893
    // IDCG: ideal=[2,1][0:2] → (4-1)/log2(2)+(2-1)/log2(3) = 3+0.631=3.631
    // NDCG = 1.893/3.631 ≈ 0.521
    const result = ndcgAtK([0, 2, 1], 2);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
    expect(result).toBeCloseTo(0.521, 2);
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

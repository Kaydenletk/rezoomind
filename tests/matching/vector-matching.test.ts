import { describe, it, expect, vi } from "vitest";

// Mock @/lib/ai/embeddings so vitest doesn't try to import the Google AI SDK
vi.mock("@/lib/ai/embeddings", () => ({
  cosineSimilarity: (a: number[], b: number[]): number => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  },
}));

import { computeVectorMatchScore } from "@/lib/matching/vector-matching";

function makeVec(dim: number, value: number): number[] {
  return new Array(dim).fill(value);
}

describe("computeVectorMatchScore", () => {
  it("returns all scores in 0–100 range", () => {
    const resume = makeVec(768, 0.5);
    const job = makeVec(768, 0.5);
    const result = computeVectorMatchScore(
      resume,
      job,
      "Python React developer",
      "React frontend developer"
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.skillMatch).toBeGreaterThanOrEqual(0);
    expect(result.skillMatch).toBeLessThanOrEqual(100);
    expect(result.experienceMatch).toBeGreaterThanOrEqual(0);
    expect(result.experienceMatch).toBeLessThanOrEqual(100);
  });

  it("identical embeddings score higher than orthogonal embeddings", () => {
    const resumeText = "Python developer with React experience";
    const jobText = "Python React developer needed";

    const same = makeVec(768, 0.7);
    const resultSame = computeVectorMatchScore(same, same, resumeText, jobText);

    // Orthogonal: alternating 1/0 vs 0/1 — dot product = 0
    const a = Array.from({ length: 768 }, (_, i) => (i % 2 === 0 ? 1 : 0));
    const b = Array.from({ length: 768 }, (_, i) => (i % 2 === 0 ? 0 : 1));
    const resultOrthogonal = computeVectorMatchScore(a, b, resumeText, jobText);

    expect(resultSame.skillMatch).toBeGreaterThan(resultOrthogonal.skillMatch);
  });

  it("overlapping skills produce equal or higher skill match than no overlap", () => {
    const same = makeVec(768, 0.7);
    const noOverlap = computeVectorMatchScore(
      same,
      same,
      "Java spring boot backend developer",
      "Python machine learning data scientist"
    );
    const withOverlap = computeVectorMatchScore(
      same,
      same,
      "Python react typescript frontend developer",
      "Python react typescript engineer needed"
    );
    expect(withOverlap.skillMatch).toBeGreaterThanOrEqual(noOverlap.skillMatch);
  });

  it("returns 100 experienceMatch when resume years meet requirement", () => {
    const vec = makeVec(768, 0.5);
    const result = computeVectorMatchScore(
      vec,
      vec,
      "I have 5 years of experience in software development",
      "Requires 3+ years of experience"
    );
    expect(result.experienceMatch).toBe(100);
  });

  it("returns partial experienceMatch when resume years fall short", () => {
    const vec = makeVec(768, 0.5);
    const result = computeVectorMatchScore(
      vec,
      vec,
      "I have 1 year of experience",
      "Requires 5+ years of experience"
    );
    expect(result.experienceMatch).toBeLessThan(100);
    expect(result.experienceMatch).toBeGreaterThan(0);
  });

  it("returns a reasons array", () => {
    const vec = makeVec(768, 0.5);
    const result = computeVectorMatchScore(
      vec,
      vec,
      "Python React typescript developer",
      "Python React developer needed"
    );
    expect(Array.isArray(result.reasons)).toBe(true);
  });
});

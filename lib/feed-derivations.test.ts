import { describe, expect, it } from "vitest";
import { deriveAIReason, deriveStatus } from "./feed-derivations";
import type { SmartFeedJob } from "@/components/smart-feed/types";

const baseJob: SmartFeedJob = {
  id: "j1",
  company: "Acme",
  role: "SWE Intern",
  location: "SF",
  url: null,
  datePosted: null,
};

describe("deriveStatus", () => {
  it("returns 'applied' when id is in appliedIds even if also saved", () => {
    expect(deriveStatus(baseJob, new Set(["j1"]), new Set(["j1"]))).toBe("applied");
  });

  it("returns 'saved' when id is in savedIds only", () => {
    expect(deriveStatus(baseJob, new Set(["j1"]), new Set())).toBe("saved");
  });

  it("returns 'new' when posted in the last 24 hours", () => {
    const job = { ...baseJob, datePosted: new Date("2026-04-19T10:00:00Z").toISOString() };
    const now = new Date("2026-04-19T20:00:00Z").getTime();
    expect(deriveStatus(job, new Set(), new Set(), now)).toBe("new");
  });

  it("returns null for a posting older than 24h and not saved/applied", () => {
    const job = { ...baseJob, datePosted: new Date("2026-04-17T10:00:00Z").toISOString() };
    const now = new Date("2026-04-19T20:00:00Z").getTime();
    expect(deriveStatus(job, new Set(), new Set(), now)).toBeNull();
  });

  it("returns null when datePosted is invalid", () => {
    const job = { ...baseJob, datePosted: "May 02" };
    expect(deriveStatus(job, new Set(), new Set())).toBeNull();
  });
});

describe("deriveAIReason", () => {
  it("returns null when match is null", () => {
    expect(deriveAIReason(null)).toBeNull();
  });

  it("returns null when matchScore is null", () => {
    expect(deriveAIReason({ matchScore: null })).toBeNull();
  });

  it("renders a Strong fit for score >= 75 with matched skills", () => {
    const out = deriveAIReason({
      matchScore: 90,
      matchReasons: ["Python", "SQL", "React", "AWS"],
      missingSkills: ["Kafka"],
    });
    expect(out).toBe("Strong fit — Python, SQL, React match; missing: Kafka");
  });

  it("renders a Partial fit for score 50-74", () => {
    const out = deriveAIReason({
      matchScore: 60,
      matchReasons: ["Python", "SQL"],
      missingSkills: ["Kafka", "Spark"],
    });
    expect(out).toBe("Partial fit — Python, SQL match; gap: Kafka, Spark");
  });

  it("renders a Weak fit for score < 50", () => {
    const out = deriveAIReason({
      matchScore: 30,
      matchReasons: ["Git"],
      missingSkills: [],
    });
    expect(out).toBe("Weak fit — only 1 overlap");
  });

  it("returns null for Strong fit with no matched skills", () => {
    const out = deriveAIReason({ matchScore: 80, matchReasons: [], missingSkills: ["X"] });
    expect(out).toBeNull();
  });
});

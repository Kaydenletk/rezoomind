import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

/**
 * Drift guard: fails if new usages of retired patterns appear.
 * Baseline rebased 2026-04-20. Migration phases must only reduce each count —
 * never raise a baseline to paper over new drift.
 */

const BASELINES: Record<string, number> = {
  "text-\\[9px\\]": 29,
  "text-\\[11px\\]": 93,
  "rounded-\\[10px\\]": 31,
  "rounded-\\[14px\\]": 1,
  "rounded-md": 14,
  "rounded-lg": 5,
  "rounded-xl": 4,
};

function countPattern(pattern: string): number {
  try {
    const out = execSync(
      `grep -rE '${pattern}' app components --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l`,
      { encoding: "utf8" },
    );
    return parseInt(out.trim(), 10);
  } catch {
    return 0;
  }
}

describe("token drift guard", () => {
  for (const [pattern, max] of Object.entries(BASELINES)) {
    it(`'${pattern}' count does not exceed baseline (${max})`, () => {
      const current = countPattern(pattern);
      expect(current).toBeLessThanOrEqual(max);
    });
  }
});

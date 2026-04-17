import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

/**
 * Drift guard: fails if new usages of retired patterns appear.
 * Baseline from docs/superpowers/drift-audit-2026-04-16.md (rebased 2026-04-17).
 * Migration phases must reduce each count toward zero.
 */

const BASELINES: Record<string, number> = {
  "text-\\[9px\\]": 28,
  "text-\\[11px\\]": 98,
  "rounded-\\[10px\\]": 38,
  "rounded-\\[14px\\]": 2,
  "rounded-md": 18,
  "rounded-lg": 5,
  "rounded-xl": 0,
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

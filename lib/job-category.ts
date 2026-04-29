/**
 * Heuristic category inference for jobs that don't ship an explicit category column.
 * Used by both the public-jobs scraper pipeline and the DB feed reader so they stay in sync.
 */
export type JobCategory = "swe" | "pm" | "dsml" | "quant" | "hardware";

export function inferCategory(role: string, tags: readonly string[] = []): JobCategory {
  const roleLower = role.toLowerCase();
  const tagText = tags.join(" ").toLowerCase();

  if (/product|program manager|\bpm\b/.test(roleLower) || /\bpm\b/.test(tagText)) return "pm";
  if (/data|machine learning|\bml\b|\bai\b|analytics|scientist/.test(roleLower)) return "dsml";
  if (/quant|trading|research/.test(roleLower) || tagText.includes("quant")) return "quant";
  if (/hardware|embedded|firmware|electrical/.test(roleLower)) return "hardware";
  return "swe";
}

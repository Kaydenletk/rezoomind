import type { BulletContext, ImprovementMode } from "@/types/ai";

export const BULLET_IMPROVE_SYSTEM_PROMPT = `You are an expert resume writer who specializes in transforming weak, vague bullet points into compelling, quantified achievements that demonstrate clear impact.

Your approach:
- Always include specific metrics (numbers, percentages, timeframes)
- Use strong action verbs (Developed, Engineered, Led, Optimized, etc)
- Follow the STAR method (Situation, Task, Action, Result)
- Focus on impact and outcomes, not just responsibilities
- Keep bullets concise (1-2 lines maximum)
- Avoid jargon and buzzwords
- Make achievements specific and verifiable`;

export function getBulletImproveUserPrompt(
  bullet: string,
  context: BulletContext,
  improvementType: ImprovementMode
): string {
  return `Improve this resume bullet point for a ${context.role} at ${context.company} in the ${context.industry} industry.

ORIGINAL BULLET:
"${bullet}"

IMPROVEMENT TYPE: ${improvementType}
- aggressive: Complete rewrite with strong quantification, even if you need to make reasonable assumptions about metrics
- balanced: Improve clarity and impact while staying close to original meaning
- conservative: Minimal changes, just fix grammar and strengthen verbs

Return your response as JSON:

{
  "improved_versions": [
    {
      "text": "Improved bullet point text",
      "changes_made": ["List of specific improvements"],
      "metrics_added": ["Specific numbers/percentages added"],
      "reasoning": "Why this version is better"
    }
  ],
  "metrics_guidance": "If metrics weren't in original, suggest how to quantify (e.g., 'How many features did you build? How many users? What was the performance improvement?')",
  "action_verb_upgrade": "Original verb → Improved verb (if applicable)"
}

GUIDELINES:
1. If no metrics exist, suggest reasonable ranges based on typical role responsibilities
2. Every improved version should be stronger than the original
3. Maintain truthfulness - don't fabricate specific numbers, but suggest ranges
4. Use industry-appropriate terminology
5. Ensure bullets are ATS-friendly (keyword-rich)

Return ONLY the JSON.`;
}

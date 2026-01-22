import type { LinkedInProfileData } from "@/types/ai";

export const LINKEDIN_SYSTEM_PROMPT = `You are a LinkedIn profile optimization expert who has helped thousands of professionals improve their online presence and attract recruiters.

You understand:
- How LinkedIn's algorithm surfaces profiles
- What recruiters search for
- How to write compelling headlines and summaries
- The balance between keywords and readability
- How to showcase achievements effectively`;

export function getLinkedInUserPrompt(params: LinkedInProfileData): string {
  return `Optimize this LinkedIn profile to attract recruiters and appear in more searches.

CURRENT PROFILE:
Headline: ${params.currentProfile.headline || "Not set"}
Summary: ${params.currentProfile.summary || "Not set"}
Experience: ${params.currentProfile.experience || "See resume"}

RESUME:
${params.resume}

TARGET ROLE: ${params.targetRole}
TARGET INDUSTRY: ${params.targetIndustry}

Provide optimization recommendations in JSON format:

{
  "optimized_headline": {
    "text": "Optimized headline (120 chars max)",
    "keywords": ["Keywords included for search"],
    "rationale": "Why this headline works"
  },
  "optimized_summary": {
    "text": "Compelling summary (2000 chars max, 3-4 paragraphs)",
    "structure": "How the summary is organized",
    "keywords": ["Keywords naturally incorporated"],
    "call_to_action": "CTA included at end"
  },
  "experience_improvements": [
    {
      "role": "Role title",
      "current": "Current description if provided",
      "improved": "Optimized description",
      "changes": ["What was improved"]
    }
  ],
  "skills_to_add": [
    {
      "skill": "Skill name",
      "priority": "high" | "medium" | "low",
      "reason": "Why this skill matters for target role"
    }
  ],
  "profile_optimization_tips": [
    "Actionable tips specific to this profile"
  ],
  "searchability_score": 0-100
}

OPTIMIZATION GUIDELINES:
1. Headline should include: Current role, key skills, and value proposition
2. Summary should tell a story: Who you are, what you do, what you've achieved, what you're looking for
3. Use first person in summary (more engaging)
4. Include 10-15 relevant keywords naturally throughout
5. Add specific achievements with metrics
6. End summary with clear CTA (e.g., "Open to opportunities in...")
7. Keep tone professional but personable
8. Make it easy to scan (short paragraphs, bullets if needed)

Return ONLY the JSON.`;
}

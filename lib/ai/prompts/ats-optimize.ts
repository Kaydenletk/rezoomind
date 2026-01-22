export const ATS_OPTIMIZE_SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) optimization expert who has reverse-engineered major ATS platforms like Workday, Taleo, Greenhouse, and Lever.

You understand:
- How ATS parse and score resumes
- Which keywords and phrases trigger higher rankings
- Formatting that breaks ATS parsing
- Industry-specific keyword optimization
- How to balance ATS optimization with human readability`;

export function getATSOptimizeUserPrompt(
  resumeText: string,
  jobDescription: string
): string {
  return `Optimize this resume for ATS (Applicant Tracking Systems) to increase chances of passing automated screening.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Analyze and provide optimization recommendations in JSON format:

{
  "ats_score": 0-100,
  "keyword_analysis": {
    "matched_keywords": [
      {
        "keyword": "keyword from job description",
        "found_in_resume": true/false,
        "importance": "critical" | "important" | "nice-to-have",
        "location": "where in resume if found"
      }
    ],
    "missing_critical_keywords": [
      {
        "keyword": "missing keyword",
        "why_important": "explanation",
        "where_to_add": "suggested section",
        "example": "example of how to naturally incorporate"
      }
    ],
    "keyword_stuffing_risk": "Assessment of whether resume over-uses keywords unnaturally"
  },
  "formatting_issues": [
    {
      "issue": "specific formatting problem",
      "why_problematic": "how it affects ATS parsing",
      "fix": "how to fix it"
    }
  ],
  "section_recommendations": [
    {
      "section": "section name",
      "current_state": "assessment",
      "recommendation": "what to change",
      "ats_impact": "how this helps ATS score"
    }
  ],
  "optimized_sections": {
    "skills": "Optimized skills section with proper formatting",
    "summary": "ATS-optimized professional summary if applicable"
  },
  "priority_actions": [
    "Ordered list of highest-impact changes"
  ]
}

OPTIMIZATION RULES:
1. Prioritize exact keyword matches from job description
2. Include variations of keywords (e.g., "JavaScript" and "JS")
3. Avoid images, tables, headers/footers, text boxes
4. Use standard section names (EXPERIENCE not CAREER HISTORY)
5. Include both acronyms and full terms (e.g., "AI (Artificial Intelligence)")
6. Balance keyword optimization with natural language
7. Ensure consistent formatting (dates, bullets, etc)

Return ONLY the JSON.`;
}

export const ANALYZE_SYSTEM_PROMPT = `You are an expert resume reviewer with 15+ years of experience in recruiting, ATS systems, and career coaching. You've reviewed over 50,000 resumes across all industries and seniority levels.

Your expertise includes:
- Identifying weak action verbs and suggesting strong alternatives
- Quantifying achievements with metrics
- Optimizing for Applicant Tracking Systems (ATS)
- Tailoring content for specific roles and industries
- Detecting formatting issues that hurt readability
- Ensuring appropriate length and structure

You provide constructive, specific, and actionable feedback. Your goal is to help candidates land interviews by improving their resumes significantly.`;

export function getAnalyzeUserPrompt(
  resumeText: string,
  targetRole?: string
): string {
  return `Analyze this resume in detail and provide a comprehensive assessment.

${targetRole ? `Target Role: ${targetRole}` : ""}

RESUME:
${resumeText}

Please provide your analysis in the following JSON format:

{
  "overall_score": 0-100,
  "section_scores": {
    "formatting": 0-100,
    "content_quality": 0-100,
    "ats_compatibility": 0-100,
    "impact": 0-100,
    "clarity": 0-100
  },
  "strengths": [
    "Specific strength with example from resume"
  ],
  "critical_issues": [
    {
      "issue": "Issue description",
      "severity": "high" | "medium" | "low",
      "location": "Where in resume (e.g., Experience section, bullet 3)",
      "example": "Exact text from resume",
      "fix": "How to fix it",
      "impact": "Why this matters"
    }
  ],
  "improvement_opportunities": [
    {
      "category": "action_verbs" | "quantification" | "keywords" | "formatting" | "length" | "structure",
      "description": "Specific opportunity",
      "examples": ["Current text → Improved text"],
      "priority": "high" | "medium" | "low"
    }
  ],
  "ats_analysis": {
    "score": 0-100,
    "keyword_optimization": "Assessment of relevant keywords",
    "formatting_issues": ["List of ATS-unfriendly formatting"],
    "missing_sections": ["Sections that should be added"],
    "file_compatibility": "Assessment of format (PDF, DOCX, etc)"
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "priority": "critical" | "important" | "nice-to-have",
      "estimated_impact": "high" | "medium" | "low"
    }
  ],
  "next_steps": [
    "Prioritized action items in order"
  ]
}

ANALYSIS GUIDELINES:
1. Be specific - cite exact text from the resume
2. Focus on highest-impact improvements first
3. Consider industry standards and current best practices
4. Flag any red flags (gaps, inconsistencies, etc)
5. Assess whether content matches target role (if provided)
6. Evaluate if achievements are quantified with metrics
7. Check for passive voice and weak language
8. Verify appropriate length (1 page for <10 years experience, 2 pages for 10+ years)

Return ONLY the JSON, no markdown formatting or explanations outside the JSON.`;
}

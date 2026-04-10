/**
 * Prompts for streaming match explanation
 */

export const MATCH_EXPLAIN_SYSTEM_PROMPT = `You are a career advisor explaining why a job matches (or doesn't match) a candidate's resume.

Your task is to provide a clear, conversational explanation of the match score. Be specific and actionable.

Guidelines:
- Start with the overall assessment (strong match, moderate match, or needs work)
- Explain which of the candidate's skills align with the job requirements
- Highlight any skill gaps that could be addressed
- Keep the tone encouraging but honest
- Use 2-3 short paragraphs maximum
- Don't use bullet points or markdown formatting - write in natural prose
- If the match is low, focus on what steps could improve it

Example output style:
"This role looks like a strong match for your profile. Your React and TypeScript experience directly aligns with their frontend requirements, and your work with Node.js covers their backend needs. One gap to consider: they're looking for someone with AWS experience, which isn't highlighted in your resume. If you have any cloud experience, even with other providers, it would be worth emphasizing that."`;

export interface MatchExplainParams {
  jobTitle: string;
  companyName: string;
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  resumeYears?: number;
  requiredYears?: number;
}

export function getMatchExplainUserPrompt(params: MatchExplainParams): string {
  const {
    jobTitle,
    companyName,
    overallScore,
    skillMatch,
    experienceMatch,
    matchingSkills,
    missingSkills,
    resumeYears,
    requiredYears,
  } = params;

  let prompt = `Explain why this job matches the candidate's resume.

Job: ${jobTitle} at ${companyName}

Match Scores:
- Overall: ${overallScore}%
- Skills: ${skillMatch}%
- Experience: ${experienceMatch}%

Matching Skills: ${matchingSkills.length > 0 ? matchingSkills.join(', ') : 'None identified'}
Missing Skills: ${missingSkills.length > 0 ? missingSkills.join(', ') : 'None - all requirements covered'}`;

  if (resumeYears !== undefined && requiredYears !== undefined) {
    prompt += `\n\nExperience: Candidate has ${resumeYears}+ years, job requires ${requiredYears}+ years`;
  }

  prompt += '\n\nProvide a conversational explanation of this match.';

  return prompt;
}

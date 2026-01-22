import type { CoverLetterParams } from "@/types/ai";

export const COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer who creates compelling, personalized cover letters that get interviews. Your letters are:

- Enthusiastic but professional
- Highly specific to the role and company
- Focused on why the candidate is an exceptional fit
- Story-driven, not just resume repetition
- Concise (250-400 words)
- Action-oriented with clear next steps

You avoid generic templates and clichés. Every letter feels personally written for that specific opportunity.`;

export function getCoverLetterUserPrompt(params: CoverLetterParams): string {
  return `Write a compelling cover letter for this job application.

CANDIDATE'S RESUME:
${params.resumeText}

JOB DETAILS:
Title: ${params.jobTitle}
Company: ${params.companyName}
Description: ${params.jobDescription}
${params.companyInfo ? `Company Info: ${params.companyInfo}` : ""}
${params.specificReason ? `Why Interested: ${params.specificReason}` : ""}

TONE: ${params.tone}

Generate a cover letter in JSON format:

{
  "cover_letter": "Full cover letter text (250-400 words)",
  "key_points": [
    "Main points highlighted in the letter"
  ],
  "matched_requirements": [
    {
      "requirement": "from job description",
      "how_addressed": "where in cover letter this is addressed"
    }
  ],
  "call_to_action": "The specific CTA used at the end",
  "personalization_elements": [
    "Specific ways this letter is personalized to company/role"
  ]
}

COVER LETTER STRUCTURE:
1. Opening Hook (1-2 sentences)
   - Grab attention immediately
   - Show genuine enthusiasm
   - Reference specific aspect of company/role

2. Why Them (2-3 sentences)
   - Why this company specifically
   - Show you've researched them
   - Align with their mission/values

3. Why You (5-7 sentences)
   - 2-3 specific achievements from resume
   - Directly connect to job requirements
   - Show you understand the role
   - Use concrete examples and metrics

4. Why Great Fit (2-3 sentences)
   - Synthesize why this match is perfect
   - Show enthusiasm for contributing
   - Forward-looking (what you'll bring)

5. Strong Close (2-3 sentences)
   - Clear call to action
   - Availability and eagerness
   - Professional but warm

GUIDELINES:
- Start strong - no "I am writing to apply for..."
- Use specific numbers and achievements from resume
- Match 3-5 key requirements from job description
- Reference something specific about the company
- Avoid clichés ("team player", "hard worker", etc)
- Keep to 250-400 words (±50 words)
- Make it conversational but professional
- End with confidence and clear next step

Return ONLY the JSON.`;
}

import { type CandidateProfile } from "@prisma/client";
import { generateGeminiText } from "@/lib/ai/client";

export type PlaywrightAction = {
     locator: string; // The CSS selector (e.g., "#first_name", "input[name='email']")
     action: "fill" | "click" | "check" | "selectOption" | "uploadcv";
     value?: string; // The text to type, or the option value to select
};

function isPlaywrightAction(value: unknown): value is PlaywrightAction {
     if (!value || typeof value !== "object") return false;
     const candidate = value as Record<string, unknown>;
     return (
          typeof candidate.locator === "string" &&
          typeof candidate.action === "string" &&
          ["fill", "click", "check", "selectOption", "uploadcv"].includes(candidate.action)
     );
}

function extractPlaywrightActions(value: unknown): PlaywrightAction[] {
     if (Array.isArray(value)) {
          return value.filter(isPlaywrightAction);
     }

     if (!value || typeof value !== "object") {
          return [];
     }

     const record = value as Record<string, unknown>;
     if (Array.isArray(record.actions)) {
          return record.actions.filter(isPlaywrightAction);
     }

     const nestedArray = Object.values(record).find(Array.isArray);
     return Array.isArray(nestedArray) ? nestedArray.filter(isPlaywrightAction) : [];
}

/**
 * Sends the extracted form HTML + the user's Candidate Profile to RezoomAI
 * and asks it to map the profile data onto the HTML input fields.
 * Returns an array of actionable steps for Playwright to execute.
 */
export async function getAgentPlaybook(
     formHtml: string,
     profile: CandidateProfile
): Promise<PlaywrightAction[]> {

     const systemPrompt = `
You are an expert AI browser automation agent responsible for filling out job applications. 
Your primary task is to map a user's Candidate Profile onto a targeted HTML form.

You will be provided with:
1. The User's Candidate Profile data (JSON format).
2. The raw, stripped HTML of the job application form.

Your goal is to return a strict JSON array of "Actions" that Playwright can execute.

Rules:
1. ONLY return a JSON array containing objects with the shape:
   { "locator": string, "action": "fill" | "click" | "check" | "selectOption" | "uploadcv", "value"?: string }
2. "locator" must be a valid CSS selector targeting the input element (e.g., "#first_name", "input[name='email']"). Prefer id attributes if they exist.
3. If an input field asks for data NOT in the profile (e.g., "Why do you want to work here?"), leave it blank or extrapolate a highly professional 1-sentence answer based on the role and company.
4. "uploadcv" action is a special command telling the pipeline to attach their uploaded Resume PDF. Use it for file inputs asking for a resume/CV.
5. If you see a "Submit Application" button, include a "click" action for it as the very LAST action in the array.
6. Return purely the raw JSON array. Do not use Markdown backticks. Do not include any explanations. Let the array be the entire response string.
  `;

     // Provide a clean version of the profile without database-specific fields
     const cleanProfile = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          email: "the users authenticated email address", // Note: passed generically for privacy
          address: `${profile.addressLine1}, ${profile.city}, ${profile.state} ${profile.zipCode}, ${profile.country}`,
          linkedin: profile.linkedinUrl,
          github: profile.githubUrl,
          portfolio: profile.portfolioUrl,
          usWorkAuth: profile.usWorkAuth ? "Yes, I am authorized" : "No, I am not",
          requiresSponsorship: profile.requiresSponsorship ? "Yes, I will require sponsorship" : "No, I will not require sponsorship",
          veteranStatus: profile.veteranStatus,
          disabilityStatus: profile.disabilityStatus,
          gender: profile.gender,
          race: profile.race
     };

     const userPrompt = `
Here is the user's Candidate Profile:
${JSON.stringify(cleanProfile, null, 2)}

Here is the extracted HTML Form:
${formHtml}

Generate the JSON array playbook now.
`;

     try {
          const content = await generateGeminiText({
               systemPrompt,
               prompt: userPrompt,
               temperature: 0.1, // Low temperature for high precision/consistency
               maxOutputTokens: 2048,
               responseMimeType: "application/json",
          });

          // Safety fallback: if GPT somehow wrapped it in an object like { "actions": [...] }
          let parsed: unknown;
          try {
               parsed = JSON.parse(content);
          } catch {
               return []; // Failed to parse
          }

          return extractPlaywrightActions(parsed);

     } catch (error) {
          console.error("[llm-agent] RezoomAI mapping failure:", error);
          return [];
     }
}

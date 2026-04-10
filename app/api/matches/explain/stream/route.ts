import { streamText } from 'ai';
import { z } from 'zod';
import { getStreamingModel, hasGeminiApiKey } from '@/lib/ai/ai-sdk-provider';
import {
  MATCH_EXPLAIN_SYSTEM_PROMPT,
  getMatchExplainUserPrompt,
} from '@/lib/ai/prompts/match-explain';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  jobTitle: z.string().min(1),
  companyName: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  skillMatch: z.number().min(0).max(100),
  experienceMatch: z.number().min(0).max(100),
  matchingSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  resumeYears: z.number().optional(),
  requiredYears: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: validation.error.issues[0]?.message || 'Invalid input',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const params = validation.data;

    // Check for API key - return mock stream if not configured
    if (!hasGeminiApiKey()) {
      const mockText = getMockExplanation(params);
      return createMockStream(mockText);
    }

    const model = getStreamingModel();
    const userPrompt = getMatchExplainUserPrompt(params);

    const result = streamText({
      model,
      system: MATCH_EXPLAIN_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 500,
      temperature: 0.7,
    });

    // Use toTextStreamResponse() for simple text streaming (AI SDK v6)
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[matches/explain/stream] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate explanation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function getMockExplanation(params: z.infer<typeof requestSchema>): string {
  const { jobTitle, companyName, overallScore, matchingSkills, missingSkills } = params;

  if (overallScore >= 80) {
    return `This ${jobTitle} role at ${companyName} looks like a strong match for your profile. ${
      matchingSkills.length > 0
        ? `Your experience with ${matchingSkills.slice(0, 3).join(', ')} directly aligns with what they're looking for.`
        : ''
    } ${
      missingSkills.length > 0
        ? `One area to consider: they mention ${missingSkills[0]}, which might be worth highlighting if you have any related experience.`
        : ''
    }`;
  } else if (overallScore >= 60) {
    return `This ${jobTitle} position at ${companyName} is a moderate match. ${
      matchingSkills.length > 0
        ? `You have some overlap with their requirements, particularly in ${matchingSkills.slice(0, 2).join(' and ')}.`
        : 'The skills overlap is limited.'
    } ${
      missingSkills.length > 0
        ? `To strengthen your candidacy, consider building skills in ${missingSkills.slice(0, 2).join(' and ')}.`
        : ''
    }`;
  } else {
    return `This ${jobTitle} role at ${companyName} might be a stretch based on your current resume. ${
      missingSkills.length > 0
        ? `The main gaps are in ${missingSkills.slice(0, 3).join(', ')}.`
        : ''
    } That said, if you're excited about this direction, these are skills you could develop through projects or courses.`;
  }
}

function createMockStream(text: string): Response {
  // Create a simple text stream that mirrors toTextStreamResponse() format
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Simulate streaming by sending chunks as plain text
      const words = text.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 50)); // 50ms delay between words
      }
      controller.close();
    },
  });

  // Match toTextStreamResponse() headers - simple text/plain
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

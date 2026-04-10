import { streamText } from 'ai';
import { z } from 'zod';
import { getStreamingModel, hasGeminiApiKey } from '@/lib/ai/ai-sdk-provider';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  resumeText: z.string().min(100, 'Resume must be at least 100 characters'),
  jobTitle: z.string().min(1, 'Job title is required'),
  companyName: z.string().min(1, 'Company name is required'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  companyInfo: z.string().optional(),
  tone: z
    .enum(['professional', 'enthusiastic', 'creative', 'technical'])
    .optional()
    .default('professional'),
  specificReason: z.string().optional(),
});

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert career coach who writes compelling, personalized cover letters.

Guidelines:
- Write in first person from the candidate's perspective
- Match the tone requested (professional, enthusiastic, creative, or technical)
- Reference specific skills from the resume that match the job
- Show genuine interest in the company
- Keep it concise: 3-4 paragraphs maximum
- Open with a hook, not "I am writing to apply..."
- Close with a clear call to action
- Don't use generic phrases like "I believe I would be a great fit"
- Be specific about how the candidate's experience matches requirements

Output only the cover letter text, no headers or labels.`;

function getCoverLetterUserPrompt(params: z.infer<typeof requestSchema>): string {
  const {
    resumeText,
    jobTitle,
    companyName,
    jobDescription,
    companyInfo,
    tone,
    specificReason,
  } = params;

  let prompt = `Write a ${tone} cover letter for this application.

JOB DETAILS:
Title: ${jobTitle}
Company: ${companyName}
${companyInfo ? `Company Info: ${companyInfo}` : ''}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText.slice(0, 8000)}`;

  if (specificReason) {
    prompt += `\n\nThe candidate wants to emphasize: ${specificReason}`;
  }

  prompt += '\n\nWrite the cover letter now:';

  return prompt;
}

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
      return createMockCoverLetterStream(params);
    }

    const model = getStreamingModel();
    const userPrompt = getCoverLetterUserPrompt(params);

    const result = streamText({
      model,
      system: COVER_LETTER_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 1000,
      temperature: 0.7,
    });

    // Use toTextStreamResponse() for simple text streaming (AI SDK v6)
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[cover-letter/stream] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate cover letter' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function createMockCoverLetterStream(
  params: z.infer<typeof requestSchema>
): Response {
  const { jobTitle, companyName, tone } = params;

  const mockLetter = `When I saw the ${jobTitle} opening at ${companyName}, I knew I had to reach out. My background in software development, combined with my passion for building products that matter, aligns perfectly with what you're looking for.

Over the past few years, I've honed my skills in full-stack development, working with React, Node.js, and Python to build scalable applications. What excites me most about ${companyName} is ${tone === 'enthusiastic' ? 'the incredible energy and innovation' : 'the opportunity to work on meaningful technical challenges'}.

I'd love the chance to discuss how my experience could contribute to your team's success. Would you be open to a brief conversation this week?

Looking forward to connecting.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = mockLetter.split(' ');
      // Simulate streaming as plain text (matching toTextStreamResponse())
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? '' : ' ') + words[i];
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 30));
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

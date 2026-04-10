# Streaming AI Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add streaming AI explanations for job matches and cover letter generation using Vercel AI SDK

**Architecture:** Migrate from direct `@google/genai` calls to Vercel AI SDK's `streamText()` for streaming responses. Add new streaming API endpoints (`/api/matches/explain/stream`, `/api/resume/cover-letter/stream`) and React hooks (`useChat`/custom streaming hook) to display text token-by-token like ChatGPT.

**Tech Stack:** Vercel AI SDK v6, Google Generative AI provider (`@ai-sdk/google`), React hooks for streaming consumption

---

## File Structure

### New Files
```
lib/ai/
├── ai-sdk-provider.ts          # Vercel AI SDK provider setup (Google)
├── prompts/match-explain.ts    # Prompt for match explanation

app/api/matches/
├── explain/
│   └── stream/route.ts         # Streaming match explanation endpoint

app/api/resume/
├── cover-letter/
│   └── stream/route.ts         # Streaming cover letter endpoint

components/smart-feed/
├── MatchExplanationStream.tsx  # Client component for streaming explanation
├── CoverLetterStream.tsx       # Client component for streaming cover letter

hooks/
├── useStreamingText.ts         # Custom hook for streaming text consumption
```

### Modified Files
```
package.json                    # Add Vercel AI SDK dependencies
lib/ai/client.ts                # Export provider config for AI SDK
types/ai.ts                     # Add streaming-related types
```

---

## Tasks

### Task 0: Install Vercel AI SDK Dependencies

**Goal:** Install Vercel AI SDK and Google provider packages

**Files:**
- Modify: `package.json`

**Acceptance Criteria:**
- [ ] `ai` package (Vercel AI SDK v6) installed
- [ ] `@ai-sdk/google` package installed
- [ ] `npm run dev` starts without errors

**Verify:** `npm ls ai @ai-sdk/google` → shows both packages installed

**Steps:**

- [ ] **Step 1: Install packages**

Run:
```bash
npm install ai @ai-sdk/google
```

Expected: Packages added to package.json dependencies

- [ ] **Step 2: Verify installation**

Run: `npm ls ai @ai-sdk/google`

Expected output shows both packages with versions

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Vercel AI SDK and Google provider"
```

---

### Task 1: Create AI SDK Provider Configuration

**Goal:** Set up Vercel AI SDK provider for Google Gemini

**Files:**
- Create: `lib/ai/ai-sdk-provider.ts`

**Acceptance Criteria:**
- [x] Exports `googleProvider` configured with GEMINI_API_KEY
- [x] Exports `geminiModel` ready for use with streamText
- [x] Handles missing API key gracefully

**Verify:** `npx tsc --noEmit lib/ai/ai-sdk-provider.ts` → no errors

**Steps:**

- [x] **Step 1: Create provider configuration file**

Create `lib/ai/ai-sdk-provider.ts`:

```typescript
/**
 * Vercel AI SDK Provider Configuration
 * Uses Google Generative AI (Gemini) for streaming text generation
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Model to use for streaming text generation
// gemini-2.0-flash is fast and good for explanations
const STREAMING_MODEL = 'gemini-2.0-flash';

/**
 * Check if Gemini API key is configured
 */
export function hasGeminiApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Get Google Generative AI provider
 * Throws if API key not configured
 */
export function getGoogleProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Get configured Gemini model for streaming
 */
export function getStreamingModel() {
  const google = getGoogleProvider();
  return google(STREAMING_MODEL);
}
```

- [x] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/ai/ai-sdk-provider.ts`

Expected: No errors

- [x] **Step 3: Commit**

```bash
git add lib/ai/ai-sdk-provider.ts
git commit -m "feat: add Vercel AI SDK provider configuration"
```

---

### Task 2: Create Match Explanation Prompt

**Goal:** Create a structured prompt for explaining job match scores

**Files:**
- Create: `lib/ai/prompts/match-explain.ts`

**Acceptance Criteria:**
- [ ] System prompt instructs AI to explain match in conversational style
- [ ] User prompt template includes resume skills, job skills, match scores, missing skills
- [ ] Output is natural language, not JSON

**Verify:** File exports `MATCH_EXPLAIN_SYSTEM_PROMPT` and `getMatchExplainUserPrompt` function

**Steps:**

- [ ] **Step 1: Create the prompt file**

Create `lib/ai/prompts/match-explain.ts`:

```typescript
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
```

- [ ] **Step 2: Verify exports**

Run: `npx tsc --noEmit lib/ai/prompts/match-explain.ts`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/ai/prompts/match-explain.ts
git commit -m "feat: add match explanation prompt template"
```

---

### Task 3: Create Streaming Match Explanation API Route

**Goal:** Create API endpoint that streams match explanation text

**Files:**
- Create: `app/api/matches/explain/stream/route.ts`

**Acceptance Criteria:**
- [ ] POST endpoint accepts jobId, resumeId (or inline match data)
- [ ] Uses Vercel AI SDK `streamText()` for streaming response
- [ ] Returns proper streaming headers (text/event-stream or AI SDK format)
- [ ] Handles missing API key with mock streaming response

**Verify:** `curl -X POST http://localhost:3000/api/matches/explain/stream -H "Content-Type: application/json" -d '{"jobTitle":"SWE","companyName":"Acme","overallScore":85,"skillMatch":90,"experienceMatch":75,"matchingSkills":["react","typescript"],"missingSkills":["aws"]}'` → streams text response

**Steps:**

- [ ] **Step 1: Create the directory structure**

Run: `mkdir -p app/api/matches/explain/stream`

- [ ] **Step 2: Create the streaming route**

Create `app/api/matches/explain/stream/route.ts`:

```typescript
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
      maxTokens: 500,
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
```

- [ ] **Step 3: Test the endpoint**

Run: `npm run dev` (in another terminal)

Then test:
```bash
curl -X POST http://localhost:3000/api/matches/explain/stream \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Software Engineer","companyName":"Acme Corp","overallScore":85,"skillMatch":90,"experienceMatch":75,"matchingSkills":["react","typescript","nodejs"],"missingSkills":["aws"]}'
```

Expected: Text streams back in chunks

- [ ] **Step 4: Commit**

```bash
git add app/api/matches/explain/stream/route.ts
git commit -m "feat: add streaming match explanation API endpoint"
```

---

### Task 4: Create useStreamingText Hook

**Goal:** Create a reusable React hook for consuming streaming text responses

**Files:**
- Create: `hooks/useStreamingText.ts`

**Acceptance Criteria:**
- [ ] Hook accepts API endpoint URL and request body
- [ ] Returns `{ text, isLoading, error, trigger }`
- [ ] Uses Vercel AI SDK's `useCompletion` or manual stream parsing
- [ ] Supports abort/cancel mid-stream

**Verify:** Import hook in a test component and verify it compiles

**Steps:**

- [ ] **Step 1: Create hooks directory if needed**

Run: `mkdir -p hooks`

- [ ] **Step 2: Create the streaming hook**

Create `hooks/useStreamingText.ts`:

```typescript
'use client';

import { useCallback, useState } from 'react';

interface UseStreamingTextOptions {
  onFinish?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseStreamingTextReturn {
  text: string;
  isLoading: boolean;
  error: Error | null;
  trigger: (body: Record<string, unknown>) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * Hook for consuming streaming text from AI SDK endpoints
 * Works with toTextStreamResponse() - plain text streaming
 */
export function useStreamingText(
  endpoint: string,
  options: UseStreamingTextOptions = {}
): UseStreamingTextReturn {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  }, [abortController]);

  const reset = useCallback(() => {
    setText('');
    setError(null);
    setIsLoading(false);
  }, []);

  const trigger = useCallback(
    async (body: Record<string, unknown>) => {
      // Abort any existing request
      if (abortController) {
        abortController.abort();
      }

      const controller = new AbortController();
      setAbortController(controller);
      setIsLoading(true);
      setError(null);
      setText('');

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulated = '';

        // Read plain text stream from toTextStreamResponse()
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);
        }

        options.onFinish?.(accumulated);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled, not an error
          return;
        }
        const error = err instanceof Error ? err : new Error('Stream failed');
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
        setAbortController(null);
      }
    },
    [endpoint, abortController, options]
  );

  return { text, isLoading, error, trigger, stop, reset };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit hooks/useStreamingText.ts`

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add hooks/useStreamingText.ts
git commit -m "feat: add useStreamingText hook for AI SDK streaming"
```

---

### Task 5: Create MatchExplanationStream Component

**Goal:** Create a React component that displays streaming match explanation

**Files:**
- Create: `components/smart-feed/MatchExplanationStream.tsx`

**Acceptance Criteria:**
- [ ] Client component that triggers streaming on mount or button click
- [ ] Shows loading state while streaming
- [ ] Displays text as it streams in (typewriter effect)
- [ ] Follows terminal design system (mono font, orange accents)
- [ ] Has stop/retry buttons

**Verify:** Component renders and triggers stream when given match data

**Steps:**

- [ ] **Step 1: Create the component**

Create `components/smart-feed/MatchExplanationStream.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

interface MatchExplanationStreamProps {
  jobTitle: string;
  companyName: string;
  overallScore: number;
  skillMatch: number;
  experienceMatch: number;
  matchingSkills: string[];
  missingSkills: string[];
  resumeYears?: number;
  requiredYears?: number;
  autoStart?: boolean;
}

export function MatchExplanationStream({
  jobTitle,
  companyName,
  overallScore,
  skillMatch,
  experienceMatch,
  matchingSkills,
  missingSkills,
  resumeYears,
  requiredYears,
  autoStart = false,
}: MatchExplanationStreamProps) {
  const { text, isLoading, error, trigger, stop, reset } = useStreamingText(
    '/api/matches/explain/stream'
  );

  const requestBody = {
    jobTitle,
    companyName,
    overallScore,
    skillMatch,
    experienceMatch,
    matchingSkills,
    missingSkills,
    resumeYears,
    requiredYears,
  };

  useEffect(() => {
    if (autoStart && !text && !isLoading) {
      trigger(requestBody);
    }
    // Only run on mount when autoStart is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handleExplain = () => {
    reset();
    trigger(requestBody);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          AI Analysis
        </span>
        {isLoading && (
          <button
            onClick={stop}
            className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-400"
          >
            Stop
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="min-h-[80px] rounded border border-stone-200 bg-stone-50 p-3 font-mono text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-300">
        {error ? (
          <div className="text-red-500">
            <span className="mr-2">✗</span>
            {error.message}
          </div>
        ) : text ? (
          <>
            {text}
            {isLoading && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-orange-500" />
            )}
          </>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-stone-400">
            <span className="animate-pulse">⋯</span>
            Analyzing match...
          </div>
        ) : (
          <div className="text-stone-400">
            Click "Explain Match" to see AI analysis
          </div>
        )}
      </div>

      {/* Action button */}
      {!isLoading && (
        <button
          onClick={handleExplain}
          className="w-full border border-orange-600/50 bg-orange-600/10 px-4 py-2 font-mono text-sm text-orange-600 transition-colors hover:bg-orange-600/20 dark:text-orange-500"
        >
          {text ? '↻ Regenerate' : '▸ Explain Match'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit components/smart-feed/MatchExplanationStream.tsx`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/smart-feed/MatchExplanationStream.tsx
git commit -m "feat: add MatchExplanationStream component"
```

---

### Task 6: Create Streaming Cover Letter API Route

**Goal:** Create API endpoint that streams cover letter generation

**Files:**
- Create: `app/api/resume/cover-letter/stream/route.ts`

**Acceptance Criteria:**
- [ ] POST endpoint accepts resumeText, jobTitle, companyName, jobDescription, tone
- [ ] Uses Vercel AI SDK `streamText()` for streaming response
- [ ] Reuses existing cover letter system prompt from `lib/ai/prompts/cover-letter.ts`
- [ ] Handles missing API key with mock streaming response

**Verify:** `curl -X POST http://localhost:3000/api/resume/cover-letter/stream ...` → streams cover letter text

**Steps:**

- [ ] **Step 1: Read existing cover letter prompt**

Read `lib/ai/prompts/cover-letter.ts` to understand the prompt structure.

- [ ] **Step 2: Create the streaming route**

Create `app/api/resume/cover-letter/stream/route.ts`:

```typescript
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
      maxTokens: 1000,
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
```

- [ ] **Step 3: Test the endpoint**

```bash
curl -X POST http://localhost:3000/api/resume/cover-letter/stream \
  -H "Content-Type: application/json" \
  -d '{"resumeText":"Experienced software engineer with 5 years building web applications...","jobTitle":"Senior Frontend Engineer","companyName":"Stripe","jobDescription":"We are looking for a Senior Frontend Engineer to join our dashboard team..."}'
```

Expected: Cover letter text streams back

- [ ] **Step 4: Commit**

```bash
git add app/api/resume/cover-letter/stream/route.ts
git commit -m "feat: add streaming cover letter API endpoint"
```

---

### Task 7: Create CoverLetterStream Component

**Goal:** Create a React component for streaming cover letter generation

**Files:**
- Create: `components/smart-feed/CoverLetterStream.tsx`

**Acceptance Criteria:**
- [ ] Client component that accepts resume text and job details
- [ ] Triggers streaming on button click
- [ ] Shows loading state, streaming text, and completion state
- [ ] Includes copy-to-clipboard button when complete
- [ ] Follows terminal design system

**Verify:** Component renders and streams cover letter when triggered

**Steps:**

- [ ] **Step 1: Create the component**

Create `components/smart-feed/CoverLetterStream.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useStreamingText } from '@/hooks/useStreamingText';

type CoverLetterTone = 'professional' | 'enthusiastic' | 'creative' | 'technical';

interface CoverLetterStreamProps {
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  companyInfo?: string;
  defaultTone?: CoverLetterTone;
}

export function CoverLetterStream({
  resumeText,
  jobTitle,
  companyName,
  jobDescription,
  companyInfo,
  defaultTone = 'professional',
}: CoverLetterStreamProps) {
  const [tone, setTone] = useState<CoverLetterTone>(defaultTone);
  const [copied, setCopied] = useState(false);

  const { text, isLoading, error, trigger, stop, reset } = useStreamingText(
    '/api/resume/cover-letter/stream',
    {
      onFinish: () => setCopied(false),
    }
  );

  const handleGenerate = () => {
    reset();
    setCopied(false);
    trigger({
      resumeText,
      jobTitle,
      companyName,
      jobDescription,
      companyInfo,
      tone,
    });
  };

  const handleCopy = async () => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toneOptions: { value: CoverLetterTone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
    { value: 'creative', label: 'Creative' },
    { value: 'technical', label: 'Technical' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
          Cover Letter Generator
        </span>
        <div className="flex items-center gap-2">
          {text && !isLoading && (
            <button
              onClick={handleCopy}
              className="text-[10px] uppercase tracking-[0.2em] text-orange-600 hover:text-orange-500 dark:text-orange-500"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
          {isLoading && (
            <button
              onClick={stop}
              className="text-[10px] uppercase tracking-[0.2em] text-red-500 hover:text-red-400"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Tone selector */}
      <div className="flex gap-2">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTone(option.value)}
            disabled={isLoading}
            className={`border px-3 py-1.5 font-mono text-xs transition-colors ${
              tone === option.value
                ? 'border-orange-600/50 bg-orange-600/10 text-orange-600 dark:text-orange-500'
                : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700 dark:border-stone-700 dark:text-stone-400 dark:hover:border-stone-600'
            } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="min-h-[200px] max-h-[400px] overflow-y-auto rounded border border-stone-200 bg-stone-50 p-4 font-mono text-sm leading-relaxed text-stone-700 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-300">
        {error ? (
          <div className="text-red-500">
            <span className="mr-2">✗</span>
            {error.message}
          </div>
        ) : text ? (
          <div className="whitespace-pre-wrap">
            {text}
            {isLoading && (
              <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-orange-500" />
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-stone-400">
            <span className="animate-pulse">⋯</span>
            Crafting your cover letter...
          </div>
        ) : (
          <div className="text-stone-400">
            Select a tone and click "Generate" to create a tailored cover letter
          </div>
        )}
      </div>

      {/* Generate button */}
      {!isLoading && (
        <button
          onClick={handleGenerate}
          className="w-full border border-orange-600/50 bg-orange-600/10 px-4 py-2 font-mono text-sm text-orange-600 transition-colors hover:bg-orange-600/20 dark:text-orange-500"
        >
          {text ? '↻ Regenerate' : '▸ Generate Cover Letter'}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit components/smart-feed/CoverLetterStream.tsx`

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/smart-feed/CoverLetterStream.tsx
git commit -m "feat: add CoverLetterStream component"
```

---

### Task 8: Integration Test - Wire Components to Smart Feed

**Goal:** Verify streaming components work in the context of the smart feed

**Files:**
- Modify: One existing page to test integration (e.g., create a test route or modify detail panel)

**Acceptance Criteria:**
- [ ] MatchExplanationStream renders with mock data and streams explanation
- [ ] CoverLetterStream renders with mock data and streams cover letter
- [ ] Both components follow terminal design system
- [ ] Dev server runs without errors

**Verify:** Visit test page, trigger both streams, see text appear word-by-word

**Steps:**

- [ ] **Step 1: Create a test page**

Create `app/test-streaming/page.tsx`:

```tsx
import { MatchExplanationStream } from '@/components/smart-feed/MatchExplanationStream';
import { CoverLetterStream } from '@/components/smart-feed/CoverLetterStream';

export default function TestStreamingPage() {
  // Mock data for testing
  const mockMatchData = {
    jobTitle: 'Senior Software Engineer',
    companyName: 'Stripe',
    overallScore: 82,
    skillMatch: 88,
    experienceMatch: 70,
    matchingSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    missingSkills: ['Go', 'Kubernetes'],
    resumeYears: 4,
    requiredYears: 5,
  };

  const mockCoverLetterData = {
    resumeText: `Software Engineer with 4 years of experience building web applications.

Skills: React, TypeScript, Node.js, PostgreSQL, AWS, Docker

Experience:
- Built and maintained a B2B SaaS platform serving 10,000+ users
- Led migration from monolith to microservices architecture
- Implemented real-time features using WebSockets
- Mentored junior developers and conducted code reviews

Education:
BS Computer Science, University of California, Berkeley`,
    jobTitle: 'Senior Software Engineer',
    companyName: 'Stripe',
    jobDescription: `We're looking for a Senior Software Engineer to join our Dashboard team.

Requirements:
- 5+ years of experience in software development
- Strong proficiency in React and TypeScript
- Experience with backend systems (Go, Java, or similar)
- Familiarity with cloud infrastructure (AWS, GCP)
- Experience with relational databases

Nice to have:
- Experience with payment systems
- Kubernetes experience
- Open source contributions`,
    companyInfo: 'Stripe is a financial infrastructure platform for businesses.',
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8 dark:bg-stone-950">
      <div className="mx-auto max-w-3xl space-y-12">
        <h1 className="font-mono text-2xl font-bold text-stone-900 dark:text-stone-100">
          Streaming AI Test
        </h1>

        {/* Match Explanation Test */}
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-stone-700 dark:text-stone-300">
            Match Explanation
          </h2>
          <div className="border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <MatchExplanationStream {...mockMatchData} />
          </div>
        </section>

        {/* Cover Letter Test */}
        <section className="space-y-4">
          <h2 className="font-mono text-lg text-stone-700 dark:text-stone-300">
            Cover Letter Generator
          </h2>
          <div className="border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <CoverLetterStream {...mockCoverLetterData} />
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Run: `npm run dev`

Visit: `http://localhost:3000/test-streaming`

Test both components - click buttons, verify streaming works

- [ ] **Step 3: Clean up test page (optional - keep for demo)**

If keeping:
```bash
git add app/test-streaming/page.tsx
git commit -m "feat: add streaming test page for demo"
```

If removing, delete and don't commit.

---

### Task 9: Final Verification and Documentation Update

**Goal:** Verify all features work end-to-end and update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (update roadmap status)

**Acceptance Criteria:**
- [ ] `npm run build` passes
- [ ] All new API routes respond correctly
- [ ] Streaming works in production build (`npm run start`)
- [ ] CLAUDE.md reflects completed streaming features

**Verify:** `npm run build && npm run start` → visit test page → streaming works

**Steps:**

- [ ] **Step 1: Run production build**

Run: `npm run build`

Expected: Build completes without errors

- [ ] **Step 2: Test production server**

Run: `npm run start`

Visit: `http://localhost:3000/test-streaming`

Verify both streaming components work

- [ ] **Step 3: Update CLAUDE.md**

Add to the "Known Issues & Tech Debt" section or create a "Completed Features" section:

```markdown
## Completed Features

| Feature | Location | Notes |
|---------|----------|-------|
| Streaming match explanation | `app/api/matches/explain/stream/` | Uses Vercel AI SDK + Gemini |
| Streaming cover letter | `app/api/resume/cover-letter/stream/` | Uses Vercel AI SDK + Gemini |
| useStreamingText hook | `hooks/useStreamingText.ts` | Reusable streaming consumer |
```

- [ ] **Step 4: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with streaming AI features"
```

- [ ] **Step 5: Final commit for feature branch**

```bash
git add .
git commit -m "feat: complete streaming AI features implementation"
```

---

## Summary

This plan adds:
1. **Vercel AI SDK integration** with Google Gemini provider
2. **Streaming match explanation** - explains why a job matches, streamed word-by-word
3. **Streaming cover letter generator** - generates tailored cover letters with streaming
4. **Reusable streaming hook** - `useStreamingText` for any streaming endpoint
5. **Terminal-styled UI components** - consistent with the app's design system

Total: **9 tasks** covering setup, implementation, and verification.

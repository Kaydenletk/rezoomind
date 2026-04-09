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

import { GoogleGenAI } from "@google/genai";

export const GEMINI_GENERATIVE_MODEL = "gemini-3-pro-preview";
export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const GEMINI_EMBEDDING_DIMENSIONS = 1536;

declare global {
  var geminiClient: GoogleGenAI | undefined;
}

type GenerateGeminiTextOptions = {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
};

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please add it to your environment variables."
    );
  }

  return apiKey;
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGeminiClient(): GoogleGenAI {
  if (global.geminiClient) {
    return global.geminiClient;
  }

  const client = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  if (process.env.NODE_ENV !== "production") {
    global.geminiClient = client;
  }

  return client;
}

function stripCodeFences(value: string): string {
  const trimmed = value.trim();

  if (trimmed.startsWith("```json")) {
    return trimmed.slice(7).replace(/```$/, "").trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed.slice(3).replace(/```$/, "").trim();
  }

  return trimmed;
}

export async function generateGeminiText({
  prompt,
  systemPrompt,
  model = GEMINI_GENERATIVE_MODEL,
  temperature = 0.3,
  maxOutputTokens = 4096,
  responseMimeType,
}: GenerateGeminiTextOptions): Promise<string> {
  const client = getGeminiClient();

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      temperature,
      maxOutputTokens,
      responseMimeType,
      thinkingConfig: {
        includeThoughts: false,
      },
    },
  });

  const candidateText =
    response.candidates?.[0]?.content?.parts
      ?.map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
      .join("") ?? "";

  return stripCodeFences(response.text ?? candidateText);
}

export async function generateGeminiJson<T>(
  options: GenerateGeminiTextOptions
): Promise<T> {
  const text = await generateGeminiText({
    ...options,
    responseMimeType: "application/json",
  });

  return JSON.parse(text) as T;
}

export async function generateGeminiEmbeddings(
  texts: string[],
  dimensions: number = GEMINI_EMBEDDING_DIMENSIONS
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getGeminiClient();

  const response = await client.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: texts,
    config: {
      outputDimensionality: dimensions,
    },
  });

  return (response.embeddings ?? []).map((embedding) => embedding.values ?? []);
}

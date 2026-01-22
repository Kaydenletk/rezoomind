import OpenAI from "openai";

declare global {
  // eslint-disable-next-line no-var
  var openai: OpenAI | undefined;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Please add it to your environment variables."
    );
  }

  if (global.openai) {
    return global.openai;
  }

  const client = new OpenAI({ apiKey });

  if (process.env.NODE_ENV !== "production") {
    global.openai = client;
  }

  return client;
}

export { getOpenAIClient };

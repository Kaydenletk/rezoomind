/**
 * Gemini embeddings helper.
 * Generates vector embeddings for text using gemini-embedding-001.
 */

import {
     generateGeminiEmbeddings,
     GEMINI_EMBEDDING_DIMENSIONS,
} from "./client";

const EMBEDDING_DIMENSIONS = GEMINI_EMBEDDING_DIMENSIONS;

// In-memory cache to avoid re-embedding identical text within a session
const embeddingCache = new Map<string, number[]>();

/**
 * Generate a vector embedding for a text string
 */
export async function generateEmbedding(text: string): Promise<number[]> {
     if (!text || text.trim().length === 0) {
          return new Array(EMBEDDING_DIMENSIONS).fill(0);
     }

     // Truncate to ~8000 tokens (~32000 chars) to stay within model limits
     const truncated = text.slice(0, 32000);

     // Check cache
     const cacheKey = truncated.slice(0, 200); // Use prefix as cache key
     const cached = embeddingCache.get(cacheKey);
     if (cached) return cached;

     const [embedding] = await generateGeminiEmbeddings([truncated], EMBEDDING_DIMENSIONS);
     if (!embedding || embedding.length === 0) {
          throw new Error('Failed to generate embedding: empty response');
     }

     // Cache the result
     embeddingCache.set(cacheKey, embedding);

     return embedding;
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function generateEmbeddingsBatch(
     texts: string[]
): Promise<number[][]> {
     if (texts.length === 0) return [];

     // Truncate each text
     const truncated = texts.map((t) => (t || '').slice(0, 32000));
     return generateGeminiEmbeddings(truncated, EMBEDDING_DIMENSIONS);
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 */
export function cosineSimilarity(a: number[], b: number[]): number {
     if (a.length !== b.length) {
          throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
     }

     let dotProduct = 0;
     let normA = 0;
     let normB = 0;

     for (let i = 0; i < a.length; i++) {
          dotProduct += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
     }

     const denominator = Math.sqrt(normA) * Math.sqrt(normB);
     if (denominator === 0) return 0;

     return dotProduct / denominator;
}

/**
 * Clear the embedding cache (useful for long-running processes)
 */
export function clearEmbeddingCache(): void {
     embeddingCache.clear();
}

export { EMBEDDING_DIMENSIONS };

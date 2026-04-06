import { computeVectorMatchScore, VectorMatchResult } from "./vector-matching";
import { generateEmbeddingsBatch } from "@/lib/ai/embeddings";

export interface BatchMatchResult extends VectorMatchResult {
  jobId: string;
  sourceId: string;
  company: string;
  role: string;
  missingSkills: string[];
}

/** Embeddings generated on-the-fly that the caller should persist */
export interface GeneratedEmbedding {
  jobId: string;
  embedding: number[];
}

export interface ResumeForMatch {
  text: string;
  embedding: number[];
}

export interface JobForMatch {
  id: string;
  source_id: string;
  company: string;
  role: string;
  description: string | null;
  location: string | null;
  tags: string[];
  embedding: number[];
}

/** Max jobs to generate embeddings for on-the-fly per batch */
const MAX_LIVE_EMBEDDINGS = 5;

export async function batchMatchJobs(
  resume: ResumeForMatch,
  jobs: JobForMatch[],
): Promise<{ results: BatchMatchResult[]; generatedEmbeddings: GeneratedEmbedding[] }> {
  // 1. Separate jobs into those with/without embeddings
  const jobsWithDesc = jobs.filter(
    (j) => j.description && j.description.trim().length >= 50,
  );
  const needsEmbedding = jobsWithDesc.filter(
    (j) => !j.embedding || j.embedding.length === 0,
  );
  const hasEmbedding = jobsWithDesc.filter(
    (j) => j.embedding && j.embedding.length > 0,
  );

  // 2. Batch-generate missing embeddings (single API call, capped)
  const toGenerate = needsEmbedding.slice(0, MAX_LIVE_EMBEDDINGS);
  const generatedEmbeddings: GeneratedEmbedding[] = [];

  if (toGenerate.length > 0) {
    const texts = toGenerate.map((j) =>
      [j.role, j.company, j.description, j.location, ...j.tags]
        .filter(Boolean)
        .join(" "),
    );
    const embeddings = await generateEmbeddingsBatch(texts);
    for (let i = 0; i < toGenerate.length; i++) {
      toGenerate[i].embedding = embeddings[i];
      generatedEmbeddings.push({ jobId: toGenerate[i].id, embedding: embeddings[i] });
    }
  }

  // 3. Merge: jobs that already had embeddings + newly generated
  const scorableJobs = [...hasEmbedding, ...toGenerate];

  // 4. Score all jobs (CPU-only, fast)
  const results: BatchMatchResult[] = scorableJobs.map((job) => {
    const match = computeVectorMatchScore(
      resume.embedding,
      job.embedding,
      resume.text,
      job.description!,
    );

    const missingSkills = match.reasons
      .find((r) => r.startsWith("Missing skills:"))
      ?.replace("Missing skills:", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

    return {
      jobId: job.id,
      sourceId: job.source_id,
      company: job.company,
      role: job.role,
      missingSkills,
      ...match,
    };
  });

  return {
    results: results.sort((a, b) => b.overallScore - a.overallScore),
    generatedEmbeddings,
  };
}

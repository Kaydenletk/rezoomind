/**
 * Vector-Based Job Matching
 * Uses OpenAI embeddings + cosine similarity for precise skill and experience matching
 */

import { cosineSimilarity } from '@/lib/ai/embeddings';

export interface VectorMatchResult {
     skillMatch: number;       // 0–100 percentage
     experienceMatch: number;  // 0–100 percentage
     overallScore: number;     // 0–100 percentage
     reasons: string[];
}

/**
 * Extract years of experience mentioned in text
 */
function extractYearsOfExperience(text: string): number[] {
     if (!text) return [];
     const patterns = [
          /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/gi,
          /(?:experience|exp)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)/gi,
          /(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|with|of)/gi,
     ];

     const years: number[] = [];
     for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
               const num = parseInt(match[1], 10);
               if (num > 0 && num < 50) {
                    years.push(num);
               }
          }
     }
     return [...new Set(years)];
}

/**
 * Extract key skills from text for reasoning
 */
function extractSkillKeywords(text: string): string[] {
     const skillPatterns = [
          // Programming languages
          /\b(python|java|javascript|typescript|c\+\+|c#|go|rust|ruby|swift|kotlin|scala|php|r)\b/gi,
          // Frameworks & tools
          /\b(react|angular|vue|node\.?js|django|flask|spring|express|next\.?js|docker|kubernetes|aws|gcp|azure)\b/gi,
          // Data & ML
          /\b(sql|nosql|mongodb|postgresql|redis|tensorflow|pytorch|pandas|numpy|machine learning|deep learning|nlp)\b/gi,
          // General tech
          /\b(api|rest|graphql|microservices|ci\/cd|git|agile|scrum|devops|cloud|backend|frontend|full.?stack)\b/gi,
     ];

     const skills = new Set<string>();
     for (const pattern of skillPatterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
               skills.add(match[1].toLowerCase());
          }
     }
     return [...skills];
}

/**
 * Compute experience match score
 * Compares years of experience mentioned in resume vs job description
 */
function computeExperienceMatch(
     resumeText: string,
     jobDescription: string
): { score: number; reason: string | null } {
     const resumeYears = extractYearsOfExperience(resumeText);
     const jobYears = extractYearsOfExperience(jobDescription);

     // If job doesn't specify years, default to 100% match
     if (jobYears.length === 0) {
          return { score: 100, reason: null };
     }

     // If resume doesn't mention years, give partial credit
     if (resumeYears.length === 0) {
          return { score: 60, reason: 'Experience years not specified in resume' };
     }

     const maxResumeYears = Math.max(...resumeYears);
     const maxJobYears = Math.max(...jobYears);

     if (maxResumeYears >= maxJobYears) {
          return {
               score: 100,
               reason: `${maxResumeYears}+ years experience (${maxJobYears}+ required)`,
          };
     }

     // Partial match: ratio of experience
     const ratio = maxResumeYears / maxJobYears;
     const score = Math.round(Math.min(100, ratio * 100));
     return {
          score,
          reason: `${maxResumeYears} years experience (${maxJobYears}+ required)`,
     };
}

/**
 * Compute skill match using common keywords between resume and job
 */
function computeKeywordSkillOverlap(
     resumeText: string,
     jobDescription: string
): { overlapping: string[]; jobOnly: string[] } {
     const resumeSkills = new Set(extractSkillKeywords(resumeText));
     const jobSkills = extractSkillKeywords(jobDescription);

     const overlapping = jobSkills.filter((s) => resumeSkills.has(s));
     const jobOnly = jobSkills.filter((s) => !resumeSkills.has(s));

     return {
          overlapping: [...new Set(overlapping)],
          jobOnly: [...new Set(jobOnly)],
     };
}

/**
 * Compute vector match score between resume and job embeddings
 * Combines cosine similarity with keyword-based analysis
 */
export function computeVectorMatchScore(
     resumeEmbedding: number[],
     jobEmbedding: number[],
     resumeText: string,
     jobDescription: string
): VectorMatchResult {
     const reasons: string[] = [];

     // 1. Cosine similarity for overall semantic match
     const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
     // Normalize: cosine similarity for text embeddings typically ranges 0.5–0.95
     // Map to 0–100 scale with a floor at 0.3
     const normalizedSimilarity = Math.max(0, Math.min(1, (similarity - 0.3) / 0.65));

     // 2. Skill match: blend of vector similarity + keyword overlap
     const { overlapping, jobOnly } = computeKeywordSkillOverlap(
          resumeText,
          jobDescription
     );

     let keywordRatio = 0;
     if (overlapping.length + jobOnly.length > 0) {
          keywordRatio = overlapping.length / (overlapping.length + jobOnly.length);
     }

     // Blend: 60% vector similarity, 40% keyword overlap
     const skillMatch = Math.round(
          (normalizedSimilarity * 0.6 + keywordRatio * 0.4) * 100
     );

     if (overlapping.length > 0) {
          reasons.push(`Matching skills: ${overlapping.slice(0, 5).join(', ')}`);
     }
     if (jobOnly.length > 0) {
          reasons.push(`Missing skills: ${jobOnly.slice(0, 3).join(', ')}`);
     }

     // 3. Experience match
     const experience = computeExperienceMatch(resumeText, jobDescription);
     if (experience.reason) {
          reasons.push(experience.reason);
     }

     // 4. Overall score: weighted combination
     const overallScore = Math.round(skillMatch * 0.7 + experience.score * 0.3);

     return {
          skillMatch: Math.min(100, skillMatch),
          experienceMatch: Math.min(100, experience.score),
          overallScore: Math.min(100, overallScore),
          reasons,
     };
}

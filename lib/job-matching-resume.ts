import { buildJobKeywords, extractKeywords, mergeKeywords, tokenize, uniqueList } from "@/lib/matching/keywords";

export type MatchPreferences = {
  roles: string[];
  locations: string[];
  keywords: string[];
};

export type MatchJob = {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  description: string | null;
  job_keywords?: string[] | null;
};

export type JobMatchScore = {
  jobId: string;
  score: number;
  reasons: string[];
};

const MAX_POINTS = 16;

const normalizeList = (values: string[] | null | undefined) =>
  (values ?? []).map((value) => value.toLowerCase().trim()).filter(Boolean);

const matchLocation = (location: string | null, preferences: string[]) => {
  if (!location) return null;
  const jobLoc = location.toLowerCase();
  return preferences.find((pref) => {
    const normalized = pref.toLowerCase();
    if (!normalized) return false;
    if (jobLoc.includes(normalized)) return true;
    if (normalized === "remote" && jobLoc.includes("remote")) return true;
    if (normalized === "hybrid" && jobLoc.includes("hybrid")) return true;
    return false;
  }) ?? null;
};

const matchRole = (role: string, tags: string[], preferences: string[]) => {
  const roleText = role.toLowerCase();
  return preferences.find((pref) => {
    const normalized = pref.toLowerCase();
    return roleText.includes(normalized) || tags.some((tag) => tag.includes(normalized));
  }) ?? null;
};

export const computeMatchScore = (
  job: MatchJob,
  resumeKeywords: string[],
  preferences: MatchPreferences
): { score: number; reasons: string[] } => {
  const rolePrefs = normalizeList(preferences.roles);
  const locationPrefs = normalizeList(preferences.locations);
  const keywordPrefs = normalizeList(preferences.keywords);

  const combinedKeywords = mergeKeywords(resumeKeywords, keywordPrefs);
  const keywordSet = new Set(combinedKeywords);

  const tagTokens = normalizeList(job.tags ?? []);
  const titleTokens = tokenize(job.role);
  const descriptionTokens =
    job.description && job.description.length > 0
      ? tokenize(job.description)
      : job.job_keywords ?? buildJobKeywords(job);

  const descMatches = uniqueList(descriptionTokens.filter((token) => keywordSet.has(token)));
  const titleMatches = uniqueList(titleTokens.filter((token) => keywordSet.has(token)));
  const tagMatches = uniqueList(tagTokens.filter((token) => keywordSet.has(token)));

  const descScore = Math.min(descMatches.length, 6);
  const titleScore = Math.min(titleMatches.length, 3);
  const tagScore = Math.min(tagMatches.length, 2);

  let score = descScore + titleScore + tagScore;
  const reasons: string[] = [];

  const matchedRole = rolePrefs.length > 0 ? matchRole(job.role, tagTokens, rolePrefs) : null;
  if (matchedRole) {
    score += 3;
    reasons.push(`Role: ${matchedRole}`);
  }

  const matchedLocation = locationPrefs.length > 0 ? matchLocation(job.location, locationPrefs) : null;
  if (matchedLocation) {
    score += 2;
    reasons.push(`Location: ${matchedLocation}`);
  }

  const matchedKeywords = uniqueList([...titleMatches, ...descMatches, ...tagMatches]).slice(0, 3);
  if (matchedKeywords.length > 0) {
    reasons.push(`Skills: ${matchedKeywords.join(", ")}`);
  }

  if (score <= 0) {
    return { score: 0, reasons: [] };
  }

  const normalizedScore = Math.min(100, Math.round((score / MAX_POINTS) * 100));
  return { score: normalizedScore, reasons: reasons.slice(0, 3) };
};

export const rankJobMatches = (
  jobs: MatchJob[],
  resumeKeywords: string[],
  preferences: MatchPreferences,
  limit = 20
): JobMatchScore[] => {
  const results = jobs
    .map((job) => {
      const { score, reasons } = computeMatchScore(job, resumeKeywords, preferences);
      return { jobId: job.id, score, reasons };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
};

export const getResumeKeywords = (resumeText: string | null, resumeKeywords?: string[] | null) => {
  if (resumeKeywords && resumeKeywords.length > 0) return resumeKeywords;
  if (!resumeText) return [];
  return extractKeywords(resumeText, 120);
};

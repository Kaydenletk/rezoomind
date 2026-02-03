const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "our",
  "ours",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "was",
  "we",
  "were",
  "with",
  "you",
  "your",
  "years",
  "year",
  "team",
  "experience",
  "work",
  "role",
  "responsibilities",
  "requirements",
  "skills",
  "ability",
  "preferred",
  "including",
  "using",
  "will",
  "must",
  "plus",
  "strong",
  "new",
  "job",
  "position",
  "intern",
  "internship",
  "engineer",
  "developer",
  "software",
  "company",
  "candidate",
  "candidates",
  "opportunity",
  "about",
  "who",
  "what",
  "why",
  "how",
]);

const normalizeToken = (token: string) => token.trim().toLowerCase();

export const tokenize = (text: string): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => normalizeToken(token))
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
};

export const uniqueList = (items: string[]): string[] => Array.from(new Set(items));

export const extractKeywords = (text: string, limit = 120): string[] => {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
};

export const mergeKeywords = (...lists: Array<string[] | null | undefined>) => {
  const merged: string[] = [];
  for (const list of lists) {
    if (!list) continue;
    for (const item of list) {
      const normalized = normalizeToken(item);
      if (normalized.length > 2 && !STOPWORDS.has(normalized)) {
        merged.push(normalized);
      }
    }
  }
  return uniqueList(merged);
};

export const buildJobKeywords = (input: {
  role: string;
  company: string;
  location?: string | null;
  tags?: string[] | null;
  description?: string | null;
}): string[] => {
  const text = [
    input.role,
    input.company,
    input.location ?? "",
    ...(input.tags ?? []),
    input.description ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return extractKeywords(text, 120);
};

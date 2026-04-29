/**
 * Fetches jobs from SimplifyJobs GitHub repos — internships + new grad.
 * Parses HTML tables + category counts from the README.
 */

export interface GitHubJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  /** ISO 8601 timestamp parsed from relative ages like "0d", "5h", "1mo". Empty string if unparseable. */
  datePosted: string;
  /** Original raw age token (e.g. "0d", "1mo") for display fallback. */
  rawAge: string;
  category: string;
  tags: string[];
}

export interface CategoryCounts {
  swe: number;
  pm: number;
  dsml: number;
  quant: number;
  hardware: number;
  total: number;
}

interface SourceConfig {
  url: string;
  level: "internship" | "newGrad";
  /** Tag added to every row from this source. */
  rowTag: string;
  /** ID prefix to keep IDs unique across sources. */
  idPrefix: string;
  /** Section header substrings → category key. Order defines parse boundaries. */
  sections: Array<{ pattern: string; category: string }>;
  /** Regex matching the "Browse N Roles" total in the README header. */
  totalRegex: RegExp;
}

const INTERNSHIP_SOURCE: SourceConfig = {
  url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md",
  level: "internship",
  rowTag: "internship",
  idPrefix: "int",
  sections: [
    { pattern: "Software Engineering Internship Roles", category: "swe" },
    { pattern: "Product Management Internship Roles", category: "pm" },
    { pattern: "Data Science, AI & Machine Learning Internship Roles", category: "dsml" },
    { pattern: "Quantitative Finance Internship Roles", category: "quant" },
    { pattern: "Hardware Engineering Internship Roles", category: "hardware" },
  ],
  totalRegex: /Browse\s+(\d[\d,]+)\s+Internship/,
};

const NEW_GRAD_SOURCE: SourceConfig = {
  url: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md",
  level: "newGrad",
  rowTag: "new-grad",
  idPrefix: "ng",
  sections: [
    { pattern: "Software Engineering New Grad Roles", category: "swe" },
    { pattern: "Product Management New Grad Roles", category: "pm" },
    { pattern: "Data Science, AI & Machine Learning New Grad Roles", category: "dsml" },
    { pattern: "Quantitative Finance New Grad Roles", category: "quant" },
    { pattern: "Hardware Engineering New Grad Roles", category: "hardware" },
  ],
  totalRegex: /Browse\s+(\d[\d,]+)\s+New\s+Grad/,
};

/**
 * Convert SimplifyJobs relative age tokens into ISO timestamps.
 * Accepts: "0d", "5h", "30m", "2w", "1mo", "1y". Returns null on unknown shape.
 */
export function parseRelativeAge(raw: string, now: Date = new Date()): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  // Already ISO-ish — let Date handle.
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const match = trimmed.match(/^(\d+)\s*(mo|m|h|d|w|y)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (Number.isNaN(n)) return null;
  const unit = match[2];
  const ms =
    unit === "m" ? n * 60_000 :
    unit === "h" ? n * 3_600_000 :
    unit === "d" ? n * 86_400_000 :
    unit === "w" ? n * 7 * 86_400_000 :
    unit === "mo" ? n * 30 * 86_400_000 :
    unit === "y" ? n * 365 * 86_400_000 :
    null;
  if (ms === null) return null;
  return new Date(now.getTime() - ms).toISOString();
}

function parseHTMLRows(
  html: string,
  category: string,
  startIdx: number,
  source: SourceConfig,
  now: Date,
): GitHubJob[] {
  const jobs: GitHubJob[] = [];
  const rows = html.split("<tr>");

  for (const row of rows) {
    if (!row.includes("<td>")) continue;
    if (row.includes("🔒")) continue;
    if (row.includes("↳")) continue;

    const cells = row
      .split("<td>")
      .slice(1)
      .map((c) => c.split("</td>")[0]?.trim() ?? "");
    if (cells.length < 4) continue;

    const companyMatch = cells[0].match(/>([^<]+)<\/a>/);
    const company =
      companyMatch?.[1]?.replace(/^🔥\s*/, "").trim() ??
      cells[0].replace(/<[^>]+>/g, "").trim();

    const roleText = cells[1].replace(/<[^>]+>/g, "").trim();

    const location =
      cells[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&[^;]+;/g, " ")
        .trim()
        .split(/\s{2,}/)[0] ?? "USA";

    const applyMatch = cells[3].match(/href="(https?:\/\/[^"]+)"/);
    const url = applyMatch?.[1] ?? "";

    const rawAge = cells[4]?.replace(/<[^>]+>/g, "").trim() ?? "";
    const isoDate = parseRelativeAge(rawAge, now) ?? "";

    if (!company || !roleText) continue;

    const idx = startIdx + jobs.length;
    const id = `${source.idPrefix}-${category}-${idx}-${company}-${roleText}`
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase()
      .slice(0, 80);

    jobs.push({
      id,
      company,
      role: roleText,
      location: location || "USA",
      url,
      datePosted: isoDate,
      rawAge,
      category,
      tags: [source.rowTag],
    });
  }

  return jobs;
}

function parseCategoryCounts(md: string, source: SourceConfig): CategoryCounts {
  const counts: CategoryCounts = { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 };

  const totalMatch = md.match(source.totalRegex);
  if (totalMatch) counts.total = parseInt(totalMatch[1].replace(/,/g, ""), 10);

  const lines = md.split("\n");
  for (const line of lines) {
    const countMatch = line.match(/\*\*\s+\((\d+)\)\s*$/);
    if (!countMatch) continue;
    const n = parseInt(countMatch[1], 10);

    if (line.includes("Software Engineering")) counts.swe = n;
    else if (line.includes("Product Management")) counts.pm = n;
    else if (line.includes("Data Science")) counts.dsml = n;
    else if (line.includes("Quantitative Finance")) counts.quant = n;
    else if (line.includes("Hardware Engineering")) counts.hardware = n;
  }

  if (!counts.total) {
    counts.total = counts.swe + counts.pm + counts.dsml + counts.quant + counts.hardware;
  }

  return counts;
}

async function fetchSource(
  source: SourceConfig,
  startIdx: number,
  now: Date,
): Promise<{ jobs: GitHubJob[]; counts: CategoryCounts }> {
  const empty: CategoryCounts = { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 };
  try {
    const res = await fetch(source.url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "rezoomind-dashboard" },
    });
    if (!res.ok) return { jobs: [], counts: empty };

    const md = await res.text();
    const counts = parseCategoryCounts(md, source);

    const allJobs: GitHubJob[] = [];
    for (let i = 0; i < source.sections.length; i++) {
      const section = source.sections[i];
      const sectionIdx = md.indexOf(section.pattern);
      if (sectionIdx === -1) continue;

      const nextSection = source.sections[i + 1];
      const endIdx = nextSection
        ? md.indexOf(nextSection.pattern, sectionIdx)
        : md.length;
      const sectionText = md.slice(sectionIdx, endIdx);

      const jobs = parseHTMLRows(sectionText, section.category, startIdx + allJobs.length, source, now);
      allJobs.push(...jobs);
    }

    return { jobs: allJobs, counts };
  } catch {
    return { jobs: [], counts: empty };
  }
}

function mergeCounts(a: CategoryCounts, b: CategoryCounts): CategoryCounts {
  return {
    swe: a.swe + b.swe,
    pm: a.pm + b.pm,
    dsml: a.dsml + b.dsml,
    quant: a.quant + b.quant,
    hardware: a.hardware + b.hardware,
    total: a.total + b.total,
  };
}

export async function fetchGitHubJobs(): Promise<{
  jobs: GitHubJob[];
  counts: CategoryCounts;
}> {
  const now = new Date();
  const [internships, newGrads] = await Promise.all([
    fetchSource(INTERNSHIP_SOURCE, 0, now),
    fetchSource(NEW_GRAD_SOURCE, 0, now),
  ]);

  // Interleave so feed isn't all internships first; sort by parsed date desc.
  const merged = [...internships.jobs, ...newGrads.jobs].sort((a, b) => {
    if (!a.datePosted && !b.datePosted) return 0;
    if (!a.datePosted) return 1;
    if (!b.datePosted) return -1;
    return b.datePosted.localeCompare(a.datePosted);
  });

  return {
    jobs: merged,
    counts: mergeCounts(internships.counts, newGrads.counts),
  };
}

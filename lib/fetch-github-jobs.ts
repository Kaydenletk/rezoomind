/**
 * Fetches jobs from SimplifyJobs GitHub repo — ALL categories.
 * Parses HTML tables + category counts from the README.
 */

export interface GitHubJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
}

export interface CategoryCounts {
  swe: number;
  pm: number;
  dsml: number;
  quant: number;
  hardware: number;
  total: number;
}

const SIMPLIFY_URL =
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md";

// Section headers in the README → category keys
const SECTIONS: Array<{ pattern: string; category: string; label: string }> = [
  { pattern: "Software Engineering Internship Roles", category: "swe", label: "SWE" },
  { pattern: "Product Management Internship Roles", category: "pm", label: "PM" },
  { pattern: "Data Science, AI & Machine Learning Internship Roles", category: "dsml", label: "DS/ML" },
  { pattern: "Quantitative Finance Internship Roles", category: "quant", label: "Quant" },
  { pattern: "Hardware Engineering Internship Roles", category: "hardware", label: "Hardware" },
];

function parseHTMLRows(html: string, category: string, startIdx: number): GitHubJob[] {
  const jobs: GitHubJob[] = [];
  const rows = html.split("<tr>");

  for (const row of rows) {
    if (!row.includes("<td>")) continue;
    if (row.includes("🔒")) continue;

    const cells = row.split("<td>").slice(1).map((c) => c.split("</td>")[0]?.trim() ?? "");
    if (cells.length < 4) continue;

    // Company
    const companyMatch = cells[0].match(/>([^<]+)<\/a>/);
    const company = companyMatch?.[1]?.replace(/^🔥\s*/, "").trim() ?? cells[0].replace(/<[^>]+>/g, "").trim();

    // Role
    const roleText = cells[1].replace(/<[^>]+>/g, "").trim();

    // Location
    const location = cells[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&[^;]+;/g, " ")
      .trim()
      .split(/\s{2,}/)[0] ?? "USA";

    // Apply link
    const applyMatch = cells[3].match(/href="(https?:\/\/[^"]+)"/);
    const url = applyMatch?.[1] ?? "";

    // Date
    const datePosted = cells[4]?.replace(/<[^>]+>/g, "").trim() ?? "";

    if (!company || !roleText) continue;

    const idx = startIdx + jobs.length;
    jobs.push({
      id: `${category}-${idx}-${company}-${roleText}`.replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 80),
      company,
      role: roleText,
      location: location || "USA",
      url,
      datePosted,
      category,
    });
  }

  return jobs;
}

/** Parse category counts from the summary header in the README */
function parseCategoryCounts(md: string): CategoryCounts {
  const counts: CategoryCounts = { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 };

  // "Browse 1575 Internship Roles by Category"
  const totalMatch = md.match(/Browse\s+(\d[\d,]+)\s+Internship/);
  if (totalMatch) counts.total = parseInt(totalMatch[1].replace(/,/g, ""), 10);

  // "Software Engineering...** (447)"
  const sweMatch = md.match(/Software Engineering[^(]*\((\d+)\)/);
  if (sweMatch) counts.swe = parseInt(sweMatch[1], 10);

  const pmMatch = md.match(/Product Management[^(]*\((\d+)\)/);
  if (pmMatch) counts.pm = parseInt(pmMatch[1], 10);

  const dsmlMatch = md.match(/Data Science[^(]*\((\d+)\)/);
  if (dsmlMatch) counts.dsml = parseInt(dsmlMatch[1], 10);

  const quantMatch = md.match(/Quantitative Finance[^(]*\((\d+)\)/);
  if (quantMatch) counts.quant = parseInt(quantMatch[1], 10);

  const hwMatch = md.match(/Hardware Engineering[^(]*\((\d+)\)/);
  if (hwMatch) counts.hardware = parseInt(hwMatch[1], 10);

  if (!counts.total) {
    counts.total = counts.swe + counts.pm + counts.dsml + counts.quant + counts.hardware;
  }

  return counts;
}

export async function fetchGitHubJobs(): Promise<{
  jobs: GitHubJob[];
  counts: CategoryCounts;
}> {
  try {
    const res = await fetch(SIMPLIFY_URL, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "rezoomind-dashboard" },
    });
    if (!res.ok) return { jobs: [], counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 } };

    const md = await res.text();
    const counts = parseCategoryCounts(md);

    // Parse jobs from each category section
    const allJobs: GitHubJob[] = [];
    for (let i = 0; i < SECTIONS.length; i++) {
      const section = SECTIONS[i];
      const sectionIdx = md.indexOf(section.pattern);
      if (sectionIdx === -1) continue;

      // Get text from this section header to the next section header (or end)
      const nextSection = SECTIONS[i + 1];
      const endIdx = nextSection ? md.indexOf(nextSection.pattern, sectionIdx) : md.length;
      const sectionText = md.slice(sectionIdx, endIdx);

      const jobs = parseHTMLRows(sectionText, section.category, allJobs.length);
      allJobs.push(...jobs);
    }

    return { jobs: allJobs, counts };
  } catch {
    return { jobs: [], counts: { swe: 0, pm: 0, dsml: 0, quant: 0, hardware: 0, total: 0 } };
  }
}

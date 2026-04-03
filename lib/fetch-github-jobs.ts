/**
 * Fetches job listings directly from SimplifyJobs GitHub repo.
 * Parses HTML tables in the markdown.
 */

interface GitHubJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: "usa-intern" | "usa-newgrad" | "intl-intern" | "intl-newgrad";
}

interface GitHubJobCounts {
  usaInternships: number;
  usaNewGrad: number;
  intlInternships: number;
  intlNewGrad: number;
}

const REPOS = [
  {
    url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md",
    category: "usa-intern" as const,
    label: "USA Internships",
  },
];

function parseHTMLTable(html: string, category: GitHubJob["category"]): GitHubJob[] {
  const jobs: GitHubJob[] = [];

  // Split into table rows
  const rows = html.split("<tr>");

  for (const row of rows) {
    // Skip header rows and rows without data
    if (!row.includes("<td>")) continue;
    // Skip closed positions (🔒)
    if (row.includes("🔒")) continue;

    // Extract cells
    const cells = row.split("<td>").slice(1).map((cell) => {
      return cell.split("</td>")[0]?.trim() ?? "";
    });

    if (cells.length < 4) continue;

    // Cell 0: Company (with link)
    const companyMatch = cells[0].match(/>([^<]+)<\/a>/);
    const company = companyMatch?.[1]?.replace(/^🔥\s*/, "").trim() ?? cells[0].replace(/<[^>]+>/g, "").trim();

    // Cell 1: Role (with link)
    const roleText = cells[1].replace(/<[^>]+>/g, "").trim();

    // Cell 2: Location
    const location = cells[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&[^;]+;/g, " ")
      .trim()
      .split(/\s{2,}/)[0] ?? "USA";

    // Cell 3: Apply link
    const applyMatch = cells[3].match(/href="(https?:\/\/[^"]+)"/);
    const url = applyMatch?.[1] ?? "";

    // Cell 4: Date
    const datePosted = cells[4]?.replace(/<[^>]+>/g, "").trim() ?? "";

    if (!company || !roleText) continue;

    const idx = jobs.length;
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

export async function fetchGitHubJobs(): Promise<{
  jobs: GitHubJob[];
  counts: GitHubJobCounts;
}> {
  const allJobs: GitHubJob[] = [];

  for (const repo of REPOS) {
    try {
      const res = await fetch(repo.url, {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "rezoomind-dashboard" },
      });
      if (!res.ok) continue;
      const md = await res.text();
      const jobs = parseHTMLTable(md, repo.category);
      allJobs.push(...jobs);
    } catch {
      // Skip failed fetches
    }
  }

  const counts: GitHubJobCounts = {
    usaInternships: allJobs.filter((j) => j.category === "usa-intern").length,
    usaNewGrad: allJobs.filter((j) => j.category === "usa-newgrad").length,
    intlInternships: 0,
    intlNewGrad: 0,
  };

  return { jobs: allJobs, counts };
}

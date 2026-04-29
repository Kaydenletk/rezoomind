import { unstable_cache } from "next/cache";

import { inferCategory } from "@/lib/job-category";
import { parseDatePostedToAge } from "@/lib/job-priority";
import { GitHubJobsScraper } from "@/lib/scrapers";

export interface PublicJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
  jobType: "internship" | "new-grad";
  region: "usa" | "international";
  tags: string[];
  description: string | null;
}

export interface PublicJobCounts {
  swe: number;
  pm: number;
  dsml: number;
  quant: number;
  hardware: number;
  internship: number;
  newGrad: number;
  remote: number;
  total: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MEMORY_CACHE_TTL_MS = 15 * 60 * 1000;

type PublicInventoryResult = {
  jobs: PublicJob[];
  counts: PublicJobCounts;
};

let memoryCachedInventory: {
  value: PublicInventoryResult;
  expiresAt: number;
} | null = null;
let inFlightInventoryPromise: Promise<PublicInventoryResult> | null = null;

function formatDatePosted(date: Date | null) {
  if (!date) return "—";
  return `${MONTH_NAMES[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}`;
}

function toPublicJobCounts(jobs: PublicJob[]): PublicJobCounts {
  return jobs.reduce<PublicJobCounts>(
    (counts, job) => {
      counts.total += 1;
      counts[job.category as keyof Pick<PublicJobCounts, "swe" | "pm" | "dsml" | "quant" | "hardware">] += 1;
      if (job.jobType === "internship") counts.internship += 1;
      if (job.jobType === "new-grad") counts.newGrad += 1;
      if (job.location.toLowerCase().includes("remote")) counts.remote += 1;
      return counts;
    },
    {
      swe: 0,
      pm: 0,
      dsml: 0,
      quant: 0,
      hardware: 0,
      internship: 0,
      newGrad: 0,
      remote: 0,
      total: 0,
    }
  );
}

const loadPublicJobInventory = unstable_cache(
  async () => {
    const scraper = new GitHubJobsScraper();
    const result = await scraper.scrape();
    const uniqueJobs = new Map<string, PublicJob>();

    for (const job of result.jobs) {
      const jobType = job.tags.includes("new-grad") ? "new-grad" : "internship";
      const region = job.tags.includes("international") ? "international" : "usa";
      const normalized: PublicJob = {
        id: job.sourceId,
        company: job.company,
        role: job.role,
        location: job.location ?? "Unknown",
        url: job.url ?? "",
        datePosted: formatDatePosted(job.datePosted),
        category: inferCategory(job.role, job.tags),
        jobType,
        region,
        tags: job.tags,
        description: job.description,
      };

      uniqueJobs.set(normalized.id, normalized);
    }

    const jobs = [...uniqueJobs.values()].sort((a, b) => {
      const ageA = parseDatePostedToAge(a.datePosted);
      const ageB = parseDatePostedToAge(b.datePosted);

      if (ageA === null && ageB === null) return a.company.localeCompare(b.company);
      if (ageA === null) return 1;
      if (ageB === null) return -1;
      if (ageA !== ageB) return ageA - ageB;
      return a.company.localeCompare(b.company);
    });

    return {
      jobs,
      counts: toPublicJobCounts(jobs),
    };
  },
  ["public-job-inventory"],
  { revalidate: 3600 }
);

export async function getPublicJobInventory() {
  try {
    const now = Date.now();
    if (memoryCachedInventory && memoryCachedInventory.expiresAt > now) {
      return memoryCachedInventory.value;
    }

    if (!inFlightInventoryPromise) {
      inFlightInventoryPromise = loadPublicJobInventory().then((value) => {
        memoryCachedInventory = {
          value,
          expiresAt: Date.now() + MEMORY_CACHE_TTL_MS,
        };
        return value;
      }).finally(() => {
        inFlightInventoryPromise = null;
      });
    }

    return await inFlightInventoryPromise;
  } catch {
    return {
      jobs: [] as PublicJob[],
      counts: {
        swe: 0,
        pm: 0,
        dsml: 0,
        quant: 0,
        hardware: 0,
        internship: 0,
        newGrad: 0,
        remote: 0,
        total: 0,
      } satisfies PublicJobCounts,
    };
  }
}

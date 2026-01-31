/**
 * Scraper configuration - search terms, locations, and tier definitions
 */

export const SEARCH_TERMS = [
  'software engineer intern',
  'software engineering internship',
  'data science intern',
  'machine learning intern',
  'frontend developer intern',
  'backend developer intern',
  'full stack intern',
];

export const LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Remote',
  'Boston, MA',
  'Los Angeles, CA',
];

// Tier configuration determines how often each scraper runs
export const SCRAPER_TIERS = {
  1: {
    name: 'hourly',
    description: 'Runs every hour',
    runAtHours: null as null,  // null means every hour
  },
  2: {
    name: '4x-daily',
    description: 'Runs 4 times per day',
    runAtHours: [0, 6, 12, 18] as number[],
  },
  3: {
    name: 'daily',
    description: 'Runs once per day at midnight',
    runAtHours: [0] as number[],
  },
} as const;

// Check if a scraper tier should run at the given hour
export function shouldRunAtHour(tier: 1 | 2 | 3, currentHour: number): boolean {
  const config = SCRAPER_TIERS[tier];

  // Tier 1 runs every hour
  if (config.runAtHours === null) {
    return true;
  }

  // Other tiers run at specific hours
  return config.runAtHours.includes(currentHour);
}

// GitHub repos to scrape for job listings
export const GITHUB_JOB_REPOS = [
  {
    owner: 'speedyapply',
    repo: '2026-SWE-College-Jobs',
    file: 'README.md',
    jobType: 'internship' as const,
    region: 'usa' as const,
  },
  {
    owner: 'speedyapply',
    repo: '2026-SWE-College-Jobs',
    file: 'NEW_GRAD_USA.md',
    jobType: 'new-grad' as const,
    region: 'usa' as const,
  },
  {
    owner: 'speedyapply',
    repo: '2026-SWE-College-Jobs',
    file: 'INTERN_INTL.md',
    jobType: 'internship' as const,
    region: 'international' as const,
  },
  {
    owner: 'speedyapply',
    repo: '2026-SWE-College-Jobs',
    file: 'NEW_GRAD_INTL.md',
    jobType: 'new-grad' as const,
    region: 'international' as const,
  },
];

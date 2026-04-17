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

// Validated 2026-04: 18 proposed slugs returned 404 on Greenhouse public API
// (openai, elevenlabs, retool, rippling, notion, replit, huggingface, perplexityai,
//  mistral, cohere, runway, harvey, modal-labs, wandb, inflection-ai, characterai,
//  browserbase, n8n). These companies likely moved to other ATSs. Only verified slugs kept.
export const GREENHOUSE_COMPANIES: { slug: string; name: string }[] = [
  { slug: 'anthropic', name: 'Anthropic' },
  { slug: 'figma', name: 'Figma' },
  { slug: 'coreweave', name: 'CoreWeave' },
  { slug: 'togetherai', name: 'Together AI' },
  { slug: 'stabilityai', name: 'Stability AI' },
  { slug: 'scaleai', name: 'Scale AI' },
];

// Empty: prior candidates (shopify, netflix, databricks, lyft, zapier, webflow,
// airtable, brex, ramp, mercury) all migrated off Lever (404 or 0 jobs as of 2026-04).
// Add fresh slugs here and flip LeverScraper.enabled to true to re-activate.
export const LEVER_COMPANIES: { slug: string; name: string }[] = [];

// Validated 2026-04: turso, calcom, dub return null boards on Ashby public API; removed.
export const ASHBY_COMPANIES: { slug: string; name: string }[] = [
  { slug: 'linear', name: 'Linear' },
  { slug: 'vercel', name: 'Vercel' },
  { slug: 'loom', name: 'Loom' },
  { slug: 'resend', name: 'Resend' },
  { slug: 'plane', name: 'Plane' },
  { slug: 'raycast', name: 'Raycast' },
];

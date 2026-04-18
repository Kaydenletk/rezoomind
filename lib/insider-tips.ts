/**
 * Insider Tips — daily-rotating insights condensed from career-ops playbooks.
 * Source: /Users/khanhle/career-ops/modes/{auto-pipeline,patterns,contacto,_shared}.md
 *
 * Rotation is deterministic: the same day always shows the same tip so users
 * can't refresh to cherry-pick. Rotation happens at UTC midnight.
 */

export interface InsiderTip {
  id: string;
  category: "timing" | "ats" | "outreach" | "strategy" | "negotiation";
  eyebrow: string;
  headline: string;
  body: string;
  playbookSlug: "before-you-apply" | "the-timing-game" | "hidden-gems";
}

export const INSIDER_TIPS: readonly InsiderTip[] = [
  {
    id: "timing-summer-frontload",
    category: "timing",
    eyebrow: "Timing",
    headline: "68% of Summer internship reqs close by December.",
    body: "Jane Street, Citadel, HRT, and Optiver close 8 months before start dates. If you're applying in March for Summer, you're already competing for leftovers — shift to Fall or pivot to companies with rolling pipelines.",
    playbookSlug: "the-timing-game",
  },
  {
    id: "ats-keyword-density",
    category: "ats",
    eyebrow: "ATS",
    headline: "Under 50% JD keyword match? The ATS filters you before a human reads it.",
    body: "Most Workday and Greenhouse pipelines auto-reject resumes that score below a keyword-match threshold. Copy critical skills verbatim from the JD — \"PostgreSQL\" and \"Postgres\" are different tokens.",
    playbookSlug: "before-you-apply",
  },
  {
    id: "outreach-one-line-hook",
    category: "outreach",
    eyebrow: "Outreach",
    headline: "Lead with their work, not yours.",
    body: "LinkedIn cold DMs convert 3–5x higher when the first sentence is about the recipient's company or recent work. \"I've been using [product] for [purpose]\" beats \"I'm a senior at [school].\"",
    playbookSlug: "hidden-gems",
  },
  {
    id: "ats-cliche-phrases",
    category: "ats",
    eyebrow: "Recruiter read",
    headline: "\"Passionate about,\" \"results-oriented,\" \"proven track record\" — recruiters skim past all three.",
    body: "Every senior recruiter has a mental filter for cliché phrases. Name the actual project, metric, or tool instead. \"Cut p95 latency from 2.1s to 380ms\" beats \"improved performance.\"",
    playbookSlug: "before-you-apply",
  },
  {
    id: "strategy-referral-multiplier",
    category: "strategy",
    eyebrow: "Referrals",
    headline: "Referred candidates get hired at 5–8x the rate of cold applicants.",
    body: "You don't need to \"know\" someone. A 3-sentence LinkedIn message to a team peer — specific hook, one proof point, no ask — counts as a warm intro once they respond.",
    playbookSlug: "hidden-gems",
  },
  {
    id: "negotiation-ask-the-band",
    category: "negotiation",
    eyebrow: "Negotiation",
    headline: "Ask \"what's the band for this role?\" in the first screen.",
    body: "Most recruiters have a comp band before they call you — they just won't share it unless you ask. Not asking leaves 15–30% on the table. You can't negotiate up from an offer you accepted before knowing the range.",
    playbookSlug: "hidden-gems",
  },
  {
    id: "strategy-geo-filter",
    category: "strategy",
    eyebrow: "Geo",
    headline: "Remote-friendly regional roles convert 5x higher for international students.",
    body: "\"Remote, US only\" converts 0% if you need sponsorship. \"Remote, US/Canada\" and \"Remote, Global\" are the sweet spot. Filter early — don't spend 3 hours tailoring for a role that will auto-reject your address.",
    playbookSlug: "hidden-gems",
  },
  {
    id: "ats-cover-letter-when-optional",
    category: "ats",
    eyebrow: "Cover letters",
    headline: "Most students skip the optional cover letter. That's the edge.",
    body: "When the form allows one, include a 1-page letter that quotes the JD and maps each quote to a real project of yours. Puts you in the top 15% of applicants for roles where most people paste their resume and go.",
    playbookSlug: "before-you-apply",
  },
  {
    id: "strategy-score-before-applying",
    category: "strategy",
    eyebrow: "Time budget",
    headline: "Below a 70% match, most roles are time-sinks.",
    body: "If you can't check 5+ required skills from the JD against your resume, your odds of a callback drop off a cliff. Spend that hour on the next role instead of tailoring for a long shot.",
    playbookSlug: "before-you-apply",
  },
  {
    id: "strategy-workday-pitfall",
    category: "strategy",
    eyebrow: "Portal pitfall",
    headline: "Workday parses your resume into a mess. Paste the text too.",
    body: "Workday's resume parser routinely breaks formatting, skips bullets, and misreads dates. Always attach a clean PDF AND paste your resume into the \"text bio\" field if available. Assume at least one recruiter reads only the parsed version.",
    playbookSlug: "before-you-apply",
  },
  {
    id: "strategy-h1b-reality",
    category: "strategy",
    eyebrow: "H1B reality",
    headline: "\"Sponsors H1B\" often means 1–2 filings per year.",
    body: "Some companies technically sponsor but only for senior internal transfers. Check public H1B disclosure data (DOL) for role-level counts, not just the company toggle. A company with 40+ filings last year is very different from one with 2.",
    playbookSlug: "hidden-gems",
  },
  {
    id: "timing-follow-up-cadence",
    category: "timing",
    eyebrow: "Follow-up",
    headline: "No response in 7 days isn't a rejection. It's a reminder.",
    body: "A short, specific follow-up 7–10 days after applying recovers ~20% of stalled applications. Reference one thing from the JD, restate one thing from your resume, ask for the next step. Don't re-send your whole pitch.",
    playbookSlug: "the-timing-game",
  },
  {
    id: "strategy-research-in-10",
    category: "strategy",
    eyebrow: "Due diligence",
    headline: "Research a company in 10 minutes before applying.",
    body: "Glassdoor interview reviews (last 6mo), LinkedIn \"who left recently\", Crunchbase funding trajectory, latest engineering blog post. If 3 of 4 smell off, skip. You're trading your time for theirs — spend it on companies worth the trade.",
    playbookSlug: "hidden-gems",
  },
  {
    id: "outreach-how-you-heard",
    category: "outreach",
    eyebrow: "Process signal",
    headline: "\"How did you hear about us?\" is a test, not a form field.",
    body: "\"Found through [portal], evaluated against my criteria, and this role scored highest\" tells the recruiter you have a process. \"A friend mentioned it\" tells them nothing. Signal is cheap when you're applying to 80 roles — send it.",
    playbookSlug: "the-timing-game",
  },
];

/**
 * Day-of-year (0–365), computed in UTC so a user refreshing at midnight local
 * doesn't see the tip rotate mid-evening.
 */
export function dayOfYearUTC(date: Date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const now = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return Math.floor((now - start) / 86_400_000);
}

export function getTipForDate(
  date: Date = new Date(),
  tips: readonly InsiderTip[] = INSIDER_TIPS,
): InsiderTip {
  if (tips.length === 0) {
    throw new Error("getTipForDate: tips array is empty");
  }
  const index = dayOfYearUTC(date) % tips.length;
  return tips[index];
}

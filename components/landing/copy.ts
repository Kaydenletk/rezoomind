export const LANDING_COPY = {
  hero: {
    unauthed: {
      eyebrow: "Built for students who want a fair shot.",
      headline: "Spend less time applying. Get better outcomes.",
      sub: "AI-scored internships and new-grad roles — plus the rules most students learn too late.",
      primaryCta: "See your fit →",
      secondaryCta: "browse roles",
    },
    authedNoResume: {
      eyebrow: "One upload from a real match score.",
      headline: "Your matches are 20 seconds away.",
      sub: "Paste your resume and we'll score every live role against it.",
      primaryCta: "Upload resume →",
      secondaryCta: "skip for now",
    },
    authedMirror: {
      eyebrow: "Your match — updated hourly.",
      headline: (n: number) => `You match ${n.toLocaleString()} roles this week.`,
      sub: (strong: number, stretch: number, breadth: number) =>
        `${strong} strong fits · ${stretch} stretch · ${breadth} for breadth.`,
      primaryCta: "See my matches →",
      secondaryCta: "filter list",
      loading: "Scoring your fit…",
    },
    trustLine: (totalLive: number, ago: string) =>
      `${totalLive.toLocaleString()} live roles · refreshed ${ago}`,
  },
  topbar: {
    login: "log in",
    signup: "sign up free",
    logout: "log out",
  },
  search: {
    placeholder: "search roles, companies, skills…",
    meta: (matching: number) => `${matching.toLocaleString()} matching · sorted by freshness`,
    sortLabel: "sort: newest ↕",
  },
  filters: {
    internship: "internship",
    newGrad: "new grad",
    remote: "remote",
  },
  emptyFilters: {
    headline: "no matches.",
    suggestHint: "try:",
  },
  ctas: {
    apply: "apply →",
    explore: "explore",
    tailor: "tailor",
  },
  footerHint: (remaining: number) =>
    remaining > 0
      ? `↓ scroll for ${remaining.toLocaleString()} more · or sign up to see personal match scores`
      : "sign up to see personal match scores",
  authNudge: {
    text: "upload resume in 20 seconds to unlock match scores",
    cta: "→",
    dismissLabel: "dismiss",
  },
  digest: {
    liveRoles: { label: "Live roles", sublabel: (ago: string) => `updated ${ago}` },
    freshThisWeek: {
      label: "Fresh this week",
      sublabel: (delta: number) =>
        delta === 0
          ? "same as last week"
          : delta > 0
            ? `+${delta.toLocaleString()} vs last week`
            : `${delta.toLocaleString()} vs last week`,
    },
    remote: {
      label: "Remote roles",
      sublabel: (total: number) => `of ${total.toLocaleString()} total`,
    },
    h1bFriendly: { label: "H1B-friendly", sublabel: "sponsor-tagged companies" },
  },
  trust: {
    headline: "Real data. Fresh every hour.",
    sources: {
      title: "Where this comes from",
      body: (total: number) =>
        `${total.toLocaleString()} public postings from Greenhouse, Lever, Workday, Pitt CSC, and Ouckah. No scraping tricks. No fake counts.`,
    },
    topHiring: {
      title: "Hiring right now",
      caption: "currently posting (public data)",
    },
    velocity: {
      title: "Posting volume · last 7 days",
      caption: (n: number) => `${n.toLocaleString()} new roles this week`,
    },
  },
  footer: {
    line: (ago: string) =>
      `rezoomind · built by a student · data refreshed ${ago} · privacy · terms`,
  },
  insider: {
    eyebrow: "INSIDER",
    sourceAttribution: "from rezoomind's career-ops research",
    readMore: "read the full rule →",
  },
  playbook: {
    sectionEyebrow: "THE PLAYBOOK",
    sectionHeadline: "The rules most students learn too late.",
    sectionSub:
      "Condensed from real rejection patterns, recruiter interviews, and 200+ tracked applications. Updated as the market shifts.",
    cards: {
      beforeYouApply: {
        label: "Before you apply",
        teaser:
          "ATS keyword thresholds, resume parsing traps, and the cover letter most students skip.",
        slug: "before-you-apply",
      },
      theTimingGame: {
        label: "The timing game",
        teaser:
          "When roles open, when they quietly close, and the follow-up cadence that recovers stalled applications.",
        slug: "the-timing-game",
      },
      hiddenGems: {
        label: "Hidden gems",
        teaser:
          "Under-the-radar companies with high intern-to-FTE conversion, real H1B filings, and warm referral paths.",
        slug: "hidden-gems",
      },
    },
    readAffordance: "read →",
    comingSoon: {
      headline: "Coming soon.",
      body: "This playbook is being condensed from real rejection patterns and recruiter interviews. Check back in a few days.",
      backLink: "← back to feed",
    },
  },
} as const;

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
} as const;

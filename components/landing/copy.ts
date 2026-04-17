export const LANDING_COPY = {
  hero: {
    heading: (count: number) => `${count.toLocaleString()} live roles.`,
    sub: "updated hourly · paste your resume for personal match scores",
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
} as const;

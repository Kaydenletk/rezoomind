export const FEED_COPY = {
  trust: {
    separator: " · ",
    freshSuffix: "fresh",
    verified: "cron verified",
    refreshedPrefix: "refreshed",
    appliedTodaySuffix: "applied today",
  },
  aiReason: {
    prefix: "✦ ",
    strong: (skills: string[], missing: string) =>
      `Strong fit — ${skills.join(", ")} match${missing ? `; missing: ${missing}` : ""}`,
    partial: (skills: string[], missing: string[]) =>
      `Partial fit — ${skills.join(", ")} match${missing.length ? `; gap: ${missing.join(", ")}` : ""}`,
    weak: (overlapCount: number) => `Weak fit — only ${overlapCount} overlap`,
  },
  keyboard: {
    footer: "j/k navigate · s save · t tailor · a apply · / search · ? help",
  },
  onboarding: {
    title: "getting_started",
    step1: "01 upload_resume",
    step2: "02 set_preferences",
    step3: "03 first_apply",
  },
  detail: {
    apply: "Apply",
    coverLetterCollapsed: "cover letter — generate",
    coverLetterExpanded: "cover letter — hide",
    viewSource: "view source posting",
  },
} as const;

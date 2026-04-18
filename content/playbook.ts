/**
 * Playbook articles — condensed + re-voiced from career-ops playbooks at
 * /Users/khanhle/career-ops/modes/{auto-pipeline,patterns,contacto,_shared}.md
 *
 * Content is intentionally dense and opinionated. These are not listicles;
 * they are the rules the author wishes someone had told him at the start.
 */

export type PlaybookSlug =
  | "before-you-apply"
  | "the-timing-game"
  | "hidden-gems";

export interface PlaybookSection {
  heading: string;
  paragraphs: string[];
  callout?: { kind: "rule" | "anti"; text: string };
}

export interface PlaybookArticle {
  slug: PlaybookSlug;
  eyebrow: string;
  title: string;
  lede: string;
  readTime: string;
  updated: string;
  sections: PlaybookSection[];
  takeaways: string[];
  cta: { label: string; href: string };
}

export const PLAYBOOK_ARTICLES: Record<PlaybookSlug, PlaybookArticle> = {
  "before-you-apply": {
    slug: "before-you-apply",
    eyebrow: "The Playbook · 01",
    title: "Before you apply",
    lede: "Most students lose the application before a human ever reads it. ATS keyword thresholds, broken resume parsing, and the optional cover letter that nobody fills in. This is the part of the job-search nobody teaches and everyone gets wrong.",
    readTime: "6 min read",
    updated: "2026-04-18",
    sections: [
      {
        heading: "The keyword-density floor",
        paragraphs: [
          "Most Workday, Greenhouse, and Lever pipelines score resumes against the job description before routing them to a recruiter. Under 50% keyword match and your resume goes into the pile a recruiter never opens. Under 70% and you're not competitive with referred candidates.",
          "The fix isn't keyword-stuffing. It's deliberate vocabulary alignment: if the JD says \"PostgreSQL\" and your resume says \"Postgres,\" those are different tokens to the parser. Copy critical skills verbatim. If the JD lists \"React, TypeScript, Next.js\" — that exact phrasing should appear in your resume's skills section.",
        ],
        callout: {
          kind: "rule",
          text: "Rule: mirror the JD's exact phrasing for technical skills. 5+ verbatim matches dramatically improve pass-through.",
        },
      },
      {
        heading: "The Workday parser trap",
        paragraphs: [
          "Workday's resume parser routinely misreads dates, skips bullet points, and breaks formatting. Most students don't realize this — they upload their polished PDF and assume the form's auto-filled fields reflect reality. They don't.",
          "Always do two things: attach the PDF AND paste your resume into the \"paste text\" field if Workday offers it. When the field isn't explicit, paste it into the free-form \"tell us about yourself\" box. Assume at least one reviewer will only see the parsed version, and write accordingly.",
        ],
      },
      {
        heading: "Cliché phrases that get skimmed past",
        paragraphs: [
          "Recruiters at top firms read hundreds of resumes a week. They build mental filters for phrases that carry no information. These are the worst offenders: \"passionate about,\" \"results-oriented,\" \"proven track record,\" \"demonstrated ability to,\" \"spearheaded,\" \"leveraged,\" \"synergies,\" \"robust,\" \"cutting-edge,\" \"in today's fast-paced world.\"",
          "Every one of them should be replaced with a proof point. \"Cut p95 latency from 2.1s to 380ms\" beats \"improved performance.\" \"Postgres + pgvector for retrieval over 12k documents\" beats \"designed scalable RAG architecture.\" The rule: prove it, don't claim it.",
        ],
        callout: {
          kind: "anti",
          text: "Avoid: every variant of \"I'm passionate about...\" — it signals that you have nothing concrete to say.",
        },
      },
      {
        heading: "The optional cover letter edge",
        paragraphs: [
          "Most students skip the optional cover letter. That is the edge. When a role has 500 applicants and 80% don't write one, you're in the top 20% by volume alone — before content quality even matters.",
          "The one-page version that works: open with one specific thing about the company or team (not a boilerplate \"I've long admired...\"), quote one line from the JD and map it to one of your projects, close with one sentence on what you'd learn here. That's it. No padding.",
        ],
      },
      {
        heading: "The 70% rule for deciding to apply",
        paragraphs: [
          "If you can't check at least 5 of the JD's \"required\" skills against your actual resume, the hour you'd spend tailoring is better spent on the next role. Tracked data from hundreds of applications: below roughly 70% JD match, positive outcomes collapse to near zero.",
          "This isn't about lowering your ceiling. It's about spending your tailoring budget where it compounds. Apply to roles you can actually close, not roles you're curious about.",
        ],
      },
    ],
    takeaways: [
      "Mirror JD phrasing verbatim for 5+ technical skills to clear ATS thresholds.",
      "Always paste resume text into Workday fields in addition to the PDF — assume the parser will break.",
      "Replace every cliché phrase with a proof point (metric, tool, project name).",
      "When a cover letter is optional, write one — it puts you in the top 20% by effort alone.",
      "Below 70% JD match, skip the role. Your tailoring budget is finite.",
    ],
    cta: { label: "See your live match scores →", href: "/" },
  },
  "the-timing-game": {
    slug: "the-timing-game",
    eyebrow: "The Playbook · 02",
    title: "The timing game",
    lede: "The students who land competitive internships aren't smarter. They're earlier. Most top-tier programs are effectively closed by December for the following summer — and almost nobody tells you that in September.",
    readTime: "5 min read",
    updated: "2026-04-18",
    sections: [
      {
        heading: "The front-loaded season",
        paragraphs: [
          "Summer internship recruiting at top financial, quant, and tech firms runs on a calendar that's roughly 8 months ahead of where you think it is. Jane Street, Citadel, HRT, Optiver, Two Sigma, and D.E. Shaw open applications in August-September and are effectively full by November-December.",
          "If you're applying to those firms in February for the following summer, you're not late — you're out. The candidates who are in are the ones who applied while you were starting classes.",
        ],
        callout: {
          kind: "rule",
          text: "Rule: top quant and bulge-bracket internships close 8 months before start. Apply in August of year N for summer of year N+1.",
        },
      },
      {
        heading: "The rolling pipelines",
        paragraphs: [
          "Most big-tech and mid-market roles run differently. Google, Meta, Amazon, Microsoft, and most well-funded startups maintain rolling pipelines for new-grad and internship hiring — applications open in waves, and waves close when a target headcount is hit.",
          "For these, the rule inverts: apply within 48 hours of a posting going live. Early applicants get reviewed first, interviewed first, and offered first. By the time a posting has been up a week, the top of the queue is usually already in phone-screen loops.",
        ],
      },
      {
        heading: "The hiring calendar, by month",
        paragraphs: [
          "Peak season is September through January. That's when postings surge, recruiters are actively sourcing, and offer rates are highest. February through April is a transition — postings slow but interviews continue for earlier applicants. May through August is the lull: fewer new postings, but also fewer applicants, so well-targeted applications can still convert.",
          "If you're in the lull and the feeling of stuck is building, that's the time to prep. Practice interviews, update your resume with the semester's work, write the cover-letter templates you'll send in September. The work you do in July compounds when the volume returns.",
        ],
      },
      {
        heading: "The 7-day follow-up",
        paragraphs: [
          "No response in 7 days is not a rejection. It's a reminder. A short, specific follow-up 7–10 days after applying recovers roughly 20% of stalled applications in tracked data. The message isn't \"just following up\" — that wastes the recipient's time.",
          "The version that works: \"Following up on my application for [role]. I noticed your team is working on [specific thing from JD or engineering blog]. I built [relevant project] that handled [specific technical challenge]. Happy to walk through it if useful.\" Three sentences. One hook, one proof, one offer.",
        ],
        callout: {
          kind: "rule",
          text: "Rule: follow up at day 7–10 with one hook + one proof + one offer. Never send \"just checking in.\"",
        },
      },
      {
        heading: "The 48-hour window",
        paragraphs: [
          "Set up job alerts in LinkedIn, Handshake, and the role-specific boards (Pitt CSC, Ouckah, SimplifyJobs). When a match lands, apply inside 48 hours. This is one of the highest-leverage behaviors in the entire job search: posts that are reviewed in the first 48 hours get a disproportionate share of interview slots.",
          "The application doesn't have to be perfect. It has to be in. You can follow up with a tighter cover letter, but the review priority is set by submission time.",
        ],
      },
    ],
    takeaways: [
      "Top quant / bulge-bracket internships close in December for the following summer — apply in August-September.",
      "For rolling pipelines (big tech, startups), apply within 48 hours of posting to clear the review queue.",
      "Treat September-January as peak, Feb-April as transition, May-August as prep time.",
      "Follow up at day 7-10 with a 3-sentence hook-proof-offer message.",
      "Job alerts + 48-hour application window is one of the highest-leverage behaviors in the entire search.",
    ],
    cta: { label: "See what's been posted today →", href: "/" },
  },
  "hidden-gems": {
    slug: "hidden-gems",
    eyebrow: "The Playbook · 03",
    title: "Hidden gems",
    lede: "Every student applies to the same 40 companies. The candidates who land faster have a different target list — smaller companies with 5-8x higher interview rates, real H1B sponsorship data, and referral paths through peers instead of random recruiters.",
    readTime: "7 min read",
    updated: "2026-04-18",
    sections: [
      {
        heading: "The referral multiplier",
        paragraphs: [
          "Referred candidates are hired at roughly 5-8x the rate of cold applicants. You already know this in the abstract. What you probably don't know is that you don't need to \"know\" someone to get a referral — a well-crafted LinkedIn message to a team peer, followed by a reply, legitimately counts as a warm intro.",
          "The message that works is three sentences long. Sentence 1 is a specific hook about the recipient's company, team, or recent work — nothing generic, nothing about you. Sentence 2 is your highest-signal proof point relevant to their role. Sentence 3 is a low-friction ask: \"Would love to chat about [specific topic] for 15 minutes.\" Under 300 characters so it fits a LinkedIn connection request.",
        ],
        callout: {
          kind: "rule",
          text: "Rule: cold DMs → 3 sentences, 300 characters, hook about them, proof from you, low-pressure ask. Never \"I'm passionate about...\"",
        },
      },
      {
        heading: "The H1B sponsorship reality",
        paragraphs: [
          "A company listed as \"sponsors H1B\" might file 1-2 visa petitions a year, usually for senior internal transfers. For international students, that signal is useless. What you actually want is role-level filing counts from the Department of Labor's public disclosure data.",
          "Tools like MyVisaJobs, H1BGrader, and the DOL's disclosure portal let you check how many H1Bs a company filed last year for software engineering roles specifically. A company with 40+ filings is genuinely in the business of sponsoring. A company with 2 is technically sponsoring but you're unlikely to be the one.",
        ],
      },
      {
        heading: "The 10-minute company check",
        paragraphs: [
          "Before you spend an hour tailoring for a role, spend 10 minutes on due diligence. Four sources, two minutes each. Glassdoor interview reviews from the last 6 months — what's the process, what do they ask, what's the rejection rate. LinkedIn's \"who left this company recently and where did they go\" — if senior people are leaving for lateral roles at smaller companies, that's a signal.",
          "Crunchbase funding trajectory — are they raising, flat, or bridging? And their latest engineering blog post — does the team ship? Does it look like a place where you'd learn? If 3 of those 4 signals come back off, skip the role. You are trading your time for theirs. Spend it on companies worth the trade.",
        ],
      },
      {
        heading: "Where the hidden companies are",
        paragraphs: [
          "The list of 40 companies every CS student applies to is public knowledge. It's why the acceptance rate at each is brutal. The real opportunity is one layer below: profitable Series B-C startups, product-focused companies in boring-sounding industries (logistics, supply chain, insurance tech), and engineering-heavy teams inside mid-market companies you've never heard of.",
          "These companies interview at higher response rates, offer more responsibility earlier, and often convert interns to FTE at much higher rates than the big names. They're harder to find because they don't have massive brand marketing — which is exactly why their interview queues are shorter.",
        ],
        callout: {
          kind: "rule",
          text: "Rule: for every FAANG you apply to, apply to two Series B-C companies in a \"boring\" industry. Better ratios, more growth.",
        },
      },
      {
        heading: "The negotiation question nobody asks",
        paragraphs: [
          "Most recruiters have a comp band before they get on the phone. They won't share it unless you ask. First-screen question, always: \"What's the band for this role?\" Polite, direct, expected.",
          "Not asking leaves 15-30% on the table on average. You cannot negotiate up from an offer you already accepted. You can only negotiate inside the conversation where the range is being set. Ask early, ask clearly, and use the answer to calibrate whether to keep going.",
        ],
      },
    ],
    takeaways: [
      "Referrals multiply interview rates 5-8x. A 3-sentence LinkedIn DM counts as a warm intro.",
      "\"Sponsors H1B\" often means 1-2 filings a year. Check role-level DOL data, not the company toggle.",
      "Spend 10 minutes on Glassdoor + LinkedIn + Crunchbase + engineering blog before tailoring.",
      "For every FAANG you apply to, apply to two Series B-C companies in boring-sounding industries.",
      "Ask \"what's the band for this role?\" in the first recruiter screen. Always.",
    ],
    cta: { label: "Filter for under-the-radar companies →", href: "/" },
  },
};

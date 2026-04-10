import type { PublicJob } from "@/lib/public-jobs";

export interface SeoLandingFaq {
  question: string;
  answer: string;
}

export interface SeoLandingPageConfig {
  slug: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  eyebrow: string;
  jobType?: "internship" | "new-grad";
  category?: "swe" | "pm" | "dsml" | "quant" | "hardware";
  remoteOnly?: boolean;
  relatedSlugs: string[];
  faq: SeoLandingFaq[];
}

const LANDING_PAGE_CONFIGS: SeoLandingPageConfig[] = [
  {
    slug: "internships",
    title: "Internships",
    description: "Browse live internship roles with fast filters, AI fit previews, and direct apply links.",
    heading: "Internship jobs for students and early-career builders",
    intro: "Browse live internship roles without creating an account, then use RezoomAI previews to see where your resume needs work before you apply.",
    eyebrow: "Student job search",
    jobType: "internship",
    relatedSlugs: ["new-grad", "software-engineering-internships", "remote-internships"],
    faq: [
      {
        question: "Can I browse internships without logging in?",
        answer: "Yes. Rezoomind keeps job discovery public so you can search, filter, and apply before deciding whether to create an account.",
      },
      {
        question: "What do I get after signing up?",
        answer: "Signing up unlocks saved jobs, resume upload, deeper AI explanations, and personalized fit scoring across the feed.",
      },
    ],
  },
  {
    slug: "new-grad",
    title: "New Grad Roles",
    description: "Explore fresh new grad roles with direct links, fit previews, and lightweight filters.",
    heading: "New Grad software and product roles worth tracking now",
    intro: "This page focuses on early-career full-time roles so you can separate new grad openings from internships and move faster when recruiting windows open.",
    eyebrow: "Full-time early career",
    jobType: "new-grad",
    relatedSlugs: ["internships", "software-engineering-internships", "data-science-internships"],
    faq: [
      {
        question: "Are these only software roles?",
        answer: "No. Rezoomind mixes software, product, and data-oriented early-career roles, then lets you narrow by job family.",
      },
      {
        question: "Why highlight new grad separately?",
        answer: "Internship and new grad recruiting cycles behave differently, so separating them makes timing and prioritization clearer.",
      },
    ],
  },
  {
    slug: "software-engineering-internships",
    title: "Software Engineering Internships",
    description: "Find software engineering internships with remote filters, fast sort controls, and AI fit previews.",
    heading: "Software engineering internships with fresher discovery",
    intro: "Use this page when you want software-heavy roles first: backend, frontend, platform, and full-stack internship openings pulled from public GitHub trackers.",
    eyebrow: "Engineering focus",
    jobType: "internship",
    category: "swe",
    relatedSlugs: ["internships", "remote-internships", "new-grad"],
    faq: [
      {
        question: "How is this different from a general internship board?",
        answer: "The list is narrower, fresher, and layered with RezoomAI fit signals so you can quickly decide where to spend resume effort.",
      },
      {
        question: "Does this include platform and backend roles?",
        answer: "Yes. Rezoomind groups software engineering broadly across backend, frontend, full-stack, infrastructure, and platform-adjacent titles.",
      },
    ],
  },
  {
    slug: "product-management-internships",
    title: "Product Management Internships",
    description: "Browse product management internships with direct apply links and AI fit previews.",
    heading: "Product management internships with lighter competition triage",
    intro: "PM openings are fewer and more competitive, so this page gives you a tighter list with recent roles and quick AI guidance before you tailor.",
    eyebrow: "Product roles",
    jobType: "internship",
    category: "pm",
    relatedSlugs: ["internships", "new-grad", "remote-internships"],
    faq: [
      {
        question: "Why use a dedicated PM landing page?",
        answer: "Because PM candidates often need to judge role fit faster across fewer openings, and generic boards bury those opportunities.",
      },
      {
        question: "Can I still see software roles from here?",
        answer: "Yes. Related pages let you jump back to broader internship and new grad inventories without losing context.",
      },
    ],
  },
  {
    slug: "data-science-internships",
    title: "Data Science Internships",
    description: "Find data science, analytics, and machine learning internships with public filters and fit previews.",
    heading: "Data science internships with AI-first screening cues",
    intro: "This page narrows the public feed to data science, analytics, and machine-learning internship roles so you can focus on technical fit instead of generic searching.",
    eyebrow: "Data and ML",
    jobType: "internship",
    category: "dsml",
    relatedSlugs: ["internships", "new-grad", "software-engineering-internships"],
    faq: [
      {
        question: "Does this include machine learning internships?",
        answer: "Yes. Rezoomind groups data science, analytics, and ML internship titles into one early-career exploration page.",
      },
      {
        question: "What does the AI preview help with?",
        answer: "It shows likely strengths and probable gaps so you can decide whether a role needs a resume tweak before you spend time applying.",
      },
    ],
  },
  {
    slug: "remote-internships",
    title: "Remote Internships",
    description: "Search remote internships with public filters, faster sorting, and AI fit previews.",
    heading: "Remote internships you can browse without logging in",
    intro: "This page is for students prioritizing remote work. It pulls remote internship roles into one view so you can sort, inspect fit, and apply immediately.",
    eyebrow: "Remote-friendly roles",
    jobType: "internship",
    remoteOnly: true,
    relatedSlugs: ["internships", "software-engineering-internships", "data-science-internships"],
    faq: [
      {
        question: "Does remote include hybrid roles?",
        answer: "No. This page stays strict about remote-first roles so the list is cleaner for students who need location flexibility.",
      },
      {
        question: "Can I still use AI previews without a resume upload?",
        answer: "Yes. Anonymous visitors can open sample RezoomAI previews before deciding whether to upload a resume or create an account.",
      },
    ],
  },
];

export function getLandingPageConfigs() {
  return LANDING_PAGE_CONFIGS;
}

export function getLandingPageConfig(slug: string) {
  return LANDING_PAGE_CONFIGS.find((config) => config.slug === slug) ?? null;
}

export function filterJobsForLandingPage(jobs: PublicJob[], config: SeoLandingPageConfig) {
  return jobs.filter((job) => {
    if (config.jobType && job.jobType !== config.jobType) return false;
    if (config.category && job.category !== config.category) return false;
    if (config.remoteOnly && !job.location.toLowerCase().includes("remote")) return false;
    return true;
  });
}

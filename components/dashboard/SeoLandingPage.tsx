import Link from "next/link";
import Script from "next/script";

import { AuthHeader } from "./AuthHeader";
import { DashboardFooter } from "./DashboardFooter";
import { JobsTable } from "./JobsTable";
import { MatchingPreviewCard } from "./MatchingPreviewCard";

import type { HomepageJob } from "@/lib/homepage-discovery";
import type { PriorityBadge } from "@/lib/job-priority";
import type { SeoLandingPageConfig } from "@/lib/seo-landing-pages";

function generateFaqSchema(faq: SeoLandingPageConfig["faq"]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function generateJobListingSchema(jobs: HomepageJob[], config: SeoLandingPageConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.title,
    description: config.description,
    numberOfItems: jobs.length,
    itemListElement: jobs.slice(0, 10).map((job, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "JobPosting",
        title: job.role,
        hiringOrganization: {
          "@type": "Organization",
          name: job.company,
        },
        jobLocation: {
          "@type": "Place",
          address: job.location,
        },
        employmentType: config.jobType === "internship" ? "INTERN" : "FULL_TIME",
        datePosted: job.datePosted || new Date().toISOString().split("T")[0],
      },
    })),
  };
}

interface SeoLandingPageProps {
  config: SeoLandingPageConfig;
  jobs: HomepageJob[];
  relatedPages: SeoLandingPageConfig[];
  priorities: Record<string, PriorityBadge | null>;
  fitBadges: Record<string, string[]>;
  freshToday: number;
  remoteCount: number;
  newGradCount: number;
}

export function SeoLandingPage({
  config,
  jobs,
  relatedPages,
  priorities,
  fitBadges,
  freshToday,
  remoteCount,
  newGradCount,
}: SeoLandingPageProps) {
  const faqSchema = generateFaqSchema(config.faq);
  const jobListingSchema = generateJobListingSchema(jobs, config);

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="job-listing-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobListingSchema) }}
      />

      <AuthHeader />

      <main className="flex-1 px-5 pb-4 lg:px-7">
        <section className="grid gap-5 border-b border-stone-200 py-6 dark:border-stone-800 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-orange-500">{config.eyebrow}</div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 dark:text-stone-50 md:text-5xl">
              {config.heading}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">{config.intro}</p>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#jobs"
                className="rounded-md bg-orange-600 px-4 py-2.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-orange-500"
              >
                browse {config.title.toLowerCase()}
              </a>
              <Link
                href="/"
                className="rounded-md border border-stone-300 px-4 py-2.5 font-mono text-xs font-semibold text-stone-700 transition-colors hover:border-stone-500 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:text-stone-50"
              >
                back to homepage
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">roles</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{jobs.length}</div>
              </div>
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">fresh today</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{freshToday}</div>
              </div>
              <div className="rounded-[10px] border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">remote</div>
                <div className="mt-1 text-2xl font-semibold text-stone-950 dark:text-stone-50">{remoteCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-orange-200 bg-white p-5 shadow-[0_20px_60px_rgba(234,88,12,0.08)] dark:border-orange-900/60 dark:bg-stone-900">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-orange-500">why this page helps</div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
              <p>Browse without logging in, then use limited RezoomAI previews to judge fit before you spend time tailoring.</p>
              <p>These pages are narrower than a generic board, so location, freshness, and role family are easier to scan quickly.</p>
              <p>When you want resume uploads, saved jobs, and deeper AI explanations, the demo and signup flow are already in place.</p>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_240px]">
          <JobsTable
            postings={jobs}
            priorities={priorities}
            fitBadges={fitBadges}
          />

          <div className="flex flex-col gap-3.5">
            <MatchingPreviewCard />
          </div>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[10px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-500">faq</div>
            <div className="mt-4 space-y-4">
              {config.faq.map((item) => (
                <div key={item.question} className="rounded-md border border-stone-200 p-4 dark:border-stone-800">
                  <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">{item.question}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-orange-500">related pages</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedPages.map((page) => (
                <Link
                  key={page.slug}
                  href={`/${page.slug}`}
                  className="rounded-full border border-stone-200 px-3 py-1.5 font-mono text-[11px] text-stone-500 transition-colors hover:border-orange-500 hover:text-orange-600 dark:border-stone-800 dark:text-stone-300 dark:hover:text-orange-400"
                >
                  {page.title}
                </Link>
              ))}
            </div>
            <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">ai preview note</div>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300">
                Anonymous previews are intentionally partial. They help you decide whether to invest effort, but full personalization still lives behind resume upload and account persistence.
              </p>
            </div>
          </div>
        </section>
      </main>

      <DashboardFooter />
    </div>
  );
}

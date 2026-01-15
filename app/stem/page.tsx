import { StemJobsTable, type StemJob } from "@/components/StemJobsTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StemJobsPage() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: [{ datePosted: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      id: true,
      role: true,
      company: true,
      location: true,
      url: true,
      tags: true,
      datePosted: true,
    },
  });

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const normalizedJobs: StemJob[] = jobs.map((job) => ({
    id: job.id,
    role: job.role,
    company: job.company,
    location: job.location,
    url: job.url,
    tags: job.tags,
    datePosted: job.datePosted?.toISOString() ?? null,
  }));

  return (
    <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand">
          STEM Jobs Preview
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Browse verified STEM internships.
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Explore the latest roles, then sign in to track applications, add notes, and
          unlock AI resume analysis.
        </p>
      </div>

      {user ? (
        <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              AI Resume Analysis
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Get ATS-friendly bullets + match score for roles you’re applying to.
            </p>
          </div>
          <Button href="/resume/analysis">Analyze my resume</Button>
        </Card>
      ) : null}

      <StemJobsTable jobs={normalizedJobs} />
    </div>
  );
}

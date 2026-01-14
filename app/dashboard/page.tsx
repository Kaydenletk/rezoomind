import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const subscriber = user.email
    ? await prisma.subscriber.findUnique({ where: { email: user.email } })
    : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Welcome, {user.email}
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Manage your resume, interests, alerts, and matches in one place.
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
          Subscription status: {subscriber?.status ?? "NOT SUBSCRIBED"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card highlighted>
          <h2 className="text-lg font-semibold text-white">Resume</h2>
          <p className="mt-2 text-sm text-white/70">
            Upload a PDF or paste your resume to power better matches.
          </p>
          <Button href="/resume" className="mt-6 w-full">
            Manage Resume
          </Button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Interests</h2>
          <p className="mt-2 text-sm text-white/70">
            Define the roles, locations, and keywords you care about.
          </p>
          <Button href="/interests" variant="secondary" className="mt-6 w-full">
            Set Interests
          </Button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Alerts</h2>
          <p className="mt-2 text-sm text-white/70">
            Control your email alert cadence so you never miss a match.
          </p>
          <Button href="/alerts" variant="secondary" className="mt-6 w-full">
            Configure Alerts
          </Button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Matches</h2>
          <p className="mt-2 text-sm text-white/70">
            See ranked internships based on your resume and interests.
          </p>
          <Button href="/matches" variant="secondary" className="mt-6 w-full">
            View Matches
          </Button>
        </Card>
      </div>
    </div>
  );
}

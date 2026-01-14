"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SubscribeSuccessPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Subscription confirmed
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          You’ll start receiving verified internship alerts.
        </p>
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Thanks for confirming. You can manage your alerts anytime from the dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/dashboard" className="w-full sm:w-auto">
            Go to Dashboard
          </Button>
          <Button href="/" variant="secondary" className="w-full sm:w-auto">
            Return Home
          </Button>
        </div>
      </Card>
    </div>
  );
}

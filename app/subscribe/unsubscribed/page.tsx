"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SubscribeUnsubscribedPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "idle";
  const message = useMemo(() => {
    switch (status) {
      case "success":
        return "You're unsubscribed. We'll stop sending alerts.";
      case "invalid":
        return "This link is invalid or expired.";
      case "error":
        return "Something went wrong. Try again later.";
      default:
        return "Updating your subscription...";
    }
  }, [status]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
      <div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Subscription updated
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Manage your Rezoomind email preferences.
        </p>
      </div>

      <Card>
        <p className="text-sm text-white/80">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="secondary" className="w-full sm:w-auto">
            Return Home
          </Button>
          <Button href="/" className="w-full sm:w-auto">
            Subscribe Again
          </Button>
        </div>
      </Card>
    </div>
  );
}

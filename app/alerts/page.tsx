"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/components/AuthProvider";

type AlertFrequency = "daily" | "weekly";

export default function AlertsPage() {
  const { user, loading } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState<AlertFrequency>("weekly");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    fetch("/api/alerts", { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok || !data.alerts) return;
        setEnabled(Boolean(data.alerts.enabled));
        setFrequency((data.alerts.frequency as AlertFrequency) ?? "weekly");
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setStatus("error");
      setNote("Sign in to manage alerts.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");

      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled, frequency }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to save alerts.");
        return;
      }

      setStatus("success");
      setNote("Alerts updated.");
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Alerts</h1>
        <p className="mt-2 text-sm text-white/70">
          Control how often Rezoomind emails you about new matches.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Email alerts</p>
              <p className="text-xs text-white/60">Toggle internship alert emails.</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled((prev) => !prev)}
              className={`relative h-8 w-14 rounded-full transition ${
                enabled ? "bg-cyan-300" : "bg-white/20"
              }`}
              disabled={loading}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-slate-900 transition ${
                  enabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Frequency
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(["daily", "weekly"] as AlertFrequency[]).map((option) => {
                const selected = frequency === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFrequency(option)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                      selected
                        ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100"
                        : "border-white/10 text-white/70 hover:border-white/30"
                    }`}
                    disabled={loading}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {note ? (
            <p
              className={`text-sm ${
                status === "success" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {note}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={status === "loading" || loading}
          >
            {status === "loading" ? "Saving..." : "Save Alerts"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

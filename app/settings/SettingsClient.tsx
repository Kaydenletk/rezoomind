"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { SmartFeedHeader } from "@/components/smart-feed/SmartFeedHeader";

type AlertFreq = "daily" | "weekly";

interface AlertState {
  enabled: boolean;
  frequency: AlertFreq;
}

export function SettingsClient() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [alert, setAlert] = useState<AlertState | null>(null);
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertNote, setAlertNote] = useState("");

  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [hasInterest, setHasInterest] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.allSettled([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/resume/data").then((r) => r.json()),
      fetch("/api/interest").then((r) => r.json()),
    ]).then(([alertRes, resumeRes, interestRes]) => {
      if (alertRes.status === "fulfilled") {
        const data = alertRes.value;
        if (data?.ok) {
          setAlert(
            data.alerts
              ? { enabled: data.alerts.enabled, frequency: data.alerts.frequency }
              : { enabled: true, frequency: "weekly" }
          );
        }
      }
      if (resumeRes.status === "fulfilled") {
        setHasResume(!!resumeRes.value?.resume?.resume_text);
      }
      if (interestRes.status === "fulfilled") {
        setHasInterest(!!interestRes.value?.interest?.roles?.length);
      }
    });
  }, [status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?next=/settings");
    }
  }, [status, router]);

  async function saveAlert(next: AlertState) {
    setAlertSaving(true);
    setAlertNote("saving...");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (data?.ok) {
        setAlert(next);
        setAlertNote("saved");
        setTimeout(() => setAlertNote(""), 1600);
      } else {
        setAlertNote("save failed");
      }
    } catch {
      setAlertNote("network error");
    } finally {
      setAlertSaving(false);
    }
  }

  function toggleDark() {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  function clearPipeline() {
    if (typeof window === "undefined") return;
    const confirmed = window.confirm(
      "Clear local pipeline tracking (saved statuses, applied timestamps)? Saved jobs themselves stay."
    );
    if (!confirmed) return;
    window.localStorage.removeItem("rezoomind:pipeline:v1");
    window.alert("Pipeline cleared. Reload /feed to see the change.");
  }

  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-surface text-fg flex flex-col transition-colors">
      <SmartFeedHeader user={user} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-10 space-y-6">
        <header className="border-b border-line-subtle pb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono mb-1">
            ~/settings
          </p>
          <h1 className="font-mono text-2xl font-bold text-fg">settings.exe</h1>
          <p className="text-sm text-fg-muted mt-1 font-mono">
            &gt;_ manage your resume, alerts, and appearance.
          </p>
        </header>

        <Section title="01 profile">
          <Row label="email">
            <span className="font-mono text-sm text-fg">
              {user?.email ?? "—"}
            </span>
          </Row>
          <Row label="name">
            <span className="font-mono text-sm text-fg">
              {user?.name ?? <span className="text-fg-subtle">not set</span>}
            </span>
          </Row>
        </Section>

        <Section title="02 resume">
          <Row label="status">
            <span className="font-mono text-sm">
              {hasResume === null ? (
                <span className="text-fg-subtle">checking...</span>
              ) : hasResume ? (
                <span className="text-status-success">▸ uploaded</span>
              ) : (
                <span className="text-fg-muted">✗ not uploaded</span>
              )}
            </span>
          </Row>
          <Row label="">
            <Link
              href="/resume"
              className="inline-block border border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400 font-mono text-xs px-4 py-2 hover:bg-orange-600/20 transition-colors"
            >
              ~/resume →
            </Link>
          </Row>
        </Section>

        <Section title="03 preferences">
          <Row label="status">
            <span className="font-mono text-sm">
              {hasInterest === null ? (
                <span className="text-fg-subtle">checking...</span>
              ) : hasInterest ? (
                <span className="text-status-success">▸ set</span>
              ) : (
                <span className="text-fg-muted">✗ not set</span>
              )}
            </span>
          </Row>
          <Row label="">
            <Link
              href="/preferences"
              className="inline-block border border-orange-600/50 bg-orange-600/10 text-orange-700 dark:text-orange-400 font-mono text-xs px-4 py-2 hover:bg-orange-600/20 transition-colors"
            >
              ~/preferences →
            </Link>
          </Row>
        </Section>

        <Section title="04 email_alerts">
          <Row label="delivery">
            {alert ? (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => saveAlert({ ...alert, enabled: !alert.enabled })}
                  disabled={alertSaving}
                  className={[
                    "font-mono text-[11px] px-3 py-1.5 border transition-colors",
                    alert.enabled
                      ? "border-orange-600/60 bg-orange-600/10 text-orange-700 dark:text-orange-400"
                      : "border-line bg-surface-sunken text-fg-muted",
                  ].join(" ")}
                >
                  {alert.enabled ? "on" : "off"}
                </button>
                <div className="flex items-center gap-0 font-mono text-[11px]">
                  {(["daily", "weekly"] as AlertFreq[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => saveAlert({ ...alert, frequency: f })}
                      disabled={alertSaving || !alert.enabled}
                      className={[
                        "px-3 py-1.5 border transition-colors",
                        alert.frequency === f && alert.enabled
                          ? "border-orange-600/60 bg-orange-600/10 text-orange-700 dark:text-orange-400"
                          : "border-line bg-surface-sunken text-fg-muted hover:text-fg",
                        alert.enabled ? "" : "opacity-50 cursor-not-allowed",
                      ].join(" ")}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {alertNote && (
                  <span className="text-[11px] font-mono text-fg-subtle">{alertNote}</span>
                )}
              </div>
            ) : (
              <span className="font-mono text-sm text-fg-subtle">loading...</span>
            )}
          </Row>
        </Section>

        <Section title="05 appearance">
          <Row label="theme">
            <button
              type="button"
              onClick={toggleDark}
              className="font-mono text-[11px] px-3 py-1.5 border border-line bg-surface-sunken text-fg-muted hover:text-fg hover:border-fg-subtle transition-colors"
            >
              toggle light/dark
            </button>
          </Row>
        </Section>

        <Section title="06 data">
          <Row label="pipeline">
            <button
              type="button"
              onClick={clearPipeline}
              className="font-mono text-[11px] px-3 py-1.5 border border-line text-fg-muted hover:text-red-500 hover:border-red-500/50 transition-colors"
            >
              clear local pipeline tracking
            </button>
          </Row>
          <Row label="session">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="font-mono text-[11px] px-3 py-1.5 border border-line text-fg-muted hover:text-red-500 hover:border-red-500/50 transition-colors"
            >
              sign out
            </button>
          </Row>
        </Section>

        <footer className="pt-6 text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
          ~/rezoomind/settings · build 2026-04-19
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-surface-raised">
      <div className="h-7 border-b border-line-subtle bg-surface-sunken flex items-center px-3 gap-1.5">
        <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
        <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
        <div className="w-2 h-2 rounded-full bg-fg-subtle/40" />
        <span className="text-[10px] text-fg-subtle ml-2 tracking-wider font-mono">{title}</span>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 min-h-[32px]">
      <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.2em] text-fg-subtle font-mono">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/AuthProvider";

const roleOptions = ["SWE", "Data", "DevOps", "Cyber"];

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function InterestsPage() {
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [locations, setLocations] = useState("");
  const [keywords, setKeywords] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    fetch("/api/interests", { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok || !data.interests) return;
        setRoles(data.interests.roles ?? []);
        setLocations((data.interests.locations ?? []).join(", "));
        setKeywords((data.interests.keywords ?? []).join(", "));
        setGradYear(data.interests.grad_year?.toString() ?? "");
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [user]);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setStatus("error");
      setNote("Sign in to save your interests.");
      return;
    }

    try {
      setStatus("loading");
      setNote("");

      const response = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roles,
          locations: parseList(locations),
          keywords: parseList(keywords),
          gradYear: gradYear ? Number(gradYear) : null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setStatus("error");
        setNote(data?.error ?? "Unable to save interests.");
        return;
      }

      setStatus("success");
      setNote("Interests saved.");
    } catch {
      setStatus("error");
      setNote("Network error. Try again.");
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-20">
      <div>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Interests</h1>
        <p className="mt-2 text-sm text-white/70">
          Tell us what roles and locations you want to target.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Role Types
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {roleOptions.map((role) => {
                const selected = roles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] transition ${
                      selected
                        ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100"
                        : "border-white/10 text-white/70 hover:border-white/30"
                    }`}
                    disabled={loading}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Locations (comma separated)
            </label>
            <Input
              className="mt-3"
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder="New York, Remote, San Francisco"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Keywords (comma separated)
            </label>
            <Input
              className="mt-3"
              value={keywords}
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="TypeScript, ML, React"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Graduation Year
            </label>
            <Input
              className="mt-3"
              type="number"
              value={gradYear}
              onChange={(event) => setGradYear(event.target.value)}
              placeholder="2026"
              disabled={loading}
            />
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
            {status === "loading" ? "Saving..." : "Save Interests"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

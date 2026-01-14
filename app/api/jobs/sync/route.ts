import { createHash, createHmac } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sendJobAlertEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

const JOBS_SOURCE_URL =
  "https://raw.githubusercontent.com/speedyapply/2026-SWE-College-Jobs/main/README.md";

type JobRecord = {
  company: string;
  role: string;
  location?: string;
  url?: string;
  datePosted?: Date;
  tags: string[];
  sourceId: string;
  source: string;
};

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, "").trim();

const extractHref = (value: string) => {
  const matches = [...value.matchAll(/href="([^"]+)"/g)];
  return matches.length ? matches[matches.length - 1][1] : undefined;
};

const parseAge = (value: string) => {
  const match = value.match(/(\d+)\s*d/i);
  if (!match) return undefined;
  const days = Number(match[1]);
  if (Number.isNaN(days)) return undefined;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const buildSourceId = (input: string) =>
  createHash("sha256").update(input).digest("hex");

const parseJobsFromMarkdown = (markdown: string) => {
  const lines = markdown.split(/\r?\n/);
  const jobs: JobRecord[] = [];

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (line.includes("---|")) continue;
    const trimmed = line.trim();
    const columns = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : trimmed.length)
      .split("|")
      .map((column) => column.trim());

    if (columns.length < 5) continue;
    if (columns[0].toLowerCase() === "company") continue;

    const company = stripHtml(columns[0]);
    const role = stripHtml(columns[1]);
    const location = stripHtml(columns[2]) || undefined;
    const postingUrl = extractHref(columns[4]);
    const datePosted = parseAge(columns[5] ?? "");

    if (!company || !role) continue;

    const sourceId = buildSourceId(
      `${company}|${role}|${location ?? ""}|${postingUrl ?? ""}`
    );

    jobs.push({
      company,
      role,
      location,
      url: postingUrl,
      datePosted,
      tags: ["internship"],
      sourceId,
      source: "speedyapply/2026-SWE-College-Jobs:README.md",
    });
  }

  return jobs;
};

export async function POST(request: Request) {
  const secret = process.env.JOBS_SYNC_SECRET;
  const provided = request.headers.get("x-sync-secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(JOBS_SOURCE_URL);
    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: "Unable to fetch job source" },
        { status: 502 }
      );
    }

    const markdown = await response.text();
    const jobs = parseJobsFromMarkdown(markdown);
    const existingSourceIds = new Set(
      (
        await prisma.jobPosting.findMany({
          select: { sourceId: true },
        })
      ).map((job) => job.sourceId)
    );

    const newJobs = jobs.filter((job) => !existingSourceIds.has(job.sourceId));

    const result = await prisma.jobPosting.createMany({
      data: newJobs.map((job) => ({
        sourceId: job.sourceId,
        company: job.company,
        role: job.role,
        location: job.location,
        url: job.url,
        datePosted: job.datePosted,
        source: job.source,
        tags: job.tags,
      })),
      skipDuplicates: true,
    });

    const insertedCount = result.count;
    console.info("[jobs:sync]", {
      fetched: jobs.length,
      inserted: insertedCount,
    });

    const signingSecret = process.env.EMAIL_SIGNING_SECRET;
    if (!signingSecret) {
      return NextResponse.json({
        ok: true,
        fetched: jobs.length,
        inserted: insertedCount,
        emailed: 0,
      });
    }

    if (newJobs.length === 0) {
      return NextResponse.json({
        ok: true,
        fetched: jobs.length,
        inserted: insertedCount,
        emailed: 0,
      });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { status: "active" },
      select: { email: true, interests: true },
    });

    const origin =
      request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
    const maxEmails = 50;
    const maxJobs = 8;
    let emailed = 0;

    for (const subscriber of subscribers) {
      if (emailed >= maxEmails) break;

      const interestList = Array.isArray(subscriber.interests)
        ? subscriber.interests.map((value) => String(value).toLowerCase())
        : [];

      const matches = newJobs.filter((job) => {
        if (interestList.length === 0) return true;
        const haystack = `${job.role} ${job.company} ${job.location ?? ""}`.toLowerCase();
        return interestList.some((interest) => haystack.includes(interest.toLowerCase()));
      });

      if (matches.length === 0) continue;

      const unsubscribeToken = createHmac("sha256", signingSecret)
        .update(subscriber.email)
        .digest("hex");
      const unsubscribeUrl = `${origin}/api/unsubscribe?token=${unsubscribeToken}`;

      await sendJobAlertEmail(
        subscriber.email,
        matches.slice(0, maxJobs).map((job) => ({
          title: job.role,
          company: job.company,
          location: job.location,
          url: job.url,
        })),
        unsubscribeUrl
      );

      emailed += 1;
    }

    console.info("[jobs:sync]", {
      emailed,
      newJobs: newJobs.length,
    });

    return NextResponse.json({
      ok: true,
      fetched: jobs.length,
      inserted: insertedCount,
      emailed,
    });
  } catch (error) {
    console.error("[jobs:sync] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, error: "Sync failed" }, { status: 500 });
  }
}

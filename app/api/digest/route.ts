import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getResendClient, getResendFrom } from "@/lib/resend";
import { weeklyDigestEmail } from "@/lib/emailTemplates";

const buildUnsubscribeToken = (email: string, secret: string) =>
  createHmac("sha256", secret).update(email).digest("hex");

export async function POST(request: Request) {
  const secret = process.env.DIGEST_SECRET;
  const provided = request.headers.get("x-digest-secret");

  if (!secret || !provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const signingSecret = process.env.EMAIL_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json(
      { ok: false, error: "Email signing is not configured" },
      { status: 500 }
    );
  }

  try {
    const subscribers = await prisma.email_subscribers.findMany({
      where: { status: "active" },
      select: { email: true },
    });

    const jobs = await prisma.job_postings.findMany({
      orderBy: [{ date_posted: "desc" }, { created_at: "desc" }],
      take: 8,
    });

    const resend = getResendClient();
    const from = getResendFrom();
    const origin =
      request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";

    let sent = 0;

    for (const subscriber of subscribers) {
      const unsubscribeToken = buildUnsubscribeToken(subscriber.email, signingSecret);
      const unsubscribeUrl = `${origin}/api/unsubscribe?token=${unsubscribeToken}`;

      await resend.emails.send({
        from,
        to: [subscriber.email],
        subject: "Your Rezoomind internship digest",
        html: weeklyDigestEmail({
          previewText: "Top internship roles this week",
          items: jobs.map((job) => ({
            title: job.role,
            company: job.company,
            location: job.location ?? undefined,
            url: job.url ?? undefined,
          })),
          unsubscribeUrl,
        }),
      });

      sent += 1;
    }

    console.info("[digest] sent", { sent, subscribers: subscribers.length, jobs: jobs.length });

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error("[digest] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, error: "Digest failed" }, { status: 500 });
  }
}

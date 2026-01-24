import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendConfirmEmail } from "@/lib/email/resend";

const subscribeSchema = z.object({
  email: z.string().email(),
  interests: z.array(z.string()).optional(),
  // New fields for job preferences
  roles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

const hashToken = (token: string, secret: string) =>
  createHash("sha256").update(`${token}${secret}`).digest("hex");

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const getClientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

const isRateLimited = (key: string) => {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const interests = parsed.data.interests?.map((value) => value.trim()).filter(Boolean) ?? [];

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      { status: 429 }
    );
  }

  try {
    const secret = process.env.EMAIL_SIGNING_SECRET;
    if (!secret) {
      console.error("[subscribe] missing EMAIL_SIGNING_SECRET");
      return NextResponse.json(
        { ok: false, error: "Email signing is not configured" },
        { status: 500 }
      );
    }

    const existing = await prisma.email_subscribers.findUnique({ where: { email } });
    if (existing?.status === "active") {
      return NextResponse.json({ ok: true });
    }

    const token = randomBytes(32).toString("hex");
    const confirmTokenHash = hashToken(token, secret);
    const preferencesToken = randomBytes(32).toString("hex");

    const confirmTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    // Extract job preferences from request
    const roles = parsed.data.roles ?? [];
    const locations = parsed.data.locations ?? [];
    const keywords = parsed.data.keywords ?? [];

    if (existing) {
      await prisma.email_subscribers.update({
        where: { email },
        data: {
          status: "pending",
          confirm_token_hash: confirmTokenHash,
          confirm_token_expires_at: confirmTokenExpiresAt,
          confirmed_at: null,
          interests: interests.length > 0 ? interests : undefined,
          // Update job preferences
          interested_roles: roles,
          preferred_locations: locations,
          keywords: keywords,
          preferences_token: preferencesToken,
        },
      });
    } else {
      await prisma.email_subscribers.create({
        data: {
          email,
          status: "pending",
          confirm_token_hash: confirmTokenHash,
          confirm_token_expires_at: confirmTokenExpiresAt,
          interests: interests.length > 0 ? interests : undefined,
          // Add job preferences
          interested_roles: roles,
          preferred_locations: locations,
          keywords: keywords,
          preferences_token: preferencesToken,
        },
      });
    }

    const origin =
      request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
    const confirmUrl = `${origin}/api/subscribe/confirm?token=${token}`;

    await sendConfirmEmail(email, confirmUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[subscribe] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Unable to subscribe" },
      { status: 500 }
    );
  }
}

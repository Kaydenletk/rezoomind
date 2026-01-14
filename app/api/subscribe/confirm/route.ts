import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email/resend";

const confirmSchema = z.object({
  token: z.string().min(20),
});

const hashToken = (token: string, secret: string) =>
  createHash("sha256").update(`${token}${secret}`).digest("hex");

const tokensMatch = (expectedHash: string, token: string, secret: string) => {
  const incomingHash = hashToken(token, secret);
  const expectedBuffer = Buffer.from(expectedHash);
  const incomingBuffer = Buffer.from(incomingHash);
  if (expectedBuffer.length !== incomingBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, incomingBuffer);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = confirmSchema.safeParse({
    token: searchParams.get("token"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=invalid", request.url));
  }

  const token = parsed.data.token.trim();

  const secret = process.env.EMAIL_SIGNING_SECRET;
  if (!secret) {
    console.error("[confirm] missing EMAIL_SIGNING_SECRET");
    return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=error", request.url));
  }

  try {
    const confirmTokenHash = hashToken(token, secret);
    const subscriber = await prisma.subscriber.findFirst({
      where: { confirmTokenHash },
    });

    if (!subscriber || subscriber.status !== "pending" || !subscriber.confirmTokenExpiresAt) {
      return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=invalid", request.url));
    }

    if (subscriber.confirmTokenExpiresAt.getTime() < Date.now()) {
      return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=invalid", request.url));
    }

    if (!tokensMatch(confirmTokenHash, token, secret)) {
      return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=invalid", request.url));
    }

    const email = subscriber.email;
    const unsubscribeToken = createHmac("sha256", secret).update(email).digest("hex");
    const unsubscribeTokenHash = createHash("sha256")
      .update(`${unsubscribeToken}${secret}`)
      .digest("hex");

    await prisma.subscriber.update({
      where: { email },
      data: {
        status: "active",
        confirmedAt: new Date(),
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
        unsubscribeTokenHash,
      },
    });

    const origin =
      request.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
    const unsubscribeUrl = `${origin}/api/unsubscribe?token=${unsubscribeToken}`;

    await sendWelcomeEmail(email, unsubscribeUrl);

    return NextResponse.redirect(new URL("/subscribe/success", request.url));
  } catch (error) {
    console.error("[confirm] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=error", request.url));
  }
}

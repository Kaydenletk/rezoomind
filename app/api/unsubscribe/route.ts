import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const unsubscribeSchema = z.object({
  token: z.string().min(20),
});

const buildToken = (email: string, secret: string) =>
  createHmac("sha256", secret).update(email).digest("hex");

const isValidToken = (email: string, token: string, secret: string) => {
  const expected = buildToken(email, secret);
  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  if (expectedBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, tokenBuffer);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = unsubscribeSchema.safeParse({
    token: searchParams.get("token"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", request.url));
  }

  const token = parsed.data.token.trim();

  const secret = process.env.EMAIL_SIGNING_SECRET;
  if (!secret) {
    console.error("[unsubscribe] missing EMAIL_SIGNING_SECRET");
    return NextResponse.redirect(new URL("/unsubscribe?status=error", request.url));
  }

  const tokenHash = createHash("sha256").update(`${token}${secret}`).digest("hex");
  const subscriber = await prisma.subscriber.findFirst({
    where: { unsubscribeTokenHash: tokenHash },
  });

  if (!subscriber || !isValidToken(subscriber.email, token, secret)) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", request.url));
  }

  try {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "unsubscribed" },
    });

    return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=success", request.url));
  } catch (error) {
    console.error("[unsubscribe] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.redirect(new URL("/subscribe/unsubscribed?status=error", request.url));
  }
}

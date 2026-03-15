import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const alertsSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const data = await prisma.alert.findUnique({
      where: { userId },
      select: { enabled: true, frequency: true, created_at: true },
    });

    return NextResponse.json({ ok: true, alerts: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = alertsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid alerts payload" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const data = await prisma.alert.upsert({
      where: { userId },
      update: {
        enabled: parsed.data.enabled,
        frequency: parsed.data.frequency,
      },
      create: {
        userId,
        enabled: parsed.data.enabled,
        frequency: parsed.data.frequency,
      },
      select: { enabled: true, frequency: true, created_at: true },
    });

    return NextResponse.json({ ok: true, alerts: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

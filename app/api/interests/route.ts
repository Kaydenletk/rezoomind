import { NextResponse } from "next/server";
import { z } from "zod";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const interestsSchema = z.object({
  roles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  gradYear: z.number().int().nullable().optional(),
});

const normalizeList = (items: string[] | undefined) =>
  (items ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const data = await prisma.interest.findUnique({
      where: { userId },
      select: { roles: true, locations: true, keywords: true, grad_year: true, created_at: true },
    });

    return NextResponse.json({ ok: true, interests: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = interestsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid interests payload" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const gradYear =
    typeof parsed.data.gradYear === "number" && !Number.isNaN(parsed.data.gradYear)
      ? parsed.data.gradYear
      : null;

  const userId = (session.user as any).id;

  try {
    const data = await prisma.interest.upsert({
      where: { userId },
      update: {
        roles: normalizeList(parsed.data.roles),
        locations: normalizeList(parsed.data.locations),
        keywords: normalizeList(parsed.data.keywords),
        grad_year: gradYear,
      },
      create: {
        userId,
        roles: normalizeList(parsed.data.roles),
        locations: normalizeList(parsed.data.locations),
        keywords: normalizeList(parsed.data.keywords),
        grad_year: gradYear,
      },
      select: { roles: true, locations: true, keywords: true, grad_year: true, created_at: true },
    });

    return NextResponse.json({ ok: true, interests: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

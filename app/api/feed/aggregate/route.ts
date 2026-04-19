import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const latest = await prisma.job_postings.findFirst({
      orderBy: { created_at: "desc" },
      select: { created_at: true },
    });

    const appliedToday = 0;

    return NextResponse.json({
      ok: true,
      appliedToday,
      lastRefreshedAt: latest?.created_at ?? null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "aggregate_failed" },
      { status: 500 }
    );
  }
}

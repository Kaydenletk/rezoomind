import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SavedJobPayload = {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  url?: string | null;
};

function normalizeSavedJobs(body: unknown): SavedJobPayload[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const payload = body as {
    job?: SavedJobPayload;
    jobs?: SavedJobPayload[];
  };

  const candidates = Array.isArray(payload.jobs)
    ? payload.jobs
    : payload.job
      ? [payload.job]
      : [];

  return candidates
    .filter((job) => job && typeof job.id === "string" && typeof job.company === "string" && typeof job.role === "string")
    .map((job) => ({
      id: job.id.trim(),
      company: job.company.trim(),
      role: job.role.trim(),
      location: typeof job.location === "string" ? job.location.trim() : null,
      url: typeof job.url === "string" ? job.url.trim() : null,
    }))
    .filter((job) => job.id.length > 0 && job.company.length > 0 && job.role.length > 0);
}

async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobSourceId: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      savedJobIds: savedJobs.map((job) => job.jobSourceId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load saved jobs.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const jobs = normalizeSavedJobs(body);

    if (jobs.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid jobs provided." }, { status: 400 });
    }

    await prisma.savedJob.createMany({
      data: jobs.map((job) => ({
        userId,
        jobSourceId: job.id,
        company: job.company,
        role: job.role,
        location: job.location ?? null,
        url: job.url ?? null,
      })),
      skipDuplicates: true,
    });

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobSourceId: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      savedJobIds: savedJobs.map((job) => job.jobSourceId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save jobs.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const jobs = normalizeSavedJobs(body);

    if (jobs.length === 0) {
      return NextResponse.json({ ok: false, error: "No valid jobs provided." }, { status: 400 });
    }

    await prisma.savedJob.deleteMany({
      where: {
        userId,
        jobSourceId: {
          in: jobs.map((job) => job.id),
        },
      },
    });

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobSourceId: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      ok: true,
      savedJobIds: savedJobs.map((job) => job.jobSourceId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove jobs.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

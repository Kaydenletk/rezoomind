import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  const syncSecret = process.env.JOBS_SYNC_SECRET;

  if (!syncSecret) {
    return NextResponse.json({
      ok: false,
      error: `Missing env vars`
    }, { status: 500 });
  }

  try {
    const deleted = await prisma.job_postings.deleteMany({
      where: { source: 'github' }
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.count || 0,
      message: 'All GitHub jobs cleared. Ready for fresh sync.'
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Clear failed'
    }, { status: 500 });
  }
}

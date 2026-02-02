import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST: Sync jobs from GitHub
export async function POST() {
  try {
    const syncUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/jobs/sync`;

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'x-sync-secret': process.env.JOBS_SYNC_SECRET || '',
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// DELETE: Clear all GitHub jobs (uses POST with x-action header)
export async function DELETE() {
  try {
    const syncUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/jobs/sync`;

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'x-sync-secret': process.env.JOBS_SYNC_SECRET || '',
        'x-action': 'clear',
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Clear failed' },
      { status: 500 }
    );
  }
}

// POST: Delete ALL jobs and refetch fresh from GitHub (clear-and-sync)
export async function PUT() {
  try {
    const syncUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/jobs/sync`;

    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'x-sync-secret': process.env.JOBS_SYNC_SECRET || '',
        'x-action': 'clear-and-sync',
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}

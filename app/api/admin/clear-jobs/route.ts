import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ok: false,
      error: `Missing env vars`
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('clear_github_jobs', {
      sync_secret: process.env.JOBS_SYNC_SECRET || ''
    });

    if (rpcError) {
      return NextResponse.json({
        ok: false,
        error: `Clear failed: ${rpcError.message || JSON.stringify(rpcError)}`
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deleted: rpcResult?.deleted || 0,
      message: 'All GitHub jobs cleared. Ready for fresh sync.'
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Clear failed'
    }, { status: 500 });
  }
}

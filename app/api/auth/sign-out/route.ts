import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";
const log = (message: string, meta?: Record<string, unknown>) => {
  if (!isDev) return;
  if (meta) {
    console.info(`[auth:sign-out] ${message}`, meta);
  } else {
    console.info(`[auth:sign-out] ${message}`);
  }
};

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  log("signed_out", { status: 200 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";
const log = (message: string, meta?: Record<string, unknown>) => {
  if (!isDev) return;
  if (meta) {
    console.info(`[auth:me] ${message}`, meta);
  } else {
    console.info(`[auth:me] ${message}`);
  }
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      log("unauthorized", { status: 401, message: error?.message });
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    log("ok", { status: 200 });
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    log("server_error", {
      status: 500,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

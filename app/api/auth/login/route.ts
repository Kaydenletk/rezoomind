import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const isDev = process.env.NODE_ENV !== "production";
const log = (message: string, meta?: Record<string, unknown>) => {
  if (!isDev) return;
  if (meta) {
    console.info(`[auth:login] ${message}`, meta);
  } else {
    console.info(`[auth:login] ${message}`);
  }
};

const invalidCredentialMessages = [
  "invalid login credentials",
  "invalid credentials",
  "invalid email or password",
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(body);

  if (!parsed.success) {
    log("validation_failed", { issues: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      { ok: false, error: "Invalid email or password" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const email = parsed.data.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });

    if (error) {
      const normalizedMessage = error.message.toLowerCase();
      const isInvalidCredentials = invalidCredentialMessages.some((message) =>
        normalizedMessage.includes(message)
      );
      const status = isInvalidCredentials ? 401 : error.status ?? 400;

      log("supabase_error", { status, message: error.message });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status }
      );
    }

    const user = data.user;

    log("signed_in", { status: 200 });
    return NextResponse.json({
      ok: true,
      user: user ? { id: user.id, email: user.email } : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    log("server_error", { status: 500, message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

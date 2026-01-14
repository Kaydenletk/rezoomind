import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const signUpSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().optional(),
});

const isDev = process.env.NODE_ENV !== "production";
const log = (message: string, meta?: Record<string, unknown>) => {
  if (!isDev) return;
  if (meta) {
    console.info(`[auth:signup] ${message}`, meta);
  } else {
    console.info(`[auth:signup] ${message}`);
  }
};

const knownExistingUserMessages = [
  "user already registered",
  "already registered",
  "already exists",
  "user already exists",
];

const isRlsViolation = (error: unknown) => {
  const typed = error as { code?: string; details?: string; hint?: string };
  if (typed?.code === "42501") return true;

  const combined = [typed?.details, typed?.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return (
    combined.includes("row level security") ||
    combined.includes("row-level security") ||
    combined.includes("rls")
  );
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    log("validation_failed", { issues: parsed.error.flatten().fieldErrors });
    return NextResponse.json(
      { ok: false, error: "Invalid sign up details" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const confirmPassword = parsed.data.confirmPassword;

  if (typeof confirmPassword === "string" && password !== confirmPassword) {
    log("confirm_password_mismatch", { status: 400 });
    return NextResponse.json(
      { ok: false, error: "Passwords do not match" },
      { status: 400 }
    );
  }

  try {
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const emailRedirectTo = new URL("/login", origin).toString();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (error) {
      const normalizedMessage = error.message.toLowerCase();

      if (knownExistingUserMessages.some((message) => normalizedMessage.includes(message))) {
        log("email_in_use", { status: 409, message: error.message });
        return NextResponse.json(
          { ok: false, error: "Email already in use" },
          { status: 409 }
        );
      }

      if (error.message === "Database error saving new user" && isRlsViolation(error)) {
        log("rls_violation", { status: 403, message: error.message });
        return NextResponse.json(
          { ok: false, error: "Row level security policy violation" },
          { status: 403 }
        );
      }

      log("supabase_error", { status: error.status ?? 400, message: error.message });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status ?? 400 }
      );
    }

    const user = data.user;

    log("created", { status: 201 });
    return NextResponse.json(
      { ok: true, user: user ? { id: user.id, email: user.email } : null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    log("server_error", { status: 500, message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

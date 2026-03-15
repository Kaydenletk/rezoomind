import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      log("email_in_use", { status: 409 });
      return NextResponse.json(
        { ok: false, error: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    log("created", { status: 201 });
    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    log("server_error", { status: 500, message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

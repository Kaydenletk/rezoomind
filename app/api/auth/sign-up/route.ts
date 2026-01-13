import { NextResponse } from "next/server";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password : "";
    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : "";

    if (!name || !emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid profile details" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 400 }
      );
    }

    // TODO: Provision user in auth system.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}

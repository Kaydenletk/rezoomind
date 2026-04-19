import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const BodySchema = z.object({
  roles: z.array(z.string().min(1).max(40)).max(10),
  locations: z.array(z.string().min(1).max(60)).max(10),
  grad_year: z.number().int().min(2020).max(2035).optional(),
});

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const interest = await prisma.interest.findUnique({ where: { userId } });
  return NextResponse.json({ ok: true, interest });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const interest = await prisma.interest.upsert({
    where: { userId },
    update: {
      roles: parsed.roles,
      locations: parsed.locations,
      grad_year: parsed.grad_year,
    },
    create: {
      userId,
      roles: parsed.roles,
      locations: parsed.locations,
      grad_year: parsed.grad_year,
    },
  });

  return NextResponse.json({ ok: true, interest });
}

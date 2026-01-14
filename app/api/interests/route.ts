import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const interestsSchema = z.object({
  roles: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  gradYear: z.number().int().nullable().optional(),
});

const normalizeList = (items: string[] | undefined) =>
  (items ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("interests")
    .select("roles,locations,keywords,grad_year,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, interests: data ?? null });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = interestsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid interests payload" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const gradYear =
    typeof parsed.data.gradYear === "number" && !Number.isNaN(parsed.data.gradYear)
      ? parsed.data.gradYear
      : null;

  const { data, error } = await supabase
    .from("interests")
    .upsert(
      {
        user_id: user.id,
        roles: normalizeList(parsed.data.roles),
        locations: normalizeList(parsed.data.locations),
        keywords: normalizeList(parsed.data.keywords),
        grad_year: gradYear,
      },
      { onConflict: "user_id" }
    )
    .select("roles,locations,keywords,grad_year,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, interests: data });
}

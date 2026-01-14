import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const resumeSchema = z.object({
  resumeText: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

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
    .from("resumes")
    .select("resume_text,file_url,created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resume: data ?? null });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resumeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid resume payload" }, { status: 400 });
  }

  const resumeText = parsed.data.resumeText?.trim() || null;
  const fileUrl = parsed.data.fileUrl?.trim() || null;

  if (!resumeText && !fileUrl) {
    return NextResponse.json(
      { ok: false, error: "Provide a resume PDF or paste your resume text." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("resumes")
    .upsert(
      {
        user_id: user.id,
        resume_text: resumeText,
        file_url: fileUrl,
      },
      { onConflict: "user_id" }
    )
    .select("resume_text,file_url,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, resume: data });
}

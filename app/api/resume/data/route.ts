import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractKeywords } from "@/lib/matching/keywords";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { extractTextFromPDF } from "@/lib/pdf-extract";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const data = await prisma.resume.findUnique({
    where: { userId },
    select: { resume_text: true, file_url: true, resume_keywords: true, created_at: true, parsed_at: true },
  });
  return NextResponse.json({ ok: true, resume: data ?? null });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const formData = await request.formData();
    let resumeText = (formData.get("resumeText") as string | null)?.trim() || null;
    const file = formData.get("file") as File | null;

    let fileUrl: string | null = null;
    if (file) {
      fileUrl = `/uploads/${file.name}`;
      // Extract text from PDF if no resumeText was provided
      if (!resumeText) {
        const buffer = Buffer.from(await file.arrayBuffer());
        resumeText = await extractTextFromPDF(buffer);
      }
    }

    if (!resumeText) {
      return NextResponse.json(
        { ok: false, error: "No resume text found. Upload a PDF or paste text." },
        { status: 400 }
      );
    }

    // Extract keywords
    const resumeKeywords = extractKeywords(resumeText, 120);

    // Upsert resume to database
    const data = await prisma.resume.upsert({
      where: { userId },
      update: {
        resume_text: resumeText,
        file_url: fileUrl,
        resume_keywords: resumeKeywords,
        parsed_at: new Date(),
      },
      create: {
        userId,
        resume_text: resumeText,
        file_url: fileUrl,
        resume_keywords: resumeKeywords,
        parsed_at: new Date(),
      },
    });

    // Generate embedding (non-blocking: if it fails, /api/matches/score generates lazily)
    try {
      const embedding = await generateEmbedding(resumeText);
      await prisma.resume.update({
        where: { userId },
        data: { embedding },
      });
    } catch (e) {
      console.error("[resume/data] Embedding generation failed, will retry on match:", e);
    }

    return NextResponse.json({ ok: true, resume: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

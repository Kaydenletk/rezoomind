import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
     const session = await getServerSession(authOptions);

     if (!session?.user) {
          return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
     }

     try {
          const formData = await request.formData();
          const resumeText = formData.get("resumeText") as string | null;
          const file = formData.get("file") as File | null;

          // TODO: Implement S3/R2/Local file upload logic here instead of Supabase Storage
          // For now, just simulating success.

          let fileUrl = null;
          if (file) {
               fileUrl = `/uploads/${file.name}`; // Mock URL
          }

          // TODO: Save to Prisma when Resume model is created
          const resume = {
               resume_text: resumeText,
               file_url: fileUrl,
               created_at: new Date().toISOString()
          };

          return NextResponse.json({ ok: true, resume });
     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

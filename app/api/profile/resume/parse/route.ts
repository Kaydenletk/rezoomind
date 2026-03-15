import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pdfParse from "pdf-parse";

export async function POST(request: Request) {
     try {
          const session = await getServerSession(authOptions);
          if (!session?.user?.id) {
               return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const formData = await request.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
               return NextResponse.json({ error: "Missing file" }, { status: 400 });
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Provide quick parsing of PDF content
          const data = await pdfParse(buffer);
          const parsedText = data.text.trim();

          return NextResponse.json({
               success: true,
               text: parsedText,
               fileName: file.name
          });

     } catch (error: any) {
          console.error("[api/profile/resume/parse] POST error:", error);
          return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
     }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
     const session = await getServerSession(authOptions);

     if (!session?.user) {
          return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
     }

     const userId = (session.user as any).id;

     try {
          // Return empty arrays/null for now until the exact Prisma models are built
          // for resumes, preferences, and matches.
          const resumes: any[] = [];
          const preferences = null;
          const matchRows: any[] = [];

          return NextResponse.json({
               ok: true,
               resumes,
               preferences,
               matchRows,
          });
     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

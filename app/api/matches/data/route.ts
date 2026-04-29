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
          const [_resumeData, preferencesData, _matchesData] = await Promise.all([
               // Assuming a resume model will eventually exist. Empty for now.
               prisma.$queryRaw`SELECT 1 as dummy`,
               prisma.interest.findUnique({
                    where: { userId },
                    select: { roles: true, locations: true, keywords: true }
               }),
               // Assuming a job_matches model or equivalent will exist.
               prisma.$queryRaw`SELECT 1 as dummy`
          ]);

          // Format response to mimic old Supabase return structure temporarily
          // until full models are implemented.
          const resume = null;
          const preferences = preferencesData ? {
               interested_roles: preferencesData.roles,
               preferred_locations: preferencesData.locations,
               keywords: preferencesData.keywords
          } : null;
          const matches: any[] = [];

          return NextResponse.json({ ok: true, resume, preferences, matches });

     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

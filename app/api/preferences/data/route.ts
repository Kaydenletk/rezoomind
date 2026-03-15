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
          const preferencesData = await prisma.interest.findUnique({
               where: { userId },
               select: { roles: true, locations: true, keywords: true }
          });

          const prefs = preferencesData ? {
               interested_roles: preferencesData.roles,
               preferred_locations: preferencesData.locations,
               keywords: preferencesData.keywords
          } : null;

          return NextResponse.json({ ok: true, prefs });
     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

export async function POST(request: Request) {
     const session = await getServerSession(authOptions);

     if (!session?.user) {
          return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
     }

     const userId = (session.user as any).id;

     try {
          const body = await request.json();
          const { interested_roles, preferred_locations, keywords } = body;

          await prisma.interest.upsert({
               where: { userId },
               update: {
                    roles: interested_roles,
                    locations: preferred_locations,
                    keywords: keywords,
               },
               create: {
                    userId,
                    roles: interested_roles,
                    locations: preferred_locations,
                    keywords: keywords,
               }
          });

          return NextResponse.json({ ok: true });
     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

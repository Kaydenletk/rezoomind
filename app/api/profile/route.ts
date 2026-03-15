import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
     try {
          const session = await getServerSession(authOptions);
          if (!session?.user?.id) {
               return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const profile = await prisma.candidateProfile.findUnique({
               where: { userId: session.user.id },
          });

          return NextResponse.json({ profile: profile || {} });
     } catch (error: any) {
          console.error("[api/profile] GET error:", error);
          return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
     }
}

export async function POST(request: Request) {
     try {
          const session = await getServerSession(authOptions);
          if (!session?.user?.id) {
               return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const data = await request.json();

          const profile = await prisma.candidateProfile.upsert({
               where: { userId: session.user.id },
               update: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    addressLine1: data.addressLine1,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    linkedinUrl: data.linkedinUrl,
                    githubUrl: data.githubUrl,
                    portfolioUrl: data.portfolioUrl,
                    usWorkAuth: data.usWorkAuth,
                    requiresSponsorship: data.requiresSponsorship,
                    veteranStatus: data.veteranStatus,
                    disabilityStatus: data.disabilityStatus,
                    gender: data.gender,
                    race: data.race,
                    masterResume: data.masterResume,
                    masterResumeName: data.masterResumeName,
               },
               create: {
                    userId: session.user.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    addressLine1: data.addressLine1,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode,
                    country: data.country,
                    linkedinUrl: data.linkedinUrl,
                    githubUrl: data.githubUrl,
                    portfolioUrl: data.portfolioUrl,
                    usWorkAuth: data.usWorkAuth,
                    requiresSponsorship: data.requiresSponsorship,
                    veteranStatus: data.veteranStatus,
                    disabilityStatus: data.disabilityStatus,
                    gender: data.gender,
                    race: data.race,
                    masterResume: data.masterResume,
                    masterResumeName: data.masterResumeName,
               },
          });

          return NextResponse.json({ success: true, profile });
     } catch (error: any) {
          console.error("[api/profile] POST error:", error);
          const errorMsg = error instanceof Error ? error.message : String(error);
          return NextResponse.json({ error: errorMsg || "Internal Server Error" }, { status: 500 });
     }
}

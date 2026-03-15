import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
     try {
          // Check total jobs
          const totalJobs = await prisma.job_postings.count();

          // Check latest job
          const latestJob = await prisma.job_postings.findFirst({
               select: { created_at: true, role: true, company: true, source: true },
               orderBy: { created_at: 'desc' }
          });

          // Check jobs from last 24 hours
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const last24Hours = await prisma.job_postings.count({
               where: { created_at: { gte: oneDayAgo } }
          });

          // Check jobs from last hour
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const lastHour = await prisma.job_postings.count({
               where: { created_at: { gte: oneHourAgo } }
          });

          return NextResponse.json({
               ok: true,
               stats: {
                    totalJobs,
                    latestJob,
                    last24Hours,
                    lastHour,
               }
          });
     } catch (error: any) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
     }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';

/**
 * GET /api/profile/autofill
 * Returns the user's CandidateProfile data formatted for form autofill.
 * Authenticated via JWT (from Chrome extension).
 */
export async function GET(request: Request) {
     try {
          // Extract JWT from Authorization header
          const authHeader = request.headers.get('authorization');
          if (!authHeader?.startsWith('Bearer ')) {
               return NextResponse.json(
                    { error: 'Authorization token required' },
                    { status: 401 }
               );
          }

          const token = authHeader.slice(7);
          let decoded: any;

          try {
               decoded = jwt.verify(token, JWT_SECRET);
          } catch {
               return NextResponse.json(
                    { error: 'Invalid or expired token' },
                    { status: 401 }
               );
          }

          const userId = decoded.userId;
          if (!userId) {
               return NextResponse.json(
                    { error: 'Invalid token payload' },
                    { status: 401 }
               );
          }

          // Fetch candidate profile
          const profile = await prisma.candidateProfile.findUnique({
               where: { userId },
          });

          if (!profile) {
               return NextResponse.json(
                    { error: 'No profile found. Please complete your profile in the Rezoomind app first.' },
                    { status: 404 }
               );
          }

          // Fetch user email as fallback
          const user = await prisma.user.findUnique({
               where: { id: userId },
               select: { email: true },
          });

          // Return flat object optimized for form injection
          return NextResponse.json({
               firstName: profile.firstName || '',
               lastName: profile.lastName || '',
               email: user?.email || '',
               phone: profile.phone || '',
               addressLine1: profile.addressLine1 || '',
               city: profile.city || '',
               state: profile.state || '',
               zipCode: profile.zipCode || '',
               country: profile.country || 'United States',
               linkedinUrl: profile.linkedinUrl || '',
               githubUrl: profile.githubUrl || '',
               portfolioUrl: profile.portfolioUrl || '',
               usWorkAuth: profile.usWorkAuth ?? true,
               requiresSponsorship: profile.requiresSponsorship ?? false,
               veteranStatus: profile.veteranStatus || 'I am not a veteran',
               disabilityStatus: profile.disabilityStatus || 'No, I do not have a disability',
               gender: profile.gender || 'Prefer not to answer',
               race: profile.race || 'Prefer not to answer',
          });
     } catch (error: any) {
          console.error('[profile/autofill] Error:', error);
          return NextResponse.json(
               { error: 'Failed to fetch profile' },
               { status: 500 }
          );
     }
}

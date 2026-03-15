import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';

/**
 * POST /api/auth/extension-token
 * Validates email + password and returns a JWT for Chrome extension auth.
 */
export async function POST(request: Request) {
     try {
          const { email, password } = await request.json();

          if (!email || !password) {
               return NextResponse.json(
                    { error: 'Email and password are required' },
                    { status: 400 }
               );
          }

          // Find user by email
          const user = await prisma.user.findUnique({
               where: { email },
               select: {
                    id: true,
                    email: true,
                    name: true,
                    password: true,
               },
          });

          if (!user || !user.password) {
               return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
               );
          }

          // Verify password
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
               return NextResponse.json(
                    { error: 'Invalid email or password' },
                    { status: 401 }
               );
          }

          // Generate JWT (30-day expiry)
          const token = jwt.sign(
               {
                    userId: user.id,
                    email: user.email,
                    purpose: 'chrome-extension',
               },
               JWT_SECRET,
               { expiresIn: '30d' }
          );

          return NextResponse.json({
               token,
               user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
               },
          });
     } catch (error: any) {
          console.error('[auth/extension-token] Error:', error);
          return NextResponse.json(
               { error: 'Authentication failed' },
               { status: 500 }
          );
     }
}

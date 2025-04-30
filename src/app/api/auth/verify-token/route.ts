import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExp: {
          gt: new Date() // token is not expired
        }
      }
    });

    // Return whether token is valid
    return NextResponse.json({ valid: !!user });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json({ valid: false });
  }
} 
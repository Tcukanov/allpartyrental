import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Get calendar events for the authenticated client
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Fetch calendar events
    const events = await prisma.calendar.findMany({
      where: { 
        userId: userId 
      },
      orderBy: {
        birthDate: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
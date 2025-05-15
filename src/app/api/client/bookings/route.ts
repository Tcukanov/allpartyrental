import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * GET /api/client/bookings
 * Fetches all parties for the current client user for use in the calendar
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { message: 'Client access required' } },
        { status: 403 }
      );
    }

    // Get parties for the client with active transactions
    const parties = await prisma.party.findMany({
      where: {
        clientId: session.user.id,
        // Find parties that have transactions in any active status
        partyServices: {
          some: {
            // At least one service is connected to an approved offer
            offers: {
              some: {
                status: 'APPROVED'
              }
            }
          }
        }
      },
      include: {
        city: true,
        partyServices: {
          include: {
            service: true,
            offers: {
              where: {
                status: 'APPROVED'
              },
              include: {
                provider: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc', // Order by date ascending to show the nearest events first
      },
    });

    console.log(`Found ${parties.length} active events for user ${session.user.id}`);
    
    // Return the parties data directly without wrapping in a success object
    // This matches the format expected by the client
    return NextResponse.json(parties, { status: 200 });
  } catch (error: any) {
    console.error('Get client bookings error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch bookings', details: error.message } },
      { status: 500 }
    );
  }
} 
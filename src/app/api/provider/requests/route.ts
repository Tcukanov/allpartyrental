export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    console.log(`Provider requests check: Session user ID=${session.user.id}, email=${session.user.email}`);

    // Check if user is a provider - Find by email first, then use that user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { 
        id: true, 
        role: true, 
        provider: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      console.error(`User not found: ${session.user.email}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    if (user.role !== 'PROVIDER') {
      console.error(`User is not a provider: ${user.id}, role=${user.role}`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }

    if (!user.provider) {
      console.error(`Provider record not found for user: ${user.id}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Provider record not found' } },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build the where clause for offers - use the Provider ID, not User ID
    // We need to show offers where:
    // 1. Transaction is completed/approved (not PENDING)
    // 2. OR there's no transaction at all (legacy offers)
    const where: any = {
      providerId: user.provider.id,  // Use provider.id instead of user.id
      OR: [
        {
          // Case 1: Transaction exists and is NOT pending (payment was captured)
          transaction: {
            status: {
              not: 'PENDING'
            }
          }
        },
        {
          // Case 2: No transaction exists at all (legacy offers or direct bookings)
          transaction: {
            is: null
          }
        }
      ]
    };

    if (status) {
      where.status = status;
    }

    console.log(`Looking for offers with provider ID: ${user.provider.id} (user ID: ${user.id}) - excluding unpaid orders`);
    
    // Get offers with related data
    const offers = await prisma.offer.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
          }
        },
        partyService: {
          include: {
            party: {
              select: {
                id: true,
                name: true,
                date: true,
                startTime: true,
              }
            }
          }
        },
        transaction: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    console.log(`Found ${offers.length} offers matching the criteria`);
    
    // Debug log to show the status of each offer
    if (offers.length > 0) {
      console.log('Offer details:');
      offers.forEach(offer => {
        console.log(`- Offer ID: ${offer.id}, Status: ${offer.status}, TransactionStatus: ${offer.transaction?.status || 'N/A'}`);
      });
    }

    // Count total offers matching the criteria
    const totalCount = await prisma.offer.count({
      where
    });

    return NextResponse.json({
      success: true,
      data: offers,
      meta: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Get provider requests error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
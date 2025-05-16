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

    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true, provider: true }
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build the where clause for offers - use session.user.id to maintain consistency
    const where: any = {
      providerId: session.user.id
    };

    if (status) {
      where.status = status;
    }

    console.log(`Looking for offers with provider ID: ${session.user.id}`);
    
    // Debug to check if there are any offers at all for this user regardless of providerId
    const allUserOffers = await prisma.offer.findMany({
      where: { 
        OR: [
          { providerId: session.user.id },
          { providerId: user.id }
        ]
      },
      select: { id: true, providerId: true }
    });
    console.log(`Found ${allUserOffers.length} total offers for this user:`, allUserOffers);

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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    console.log(`Found ${offers.length} offers matching the criteria`);

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
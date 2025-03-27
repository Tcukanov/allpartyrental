import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      providerId: session.user.id as string,
    };
    
    if (status) {
      where.status = status;
    }

    // Get offers
    const offers = await prisma.offer.findMany({
      where,
      include: {
        service: true,
        partyService: {
          include: {
            party: {
              include: {
                client: {
                  select: {
                    id: true,
                    name: true,
                    profile: {
                      select: {
                        avatar: true,
                      },
                    },
                  },
                },
                city: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Count total offers
    const total = await prisma.offer.count({ where });

    return NextResponse.json({
      success: true,
      data: offers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get offers error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { partyServiceId, price, description, photos } = body;

    // Validate input
    if (!partyServiceId || !price || !description) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Get party service
    const partyService = await prisma.partyService.findUnique({
      where: {
        id: partyServiceId,
      },
      include: {
        party: true,
        service: true,
      },
    });

    if (!partyService) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party service not found' } },
        { status: 404 }
      );
    }

    // Check if party is published
    if (partyService.party.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Party is not published' } },
        { status: 400 }
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        providerId: session.user.id as string,
        clientId: partyService.party.clientId,
        serviceId: partyService.serviceId,
        partyServiceId,
        price,
        description,
        photos: photos || [],
      },
      include: {
        service: true,
        partyService: {
          include: {
            party: true,
          },
        },
      },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: partyService.party.clientId,
        type: 'NEW_OFFER',
        title: 'New Offer Received',
        content: `You have received a new offer for ${partyService.service.name} in your party: ${partyService.party.name}`,
      },
    });

    // Create chat for communication
    await prisma.chat.create({
      data: {
        offerId: offer.id,
      },
    });

    return NextResponse.json({ success: true, data: offer }, { status: 201 });
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

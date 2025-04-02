import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NotificationType } from '@prisma/client';

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
    const { partyServiceId, price, description, photos = [] } = body;

    // Validate input
    if (!partyServiceId || !price || !description) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Check if party service exists
    const partyService = await prisma.partyService.findUnique({
      where: {
        id: partyServiceId,
      },
      include: {
        party: {
          include: {
            client: true,
          },
        },
        service: true,
        offers: {
          where: {
            providerId: session.user.id,
          },
        },
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

    // Check if provider already has an offer for this party service
    if (partyService.offers.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'You already have an offer for this party service' } },
        { status: 400 }
      );
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        providerId: session.user.id,
        clientId: partyService.party.clientId,
        serviceId: partyService.serviceId,
        partyServiceId: partyService.id,
        price: price,
        description: description,
        photos: photos,
        status: 'PENDING',
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            profile: true,
          },
        },
        service: true,
        partyService: {
          include: {
            party: true,
          },
        },
      },
    });

    // Create notification for the client
    await prisma.notification.create({
      data: {
        userId: partyService.party.clientId,
        type: NotificationType.NEW_OFFER,
        title: 'New offer received',
        content: `You have received a new offer for ${partyService.service.name} in your party: ${partyService.party.name}. Offer details: ${price} - ${description}`,
        isRead: false,
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
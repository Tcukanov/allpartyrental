import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get offer by ID
    const offer = await prisma.offer.findUnique({
      where: {
        id,
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    avatar: true,
                  },
                },
              }
            }
          },
        },
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
        service: true,
        partyService: {
          include: {
            party: true,
          },
        },
        chat: {
          include: {
            messages: {
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this offer
    const isClient = session.user.id === offer.clientId;
    const isProvider = session.user.id === offer.providerId;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: offer }, { status: 200 });
  } catch (error) {
    console.error('Get offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { price, description, photos } = body;

    // Get offer by ID
    const offer = await prisma.offer.findUnique({
      where: {
        id,
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this offer
    if (session.user.id !== offer.providerId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if offer can be updated
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Offer cannot be updated' } },
        { status: 400 }
      );
    }

    // Update offer
    const updatedOffer = await prisma.offer.update({
      where: {
        id,
      },
      data: {
        price,
        description,
        photos,
      },
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: offer.clientId,
        type: 'OFFER_UPDATED',
        title: 'Offer Updated',
        content: `An offer for your party has been updated.`,
      },
    });

    return NextResponse.json({ success: true, data: updatedOffer }, { status: 200 });
  } catch (error) {
    console.error('Update offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    // Get offer by ID
    const offer = await prisma.offer.findUnique({
      where: {
        id,
      },
      include: {
        partyService: {
          include: {
            party: true,
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

    // Check if user is authorized to approve this offer
    if (session.user.id !== offer.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if offer can be approved
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Offer cannot be approved' } },
        { status: 400 }
      );
    }

    // Update offer status to APPROVED
    const updatedOffer = await prisma.offer.update({
      where: {
        id,
      },
      data: {
        status: 'APPROVED',
      },
    });

    // Create transaction for the approved offer
    const transaction = await prisma.transaction.create({
      data: {
        partyId: offer.partyService.partyId,
        offerId: offer.id,
        amount: offer.price,
        status: 'PENDING',
      },
    });

    // Update party status to IN_PROGRESS if not already
    if (offer.partyService.party.status !== 'IN_PROGRESS') {
      await prisma.party.update({
        where: {
          id: offer.partyService.partyId,
        },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    }

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: offer.providerId,
        type: 'OFFER_UPDATED',
        title: 'Offer Approved',
        content: `Your offer has been approved by the client.`,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        offer: updatedOffer, 
        transaction 
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Approve offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

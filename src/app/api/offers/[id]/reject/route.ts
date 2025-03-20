import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

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

    // Check if user is authorized to reject this offer
    if (session.user.id !== offer.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if offer can be rejected
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Offer cannot be rejected' } },
        { status: 400 }
      );
    }

    // Update offer status to REJECTED
    const updatedOffer = await prisma.offer.update({
      where: {
        id,
      },
      data: {
        status: 'REJECTED',
      },
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: offer.providerId,
        type: 'OFFER_UPDATED',
        title: 'Offer Rejected',
        content: `Your offer has been rejected by the client.`,
      },
    });

    return NextResponse.json({ success: true, data: updatedOffer }, { status: 200 });
  } catch (error) {
    console.error('Reject offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

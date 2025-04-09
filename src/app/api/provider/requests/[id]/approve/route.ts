import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { NotificationType } from '@prisma/client'; 

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
    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }

    // Get the offer with service data
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            providerId: true,
            name: true  // Include the service name
          }
        },
        client: {
          select: {
            id: true
          }
        }
      }
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } },
        { status: 404 }
      );
    }

    // Check if the provider owns the service
    if (offer.service.providerId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only manage offers for your own services' } },
        { status: 403 }
      );
    }

    // Check if the offer is in PENDING status
    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Only pending offers can be approved' } },
        { status: 400 }
      );
    }

    // Update the offer status to APPROVED
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        status: 'APPROVED',
      }
    });

    // Create a notification for the client
    await prisma.notification.create({
      data: {
        userId: offer.client.id,
        title: 'Service Request Approved',
        content: `Your request for the service "${offer.service.name}" has been approved.`,
        type: NotificationType.SYSTEM,
        isRead: false,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedOffer
    }, { status: 200 });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
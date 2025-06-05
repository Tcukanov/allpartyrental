import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { offerRequiresAction } from '@/utils/statusConfig';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('Reject request: No session or user found');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    console.log(`Processing rejection for offer ID: ${id}`);
    
    // Check if user is a provider
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

    if (!user || user.role !== 'PROVIDER') {
      console.error(`User ${session.user.email} is not a provider`);
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

    // Get the offer with service data
    const serviceOffer = await prisma.offer.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            providerId: true,
            name: true
          }
        }
      }
    });

    if (!serviceOffer) {
      console.error(`Offer with ID ${id} not found`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } },
        { status: 404 }
      );
    }

    // Check if the provider owns the service - use Provider ID, not User ID
    if (serviceOffer.service.providerId !== user.provider.id) {
      console.error(`Provider ${user.provider.id} does not own service ${serviceOffer.service.id} (owned by ${serviceOffer.service.providerId})`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only manage offers for your own services' } },
        { status: 403 }
      );
    }

    // Check if the offer status allows rejection
    if (!offerRequiresAction(serviceOffer.status)) {
      console.error(`Offer status ${serviceOffer.status} does not allow rejection`);
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `Offers with status ${serviceOffer.status} cannot be rejected` } },
        { status: 400 }
      );
    }

    // Get the request body for optional rejection reason
    let reasonForRejection = '';
    try {
      const body = await request.json();
      reasonForRejection = body.reason || '';
      console.log(`Rejection reason: "${reasonForRejection}"`);
    } catch (e) {
      console.log('No rejection reason provided');
      // No body or invalid JSON, continue without reason
    }

    console.log(`Updating offer ${id} status to REJECTED`);
    // Update the offer status to REJECTED
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        status: 'REJECTED',
        description: reasonForRejection ? `${serviceOffer.description}\n\nRejection reason: ${reasonForRejection}` : serviceOffer.description
      }
    });

    // Check for any existing transaction and update its status
    console.log(`Checking for existing transaction for offer ${id}`);
    const existingTransaction = await prisma.transaction.findUnique({
      where: { offerId: id }
    });

    // If there's a transaction, update its status to DECLINED
    if (existingTransaction) {
      console.log(`Updating transaction ${existingTransaction.id} to DECLINED status`);
      await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: 'DECLINED',
          updatedAt: new Date()
        }
      });
    } else {
      console.log(`No existing transaction found for offer ${id}`);
    }

    // Create a notification for the client
    console.log(`Creating notification for client ${serviceOffer.clientId}`);
    await prisma.notification.create({
      data: {
        userId: serviceOffer.clientId,
        title: 'Service Offer Rejected',
        content: `Your request for the service "${serviceOffer.service.name}" has been rejected.${
          reasonForRejection ? ` Reason: ${reasonForRejection}` : ''
        }`,
        type: 'SYSTEM',
        isRead: false,
      }
    });

    console.log(`Successfully rejected offer ${id}`);
    return NextResponse.json({
      success: true,
      data: updatedOffer
    }, { status: 200 });
  } catch (error) {
    console.error('Reject offer error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
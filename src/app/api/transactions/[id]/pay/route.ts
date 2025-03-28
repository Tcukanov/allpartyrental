import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';

/**
 * Process payment for a transaction
 * This creates a payment intent that will be captured only upon provider approval
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const transactionId = params.id;

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        offer: {
          include: {
            client: true,
            provider: true,
            service: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is the client
    if (session.user.id !== transaction.offer.client.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the client can pay for this transaction' } },
        { status: 403 }
      );
    }

    // Check if transaction is in a valid state - use string comparison for now due to type issues
    if (transaction.status as string !== "PENDING") {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Transaction is already in ${transaction.status} state` } },
        { status: 400 }
      );
    }

    // Get fee percentages (use defaults if not set)
    const clientFeePercent = 5.0;
    const providerFeePercent = 10.0;
    
    // Create a payment intent with manual capture 
    // This allows us to authorize the payment but only capture it when the provider approves
    const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent({
      amount: Number(transaction.amount),
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        transactionId: transaction.id,
        offerId: transaction.offerId,
        clientId: transaction.offer.client.id,
        providerId: transaction.offer.provider.id,
        serviceName: transaction.offer.service.name
      },
      clientFeePercent,
      providerFeePercent
    });
    
    // Calculate the review deadline (24 hours from now)
    const reviewDeadline = new Date();
    reviewDeadline.setHours(reviewDeadline.getHours() + 24);
    
    // Update the transaction with the payment intent ID and set status to PROVIDER_REVIEW
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentIntentId,
        status: "PROVIDER_REVIEW" as any, // Unsafe cast due to Prisma typing issue
        reviewDeadline
      }
    });
    
    // Send notification to the provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.provider.id,
        type: 'PAYMENT',
        title: 'New Service Request',
        content: `You have received a new service request for ${transaction.offer.service.name}. Please review and respond within 24 hours.`,
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        clientSecret,
        reviewDeadline,
        amount: transaction.amount
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process payment' } },
      { status: 500 }
    );
  }
}
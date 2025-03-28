import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';

/**
 * Decline a transaction
 * This endpoint is used by providers to decline service requests
 * When declined, the payment will be refunded to the client
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
    
    // Get the body for decline reason
    const body = await request.json();
    const { reason } = body;
    
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
    
    // Check if user is the provider
    if (session.user.id !== transaction.offer.provider.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the provider can decline this transaction' } },
        { status: 403 }
      );
    }
    
    // Check if transaction is in a valid state - use string comparison for now due to type issues
    if (transaction.status as string !== "PROVIDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `This transaction cannot be declined because its status is ${transaction.status}` } },
        { status: 400 }
      );
    }
    
    // Process refund if payment intent exists
    if (transaction.paymentIntentId) {
      try {
        await paymentService.cancelPaymentIntent(transaction.paymentIntentId);
      } catch (error) {
        console.error('Error canceling payment:', error);
        return NextResponse.json(
          { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to cancel payment' } },
          { status: 500 }
        );
      }
    }
    
    // Update the transaction status to DECLINED
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "DECLINED" as any // Unsafe cast due to Prisma typing issue
      }
    });
    
    // Send notification to the client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Service Request Declined',
        content: `Your service request for ${transaction.offer.service.name} has been declined by the provider. ${reason ? `Reason: ${reason}` : ''}`,
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Decline transaction error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to decline transaction' } },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';

/**
 * Approve a transaction
 * This endpoint is used by providers to approve service requests
 * When approved, the payment will be placed in escrow for 24 hours
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const transactionId = id;
    
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the provider can approve this transaction' } },
        { status: 403 }
      );
    }
    
    // Check if transaction is in a valid state - use string comparison for now due to type issues
    if (transaction.status as string !== "PROVIDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `This transaction cannot be approved because its status is ${transaction.status}` } },
        { status: 400 }
      );
    }
    
    // Capture the payment to move funds into escrow
    if (transaction.paymentIntentId) {
      try {
        await paymentService.capturePaymentIntent(transaction.paymentIntentId);
      } catch (error) {
        console.error('Error capturing payment:', error);
        return NextResponse.json(
          { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to capture payment' } },
          { status: 500 }
        );
      }
    }
    
    // Calculate escrow end time (24 hours from now)
    const escrowEndTime = new Date();
    escrowEndTime.setHours(escrowEndTime.getHours() + 24);
    
    // Update the transaction status to ESCROW and set escrow end time
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "ESCROW" as any, // Unsafe cast due to Prisma typing issue
        escrowStartTime: new Date(),
        escrowEndTime
      } as any // Unsafe cast for the entire data object due to property issues
    });
    
    // Send notification to the client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Service Request Approved',
        content: `Your service request for ${transaction.offer.service.name} has been approved. The payment will be held in escrow for 24 hours.`,
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        escrowEndTime
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Approve transaction error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to approve transaction' } },
      { status: 500 }
    );
  }
} 
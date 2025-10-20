import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { PaymentService } from '@/lib/payment/payment-service';

/**
 * Issue refund for a transaction
 * POST /api/provider/transactions/[id]/refund
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap params
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Only providers can issue refunds' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    console.log(`Provider ${session.user.id} requesting refund for transaction ${id}`);

    // Find transaction and verify it belongs to this provider
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            provider: {
              include: {
                user: true
              }
            },
            client: true,
            service: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify this transaction belongs to the provider
    if (transaction.offer.provider.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to refund this transaction' },
        { status: 403 }
      );
    }

    // Check if transaction can be refunded
    if (!['COMPLETED', 'ESCROW', 'PAID_PENDING_PROVIDER_ACCEPTANCE'].includes(transaction.status)) {
      return NextResponse.json(
        { success: false, error: `Transaction cannot be refunded. Current status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Check if already refunded
    if (transaction.status === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: 'Transaction has already been refunded' },
        { status: 400 }
      );
    }

    // Check if transaction has been captured
    if (!transaction.paypalCaptureId) {
      return NextResponse.json(
        { success: false, error: 'Transaction has not been captured yet. Cannot refund.' },
        { status: 400 }
      );
    }

    console.log('Issuing refund via PaymentService...');

    // Process refund via PaymentService
    const paymentService = new PaymentService();
    const refundResult = await paymentService.refundPayment(transaction.id, reason);

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Refund Issued',
        content: `A refund of $${transaction.amount.toFixed(2)} has been issued for your booking of ${transaction.offer.service.name}. Reason: ${reason}`,
        isRead: false
      }
    });

    console.log('Refund issued successfully:', refundResult.refundId);

    return NextResponse.json({
      success: true,
      message: 'Refund issued successfully',
      data: {
        refundId: refundResult.refundId,
        status: refundResult.status,
        amount: transaction.amount
      }
    });

  } catch (error: any) {
    console.error('Refund error:', error);
    
    // Handle specific PayPal errors
    if (error.message?.includes('INSUFFICIENT_FUNDS') || error.message?.includes('insufficient seller balance')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient funds in your PayPal account to process this refund. Please add funds to your PayPal account and try again.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process refund' 
      },
      { status: 500 }
    );
  }
}


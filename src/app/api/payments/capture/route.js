import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PaymentService } from '@/lib/payment/payment-service.js';
import { prisma } from '@/lib/prisma';

/**
 * Capture payment after client approval
 * POST /api/payments/capture
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();

    // Validate input
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    console.log(`Capturing payment for order: ${orderId}`);

    // Create payment service instance
    const paymentService = new PaymentService();

    // Find transaction by payment intent ID
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: orderId },
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
        { success: false, error: 'Transaction not found for this payment order' },
        { status: 404 }
      );
    }

    // Check if user is the client or admin
    const isClient = transaction.offer.client.id === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to capture this payment' },
        { status: 403 }
      );
    }

    // Capture the payment
    const captureResult = await paymentService.capturePayment(orderId);

    // Update transaction status to captured
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID_PENDING_PROVIDER_ACCEPTANCE',
        paymentMethodId: captureResult.captureId,
        updatedAt: new Date()
      }
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.provider.id,
        type: 'PAYMENT',
        title: 'New Booking Request - Payment Received',
        content: `You have a new booking request for "${transaction.offer.service.name}" from ${transaction.offer.client.name}. Payment of $${captureResult.amountReceived.toFixed(2)} has been received. Please review and accept/decline the booking.`,
        isRead: false
      }
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Payment Successful',
        content: `Your payment of $${captureResult.amountReceived.toFixed(2)} for "${transaction.offer.service.name}" has been processed. The provider will now review your booking request.`,
        isRead: false
      }
    });

    console.log(`Payment captured for transaction ${transaction.id}: ${captureResult.captureId}`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        captureId: captureResult.captureId,
        amountReceived: captureResult.amountReceived,
        status: captureResult.status,
        message: 'Payment captured successfully. Provider will be notified to review your booking.'
      }
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/payment-service.js';
import { prisma } from '@/lib/prisma/client';

/**
 * Provider accepts booking and receives payment (minus commission)
 * POST /api/bookings/accept
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

    const { transactionId } = await request.json();

    // Validate input
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'transactionId is required' },
        { status: 400 }
      );
    }

    // Get transaction with provider details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        offer: {
          include: {
            client: true,
            provider: {
              include: {
                provider: true // Provider details including PayPal email
              }
            },
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

    // Check if user is the provider or admin
    const isProvider = transaction.offer.provider.id === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Only the provider can accept this booking' },
        { status: 403 }
      );
    }

    // Check if payment has been received
    if (transaction.status !== 'PAID_PENDING_PROVIDER_ACCEPTANCE') {
      return NextResponse.json(
        { success: false, error: `Cannot accept booking with status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Check if provider has PayPal email configured
    const providerEmail = transaction.offer.provider.provider?.paypalEmail || transaction.offer.provider.email;
    
    if (!providerEmail) {
      return NextResponse.json(
        { success: false, error: 'Provider must have a PayPal email configured to receive payment' },
        { status: 400 }
      );
    }

    // Release funds to provider (this will deduct commission automatically)
    const payoutResult = await paymentService.releaseToProvider(transactionId, providerEmail);

    // Update transaction status to completed
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.provider.id,
        type: 'PAYMENT',
        title: 'Payment Received',
        content: `You have received $${payoutResult.providerAmount.toFixed(2)} for "${transaction.offer.service.name}". Platform fee: $${payoutResult.providerFee.toFixed(2)}.`,
        isRead: false
      }
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'BOOKING',
        title: 'Booking Confirmed',
        content: `Your booking for "${transaction.offer.service.name}" has been confirmed by the provider.`,
        isRead: false
      }
    });

    console.log(`Booking accepted for transaction ${transactionId}. Provider receives: $${payoutResult.providerAmount}, Platform fee: $${payoutResult.providerFee}`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        providerAmount: payoutResult.providerAmount,
        providerFee: payoutResult.providerFee,
        totalReceived: payoutResult.totalReceived,
        payoutBatchId: payoutResult.payoutBatchId,
        message: `Booking accepted. Payment of $${payoutResult.providerAmount.toFixed(2)} has been sent to your PayPal account.`
      }
    });

  } catch (error) {
    console.error('Error accepting booking:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
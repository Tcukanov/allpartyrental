import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { paymentService } from '@/lib/payment/paypal/service';

/**
 * Captures a PayPal payment intent/order
 * This is the final step in the payment process
 */
export async function POST(request) {
  try {
    // Get the user from the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request data
    const data = await request.json();
    const { orderId, ...metadata } = data;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log(`Capturing PayPal payment for order ${orderId} by user ${session.user.id}`);

    // Capture the payment with PayPal
    const captureResult = await paymentService.capturePaymentIntent(orderId);

    console.log(`PayPal payment captured: ${JSON.stringify(captureResult)}`);

    // Create a transaction record in the database
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        providerId: metadata.providerId,
        amount: captureResult.amount_received,
        status: 'COMPLETED',
        paymentMethod: 'PAYPAL',
        paymentIntentId: orderId,
        captureId: captureResult.id,
        metadata: metadata
      }
    });

    // Return the capture result to the client
    return NextResponse.json({
      success: true,
      data: {
        id: captureResult.id,
        status: captureResult.status,
        amount_received: captureResult.amount_received,
        transaction_id: transaction.id
      }
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `PayPal API error: ${error.message}` || 'Failed to capture payment' 
      },
      { status: 500 }
    );
  }
} 
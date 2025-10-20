import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/payment/payment-service';

/**
 * Capture payment after client approval
 * POST /api/payments/capture
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Missing required field: orderId' 
      }, { status: 400 });
    }

    console.log(`Capturing PayPal payment for order: ${orderId}`);

    // Capture payment using PayPal marketplace
    const paymentService = new PaymentService();
    const result = await paymentService.capturePayment(orderId);

    if (!result.success) {
      return NextResponse.json({ 
        error: 'Payment capture failed' 
      }, { status: 400 });
    }

    console.log(`Payment captured successfully: ${result.captureId}`);

    return NextResponse.json({
      success: true,
      captureId: result.captureId,
      status: result.status,
      transactionId: result.transaction.id,
      paymentDetails: result.paymentDetails || null
    });

  } catch (error) {
    console.error('Payment capture error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to capture payment' 
    }, { status: 500 });
  }
} 
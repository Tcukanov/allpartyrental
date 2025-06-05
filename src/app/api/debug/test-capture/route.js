import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PaymentService } from '@/lib/payment/payment-service';

/**
 * Debug endpoint to test PayPal capture
 * POST /api/debug/test-capture
 * Body: { "orderId": "6YW27100NM7921421" }
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
        error: 'Missing orderId in request body' 
      }, { status: 400 });
    }

    console.log(`Testing PayPal capture for order: ${orderId}`);

    // Test auto-capture
    const paymentService = new PaymentService();
    const captureResult = await paymentService.capturePayment(orderId);

    return NextResponse.json({
      success: true,
      captureResult: captureResult
    });

  } catch (error) {
    console.error('Test capture error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to test capture' 
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PayPalClientFixed } from '@/lib/payment/paypal-client';

/**
 * Debug endpoint to check PayPal order status
 * GET /api/debug/paypal-order?orderId=xxx
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ 
        error: 'Missing orderId parameter' 
      }, { status: 400 });
    }

    console.log(`Checking PayPal order: ${orderId}`);

    // Get order details from PayPal
    const paypalClient = new PayPalClientFixed();
    const order = await paypalClient.getOrder(orderId);

    console.log('PayPal order details:', order);

    // Extract approval URL
    const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        amount: order.purchase_units?.[0]?.amount?.value,
        currency: order.purchase_units?.[0]?.amount?.currency_code,
        approvalUrl: approvalUrl,
        links: order.links
      }
    });

  } catch (error) {
    console.error('PayPal order check error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to check PayPal order' 
    }, { status: 500 });
  }
} 
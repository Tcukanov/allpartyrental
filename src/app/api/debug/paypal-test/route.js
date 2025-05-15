import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/payment/paypal/service';

/**
 * Debug endpoint to test PayPal configuration
 */
export async function GET(request) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  
  try {
    // Test a basic order creation with a realistic test amount
    const testAmount = 599.95; // $599.95 - testing with a realistic price
    console.log(`Testing PayPal with amount: ${testAmount}`);
    
    const testOrder = await paymentService.createPaymentIntent({
      amount: testAmount,
      currency: 'USD',
      description: 'PayPal Test Order'
    });
    
    // Test a marketplace order too if we have client ID
    let marketplaceResult = null;
    if (paypalClientId) {
      try {
        const marketplaceOrder = await paymentService.createPaymentIntent({
          amount: testAmount,
          currency: 'USD',
          description: 'PayPal Marketplace Test',
          providerId: 'test-provider-id' // This will trigger the marketplace flow
        });
        
        marketplaceResult = {
          success: true,
          orderId: marketplaceOrder.id,
          status: marketplaceOrder.status
        };
      } catch (marketplaceError) {
        marketplaceResult = {
          success: false,
          error: marketplaceError.message
        };
      }
    }
    
    // Return test result
    return NextResponse.json({
      success: true,
      environment: isDevelopment ? 'development' : 'production',
      paypalConfigured: !!paypalClientId,
      usingMocks: isDevelopment && !paypalClientId,
      test: {
        amount: testAmount,
        orderId: testOrder.id,
        status: testOrder.status
      },
      marketplace: marketplaceResult,
      message: paypalClientId 
        ? 'PayPal connection successful' 
        : 'Using mock PayPal responses in development'
    });
  } catch (error) {
    console.error('PayPal test error:', error);
    return NextResponse.json({
      success: false,
      environment: isDevelopment ? 'development' : 'production',
      paypalConfigured: !!paypalClientId,
      error: error.message,
      message: 'Failed to test PayPal connection'
    }, { status: 500 });
  }
} 
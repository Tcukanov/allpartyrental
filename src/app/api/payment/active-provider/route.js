import { NextResponse } from 'next/server';
import { getActivePaymentProvider } from '@/lib/payment/paypal/config';

/**
 * API endpoint to get the currently active payment provider
 * @returns {Promise<NextResponse>} JSON response with the active provider (paypal or stripe)
 */
export async function GET() {
  try {
    const provider = await getActivePaymentProvider();
    
    return NextResponse.json({
      success: true,
      provider
    });
  } catch (error) {
    console.error('Error getting active payment provider:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get active payment provider',
        provider: 'paypal' // Default to PayPal if there's an error
      },
      { status: 500 }
    );
  }
} 
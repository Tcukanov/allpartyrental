import { NextResponse } from 'next/server';

/**
 * API route for providing PayPal configuration to the client
 * This helps keep sensitive credentials secure by not exposing them directly in client-side code
 */
export async function GET() {
  try {
    // Get the client ID from environment variables
    const clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
    
    if (!clientId) {
      console.error('PayPal client ID is not configured in environment variables');
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 500 }
      );
    }
    
    // Return the client ID to the client-side
    return NextResponse.json({
      clientId,
      environment: process.env.PAYPAL_MODE || 'sandbox'
    });
  } catch (error) {
    console.error('Error in PayPal config API:', error);
    return NextResponse.json(
      { error: 'Failed to get PayPal configuration' },
      { status: 500 }
    );
  }
} 
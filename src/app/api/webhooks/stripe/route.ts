import { NextResponse } from 'next/server';

/**
 * Placeholder Stripe webhook handler
 * Returns a message indicating that Stripe integration has been removed
 */
export async function POST(request: Request): Promise<NextResponse> {
  console.log('Stripe webhook received but Stripe integration has been removed');
  
  return NextResponse.json(
    { 
      success: false,
      message: 'Stripe integration has been removed from this application'
    },
    { status: 410 } // 410 Gone status code
  );
} 
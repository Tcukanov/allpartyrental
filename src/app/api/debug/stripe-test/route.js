import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    console.log('Testing Stripe connection with key:', process.env.STRIPE_SECRET_KEY ? 'Key exists' : 'Key missing');
    
    // Create a simple payment intent for testing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        test: 'true',
      },
      description: 'Test payment intent',
    });
    
    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, {
      status: 500
    });
  }
} 
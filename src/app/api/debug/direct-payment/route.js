import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Debug endpoint for testing direct payments
 * This endpoint creates a payment intent without requiring a transaction
 * to be created in the database first
 */
export async function POST(request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Initialize Stripe
    console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe secret key is not configured' },
        { status: 500 }
      );
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Get data from request
    const data = await request.json();
    const { amount, title = 'Service booking' } = data;
    
    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }
    
    // Convert amount to cents (Stripe uses the smallest currency unit)
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    console.log(`Creating payment intent for ${amountInCents} cents (${amount} ${data.currency || 'USD'})`);
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: data.currency || 'usd',
      capture_method: 'manual', // Authorize only, capture later
      metadata: {
        debug: 'true',
        userId: session.user.id,
        title: title
      },
      description: `Debug payment for ${title}`
    });
    
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating direct payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
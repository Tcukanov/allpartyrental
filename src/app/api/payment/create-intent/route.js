import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { paymentService } from '@/lib/payment/paypal/service';

/**
 * Creates a PayPal payment intent
 * This is the first step in the payment process
 */
export async function POST(request) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
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
    const { amount, serviceName, metadata = {} } = data;

    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }

    // Parse the amount - amount is expected as a string with decimal places (e.g. "10.00") in dollars
    let parsedAmount;
    try {
      // Parse amount to a number with 2 decimal places
      parsedAmount = parseFloat(parseFloat(amount).toFixed(2));
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount value');
      }
      
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount format' },
        { status: 400 }
      );
    }

    console.log(`Creating PayPal payment intent for user ${session.user.id} with amount ${parsedAmount}`);

    try {
      // Create a payment intent with PayPal
      const paymentIntent = await paymentService.createPaymentIntent({
        amount: parsedAmount,
        currency: 'USD',
        description: metadata.description || `Payment for ${serviceName || 'service'}`,
        metadata: {
          ...metadata,
          userId: session.user.id,
          serviceName: serviceName || 'Service'
        },
        providerId: metadata.providerId
      });

      console.log(`PayPal payment intent created: ${paymentIntent.id}`);

      // Return the payment intent to the client
      return NextResponse.json({
        success: true,
        data: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        }
      });
    } catch (paymentError) {
      console.error('Error creating PayPal payment intent:', paymentError);
      
      // If in development mode, create a mock payment intent as fallback
      if (isDevelopment) {
        console.log('Development mode - returning mock payment intent as fallback');
        const mockId = `MOCK-FALLBACK-${Math.random().toString(36).substring(2, 15)}`;
        
        return NextResponse.json({
          success: true,
          data: {
            id: mockId,
            client_secret: mockId,
            amount: parsedAmount,
            status: 'CREATED',
            isMock: true
          },
          warning: 'Using mock payment intent due to PayPal API error'
        });
      }
      
      // In production, return the error
      return NextResponse.json(
        { 
          success: false, 
          error: paymentError.message || 'Failed to create payment intent' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing payment request:', error);
    
    // If in development mode, create a mock payment intent as fallback
    if (isDevelopment) {
      console.log('Development mode - returning mock payment intent as fallback');
      const mockId = `MOCK-FALLBACK-${Math.random().toString(36).substring(2, 15)}`;
      
      return NextResponse.json({
        success: true,
        data: {
          id: mockId,
          client_secret: mockId,
          amount: 0,
          status: 'CREATED',
          isMock: true
        },
        warning: 'Using mock payment intent due to server error'
      });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process payment request' 
      },
      { status: 500 }
    );
  }
} 
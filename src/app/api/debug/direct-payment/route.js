import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { logger } from '@/lib/logger';

/**
 * Debug endpoint for testing direct payments with PayPal
 * This is a placeholder after migrating from Stripe to PayPal
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
    
    // Log debug information
    logger.info('Debug direct payment endpoint called - now using PayPal instead of Stripe');
    
    // Get data from request
    const data = await request.json();
    const { amount, title = 'Service booking' } = data;
    
    if (!amount) {
      return NextResponse.json(
        { success: false, error: 'Amount is required' },
        { status: 400 }
      );
    }
    
    // Return a message about PayPal integration
    return NextResponse.json({
      success: false,
      message: 'Stripe integration has been removed. The application now uses PayPal for payment processing.',
      info: 'This debug endpoint is no longer supported. Please use the regular payment flow with PayPal.',
      debugData: {
        amount: amount,
        title: title,
        timestamp: new Date().toISOString(),
        userId: session.user.id
      }
    });
  } catch (error) {
    logger.error('Error in debug direct payment endpoint:', error);
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
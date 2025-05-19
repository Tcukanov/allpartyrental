import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Legacy Stripe test endpoint - keeping as a stub that returns info about migration to PayPal
 */
export async function GET() {
  try {
    logger.info('Legacy Stripe test endpoint accessed');
    
    return NextResponse.json({
      success: false,
      message: 'Stripe integration has been removed',
      details: 'The application has migrated from Stripe to PayPal for payment processing',
      migrationInfo: {
        previousProvider: 'Stripe',
        currentProvider: 'PayPal',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error in legacy Stripe test endpoint:', error);
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
'use strict';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processAllTransactions } from '@/lib/jobs/transaction-processor';
import { logger } from '@/lib/logger';

/**
 * Process all pending transactions
 * This endpoint allows admins to manually trigger the transaction processor
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UNAUTHORIZED', 
            message: 'Authentication required' 
          } 
        },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Only administrators can process transactions manually' 
          } 
        },
        { status: 403 }
      );
    }
    
    logger.info('Manual transaction processing triggered by admin');
    
    // Process all transactions
    const result = await processAllTransactions();
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Transaction processing completed successfully',
        processed: result
      }
    });
    
  } catch (error) {
    logger.error('Error processing transactions manually:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to process transactions',
          details: error.message
        } 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processAllTransactions } from '@/lib/jobs/transaction-processor';

/**
 * Admin endpoint to manually trigger transaction processing
 * This processes pending provider reviews and escrow releases
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only admins can process transactions' } },
        { status: 403 }
      );
    }
    
    // Process all transactions
    const result = await processAllTransactions();
    
    return NextResponse.json({
      success: true,
      data: result
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing transactions:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process transactions' } },
      { status: 500 }
    );
  }
} 
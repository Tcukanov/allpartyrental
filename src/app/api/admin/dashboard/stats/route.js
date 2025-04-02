import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Return basic mock data
    return NextResponse.json({
      metrics: {
        users: {
          total: 1287,
          new: 15,
          percentChange: '1.2'
        },
        transactions: {
          total: 4532,
          new: 25,
          percentChange: '0.6'
        },
        revenue: {
          total: 87654.32,
          new: 750.00,
          percentChange: '0.9'
        }
      },
      transactionStatus: {
        pending: 25,
        processing: 15,
        completed: 75,
        cancelled: 8,
        refunded: 3
      },
      systemHealth: {
        apiStatus: 'healthy',
        dbStatus: 'healthy',
        processorStatus: 'healthy',
        lastBackup: new Date().toISOString(),
        queuedJobs: 3,
        failedJobs: 0
      }
    });
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard stats' },
      { status: 500 }
    );
  }
} 
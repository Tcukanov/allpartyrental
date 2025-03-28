import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      logger.warn('Unauthorized access attempt to dashboard stats API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      logger.warn(`User ${session.user.email} attempted to access dashboard stats without admin privileges`);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    // In a real application, you would fetch this data from your database
    // For demonstration purposes, we're returning mock data
    
    // Calculate dates for time ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // Generate random data for demonstration
    const totalUsers = 1287;
    const newUsersToday = Math.floor(Math.random() * 20) + 5;
    const totalTransactions = 4532;
    const newTransactionsToday = Math.floor(Math.random() * 30) + 10;
    const totalRevenue = 87654.32;
    const newRevenueToday = Math.floor(Math.random() * 1000) + 500;
    
    // Generate transaction status distribution
    const transactionStatusData = {
      pending: Math.floor(Math.random() * 30) + 10,
      processing: Math.floor(Math.random() * 20) + 5,
      completed: Math.floor(Math.random() * 100) + 50,
      cancelled: Math.floor(Math.random() * 10) + 2,
      refunded: Math.floor(Math.random() * 5) + 1,
    };
    
    // Generate system health metrics
    const systemHealth = {
      apiStatus: 'healthy',
      dbStatus: 'healthy',
      processorStatus: 'healthy',
      lastBackup: new Date(now.getTime() - (25 * 60 * 60 * 1000)).toISOString(), // 25 hours ago
      queuedJobs: Math.floor(Math.random() * 5),
      failedJobs: Math.floor(Math.random() * 2),
    };
    
    // Generate recent activity
    const activityTypes = [
      'transaction_created', 'user_registered', 'listing_published', 
      'review_posted', 'payout_processed', 'dispute_opened'
    ];
    
    const recentActivity = Array.from({ length: 10 }, (_, i) => {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const hoursAgo = Math.floor(Math.random() * 24);
      const date = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
      
      return {
        id: `act-${Date.now()}-${i}`,
        type: activityType,
        user: {
          id: `user-${Math.floor(Math.random() * 1000)}`,
          name: ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Charlie Davis'][Math.floor(Math.random() * 5)],
          email: ['john@example.com', 'jane@example.com', 'alice@example.com', 'bob@example.com', 'charlie@example.com'][Math.floor(Math.random() * 5)]
        },
        timestamp: date.toISOString(),
        data: {
          amount: activityType.includes('transaction') || activityType.includes('payout') ? (Math.random() * 500 + 50).toFixed(2) : null,
          itemName: activityType.includes('listing') ? ['Party Tent', 'Sound System', 'Disco Ball', 'Popcorn Machine', 'Bouncy Castle'][Math.floor(Math.random() * 5)] : null,
          rating: activityType.includes('review') ? Math.floor(Math.random() * 5) + 1 : null,
        }
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Generate monthly revenue data for the chart
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      
      return {
        month: month.toLocaleString('default', { month: 'short' }),
        year: month.getFullYear(),
        amount: Math.floor(Math.random() * 20000) + 10000
      };
    }).reverse();
    
    // Log the request
    logger.info(`Admin ${session.user.email} retrieved dashboard stats`);
    
    // Return the dashboard data
    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          new: newUsersToday,
          percentChange: ((newUsersToday / (totalUsers - newUsersToday)) * 100).toFixed(1)
        },
        transactions: {
          total: totalTransactions,
          new: newTransactionsToday,
          percentChange: ((newTransactionsToday / (totalTransactions - newTransactionsToday)) * 100).toFixed(1)
        },
        revenue: {
          total: totalRevenue,
          new: newRevenueToday,
          percentChange: ((newRevenueToday / (totalRevenue - newRevenueToday)) * 100).toFixed(1)
        }
      },
      transactionStatus: transactionStatusData,
      systemHealth,
      recentActivity,
      monthlyRevenue
    });
  } catch (error) {
    logger.error('Error retrieving dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard stats', message: error.message },
      { status: 500 }
    );
  }
} 
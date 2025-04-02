export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { ServiceStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'You must be logged in to access this endpoint' }
      }, { status: 401 });
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'You do not have permission to access this endpoint' }
      }, { status: 403 });
    }

    // Get current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch user statistics
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    const totalProviders = await prisma.user.count({
      where: {
        role: 'PROVIDER'
      }
    });
    const totalClients = await prisma.user.count({
      where: {
        role: 'CLIENT'
      }
    });

    // Fetch service statistics
    const totalServices = await prisma.service.count();
    const activeServices = await prisma.service.count({
      where: {
        status: ServiceStatus.ACTIVE
      }
    });
    const pendingApprovalServices = await prisma.service.count({
      where: {
        status: 'PENDING_APPROVAL' as ServiceStatus
      }
    });

    // Fetch transaction statistics
    const totalTransactions = await prisma.transaction.count();
    const transactionsToday = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });
    const transactionsValue = await prisma.transaction.aggregate({
      _sum: {
        amount: true
      }
    });

    // Fetch party statistics
    const totalParties = await prisma.party.count();
    const activeParties = await prisma.party.count({
      where: {
        date: {
          gte: new Date()
        }
      }
    });
    const completedParties = await prisma.party.count({
      where: {
        date: {
          lt: new Date()
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          providers: totalProviders,
          clients: totalClients
        },
        services: {
          total: totalServices,
          active: activeServices,
          pendingApproval: pendingApprovalServices
        },
        transactions: {
          total: totalTransactions,
          today: transactionsToday,
          value: transactionsValue._sum.amount || 0
        },
        parties: {
          total: totalParties,
          active: activeParties,
          completed: completedParties
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: 'Failed to fetch admin statistics' }
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get site-wide statistics
    const userCount = await prisma.user.count();
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    const providerCount = await prisma.user.count({ where: { role: 'PROVIDER' } });
    
    const activePartyCount = await prisma.party.count({ 
      where: { 
        status: { in: ['PUBLISHED', 'IN_PROGRESS'] } 
      } 
    });
    
    const completedPartyCount = await prisma.party.count({ 
      where: { 
        status: 'COMPLETED' 
      } 
    });
    
    const totalTransactionAmount = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });
    
    const pendingDisputeCount = await prisma.dispute.count({
      where: {
        isResolved: false,
      },
    });
    
    const advertisementCount = await prisma.advertisement.count({
      where: {
        isActive: true,
      },
    });
    
    const advertisementRevenue = await prisma.advertisement.aggregate({
      _count: {
        id: true,
      },
      where: {
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Get recent activity
    const recentParties = await prisma.party.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });
    
    const recentTransactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        party: {
          select: {
            name: true,
          },
        },
        offer: {
          include: {
            provider: {
              select: {
                name: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          clients: clientCount,
          providers: providerCount,
          activeParties: activePartyCount,
          completedParties: completedPartyCount,
          pendingDisputes: pendingDisputeCount,
          activeAdvertisements: advertisementCount,
        },
        financials: {
          totalTransactionAmount: totalTransactionAmount._sum.amount || 0,
          advertisementRevenue: advertisementRevenue._count.id || 0,
        },
        recent: {
          parties: recentParties,
          transactions: recentTransactions,
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get admin statistics error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

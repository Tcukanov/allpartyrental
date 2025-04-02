import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

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
    
    // Get actual data from database
    const [
      totalUsers,
      totalParties,
      totalServices,
      totalOffers,
      pendingOffers,
      approvedOffers,
      rejectedOffers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.party.count(),
      prisma.service.count(),
      prisma.offer.count(),
      prisma.offer.count({ where: { status: 'PENDING' } }),
      prisma.offer.count({ where: { status: 'APPROVED' } }),
      prisma.offer.count({ where: { status: 'REJECTED' } })
    ]);
    
    // Calculate new users in the last 7 days
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: last7Days
        }
      }
    });
    
    // Calculate percentage change
    const percentChange = totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(1) : '0';
    
    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          new: newUsers,
          percentChange
        },
        parties: {
          total: totalParties
        },
        services: {
          total: totalServices
        }
      },
      offerStatus: {
        pending: pendingOffers,
        approved: approvedOffers,
        rejected: rejectedOffers,
        total: totalOffers
      },
      systemHealth: {
        apiStatus: 'healthy',
        dbStatus: 'healthy',
        lastCheck: new Date().toISOString()
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
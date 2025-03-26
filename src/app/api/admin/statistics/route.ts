import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma/client';
import { Session } from 'next-auth';
import { SessionStrategy } from 'next-auth';

interface CustomSession extends Session {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions as { session: { strategy: SessionStrategy } }) as CustomSession;

    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get statistics
    const [
      totalUsers,
      totalProviders,
      totalClients,
      totalServices,
      totalParties,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.service.count(),
      prisma.party.count(),
      prisma.transaction.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'COMPLETED'
        }
      })
    ]);

    // Get recent parties
    const recentParties = await prisma.party.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: true,
        partyServices: {
          include: {
            service: true
          }
        }
      }
    });

    // Get popular services
    const popularServices = await prisma.service.findMany({
      take: 5,
      orderBy: {
        offers: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: { offers: true }
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      totalProviders,
      totalClients,
      totalServices,
      totalParties,
      totalRevenue: totalRevenue._sum.amount || 0,
      recentParties,
      popularServices
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

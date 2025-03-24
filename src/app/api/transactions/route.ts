import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          {
            offer: {
              providerId: session.user.id as string,
            },
          },
          {
            party: {
              clientId: session.user.id as string,
            },
          },
        ],
      },
      include: {
        party: {
          select: {
            id: true,
            name: true,
            date: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        offer: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        dispute: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

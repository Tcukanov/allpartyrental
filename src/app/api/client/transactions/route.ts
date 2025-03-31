import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { message: 'Forbidden - Only clients can access this endpoint' },
        { status: 403 }
      );
    }

    // Get client's user ID
    const userId = session.user.id;

    // Fetch all transactions for this client
    const transactions = await prisma.transaction.findMany({
      where: {
        offer: {
          clientId: userId
        }
      },
      include: {
        offer: {
          include: {
            service: true,
            provider: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        party: true
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching client transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
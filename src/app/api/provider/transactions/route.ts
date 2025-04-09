export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
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

    // Verify the user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { message: 'Forbidden - Only providers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get provider's user ID
    const userId = session.user.id;

    // Fetch all transactions for this provider
    const transactions = await prisma.transaction.findMany({
      where: {
        providerId: userId,
      } as Prisma.TransactionWhereInput,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } as Prisma.TransactionInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching provider transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
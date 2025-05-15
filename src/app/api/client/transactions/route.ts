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

    // Verify the user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { message: 'Forbidden - Only clients can access this endpoint' },
        { status: 403 }
      );
    }

    // Get client's user ID
    const userId = session.user.id;
    console.log(`Fetching transactions for client: ${userId}`);

    // Get transactions directly with the needed relationships
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
            },
            partyService: {
              include: {
                party: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${transactions.length} transactions for client ${userId}`);
    
    // Instead of filtering on the database, we'll send all transactions
    // and let the frontend deduplicate them appropriately
    const response = NextResponse.json(transactions);
    
    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching client transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
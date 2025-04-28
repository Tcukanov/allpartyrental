export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

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

    // First try to fetch transactions via the Offer relation
    try {
      // Fetch all transactions for this provider's offers
      const transactions = await prisma.transaction.findMany({
        where: {
          offer: {
            providerId: userId
          }
        },
        include: {
          offer: {
            include: {
              service: true,
              client: true,
              provider: true
            }
          },
          party: true
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Process the transactions to ensure they have the expected structure for the frontend
      const processedTransactions = transactions.map(transaction => {
        return {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          escrowEndTime: transaction.escrowEndTime,
          reviewDeadline: transaction.reviewDeadline,
          paymentIntentId: transaction.paymentIntentId,
          offerId: transaction.offerId,
          partyId: transaction.partyId,
          // Add client info from the offer relation
          client: transaction.offer?.client ?? null,
          // Add service info from the offer relation
          service: transaction.offer?.service ?? null,
          // Add other needed fields from the relations
          party: transaction.party ?? null
        };
      });

      return NextResponse.json(processedTransactions);
    } catch (error) {
      console.error('Error fetching provider transactions with offer relation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error fetching provider transactions:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
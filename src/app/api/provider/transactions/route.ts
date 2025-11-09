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

    // Get or create the provider record for this user
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create Provider record for users with PROVIDER role who don't have one
      console.log(`Auto-creating Provider record for user: ${session.user.name} (${session.user.id})`);
      
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business Name',
          bio: `Professional services provider`,
          isVerified: false,
          paypalOnboardingStatus: 'NOT_STARTED',
          paypalEnvironment: 'sandbox'
        }
      });
    }

    // First try to fetch transactions via the Offer relation
    try {
      // Fetch all transactions for this provider's offers
      // Exclude PENDING transactions (unpaid orders) - only show after payment is captured
      const transactions = await prisma.transaction.findMany({
        where: {
          offer: {
            providerId: provider.id
          },
          status: {
            not: 'PENDING' // Don't show unpaid orders to providers
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
          paypalOrderId: transaction.paypalOrderId,
          paypalCaptureId: transaction.paypalCaptureId,
          paypalTransactionId: transaction.paypalTransactionId,
          offerId: transaction.offerId,
          partyId: transaction.partyId,
          client: transaction.offer?.client ?? null,
          service: transaction.offer?.service ?? null,
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
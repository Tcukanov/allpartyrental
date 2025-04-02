import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Cancel a transaction (when payment fails)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const transactionId = params.id;

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        offer: {
          include: {
            client: true,
            partyService: true
          }
        },
        party: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is the client
    if (session.user.id !== transaction.offer.client.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the client can cancel this transaction' } },
        { status: 403 }
      );
    }

    // Update the transaction's status to CANCELLED
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'CANCELLED' as any
      }
    });

    // Optional: Clean up related records if this was a direct booking
    // Only if the offer was created specifically for this transaction
    if (transaction.offer.description.startsWith('Direct booking for')) {
      try {
        // Delete the offer (this should cascade to delete the transaction as well)
        await prisma.offer.delete({
          where: { id: transaction.offer.id }
        });
        
        // Delete the party service
        if (transaction.offer.partyService) {
          await prisma.partyService.delete({
            where: { id: transaction.offer.partyService.id }
          });
        }
        
        // Delete the party
        if (transaction.party) {
          await prisma.party.delete({
            where: { id: transaction.party.id }
          });
        }
      } catch (error) {
        console.error('Error cleaning up related records:', error);
        // Continue with the response even if cleanup fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Transaction cancelled successfully'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Transaction cancel error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel transaction' } },
      { status: 500 }
    );
  }
} 
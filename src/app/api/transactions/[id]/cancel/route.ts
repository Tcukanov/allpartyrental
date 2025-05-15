import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';

/**
 * Cancel a transaction
 * This endpoint is used by clients to cancel service requests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    console.log(`Processing cancellation request for transaction ID: ${id}`);
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('User not authenticated');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    console.log(`User authenticated: ${session.user.id}`);
    const transactionId = id;

    try {
      // Get the transaction with minimal required includes
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              client: true,
              provider: true,
              service: true,
              partyService: {
                include: {
                  party: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        console.error(`Transaction not found: ${transactionId}`);
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
          { status: 404 }
        );
      }

      console.log(`Found transaction with status: ${transaction.status}`);
      console.log(`Transaction client ID: ${transaction.offer?.client?.id}`);
      console.log(`Transaction offer ID: ${transaction.offerId}`);

      // Check if offer and client exist
      if (!transaction.offer || !transaction.offer.client) {
        console.error(`Transaction ${transactionId} has missing offer or client reference`);
        return NextResponse.json(
          { success: false, error: { code: 'DATA_ERROR', message: 'Transaction has missing data' } },
          { status: 400 }
        );
      }

      // Check if user is the client
      if (session.user.id !== transaction.offer.client.id) {
        console.error(`Unauthorized cancellation attempt by user ${session.user.id} for transaction ${transactionId}`);
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only the client can cancel this transaction' } },
          { status: 403 }
        );
      }

      console.log(`User ${session.user.id} is authorized to cancel transaction ${transactionId}`);

      // If there's a payment intent, try to cancel it
      if (transaction.paymentIntentId) {
        try {
          console.log(`Attempting to cancel payment intent ${transaction.paymentIntentId}`);
          
          // Try/catch specifically for payment cancellation
          const cancelResult = await paymentService.cancelPaymentIntent(transaction.paymentIntentId);
          console.log('Payment intent cancelled successfully:', cancelResult);
        } catch (paymentError) {
          console.error(`Error cancelling payment intent: `, paymentError);
          // Continue with transaction cancellation even if payment cancellation fails
        }
      } else {
        console.log('No payment intent to cancel');
      }

      // Update the transaction's status to CANCELLED
      console.log(`Updating transaction ${transactionId} status to CANCELLED`);
      const updatedTransaction = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'CANCELLED'
        }
      });

      console.log(`Transaction ${transactionId} status updated to CANCELLED`);

      // Send notification to the provider
      if (transaction.offer.provider?.id) {
        try {
          console.log(`Creating notification for provider ${transaction.offer.provider.id}`);
          await prisma.notification.create({
            data: {
              userId: transaction.offer.provider.id,
              type: 'PAYMENT',
              title: 'Service Request Cancelled',
              content: `The service request for "${transaction.offer.service?.name || 'your service'}" has been cancelled by the client.`,
              isRead: false
            }
          });
          console.log(`Notification sent to provider ${transaction.offer.provider.id}`);
        } catch (notificationError) {
          console.error(`Error sending notification:`, notificationError);
          // Continue even if notification fails
        }
      } else {
        console.log('No provider ID found, skipping notification');
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Transaction cancelled successfully',
          transaction: updatedTransaction
        }
      }, { status: 200 });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Database operation failed' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Transaction cancel error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to cancel transaction' } },
      { status: 500 }
    );
  }
} 
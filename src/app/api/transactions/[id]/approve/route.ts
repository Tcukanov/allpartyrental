import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';
import { getFeeSettings } from '@/lib/payment/fee-settings';
import { logger } from '@/lib/logger';

/**
 * Process approval for a transaction
 * This endpoint handles provider approval of a transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    const transactionId = id;
    
    logger.info(`Processing transaction approval request for ID: ${transactionId}`);
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      logger.info('User not authenticated');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    logger.info(`Transaction ID: ${transactionId}`);

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        offer: {
          include: {
            client: true,
            provider: true,
            service: true
          }
        }
      }
    });

    if (!transaction) {
      logger.error(`Transaction not found: ${transactionId}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    logger.info('Transaction data:', transaction);

    // Check user authorization - either the provider or admin
    const isAdmin = session.user.role === 'ADMIN';
    const isProvider = transaction.offer.provider.id === session.user.id;
    
    if (!isAdmin && !isProvider) {
      logger.error(`Unauthorized access to transaction ${transactionId} by user ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to approve this transaction' } },
        { status: 403 }
      );
    }
    
    // Check if transaction is in a valid state - use string comparison for now due to type issues
    if (transaction.status as string !== "PROVIDER_REVIEW") {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `This transaction cannot be approved because its status is ${transaction.status}` } },
        { status: 400 }
      );
    }
    
    // Capture the payment to move funds into escrow
    if (transaction.paymentIntentId) {
      try {
        // Capture the payment with PayPal
        const capturedPayment = await paymentService.capturePaymentIntent(transaction.paymentIntentId);
        logger.info('Payment captured successfully:', capturedPayment.id);
        
        // Get provider's PayPal account
        const provider = await prisma.provider.findFirst({
          where: { userId: transaction.offer.provider.id }
        });
        
        if (!provider?.paypalEmail) {
          logger.error(`Provider ${transaction.offer.provider.id} has no connected PayPal account`);
          
          // Move transaction to ESCROW instead of completing it
          // The admin will need to manually release funds later
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "ESCROW" as any,
              escrowStartTime: new Date(),
              escrowEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
            } as any
          });
          
          // Notify admin about missing PayPal account
          await prisma.notification.create({
            data: {
              userId: transaction.offer.provider.id,
              type: 'PAYMENT',
              title: 'PayPal Account Required',
              content: `A payment for "${transaction.offer.service.name}" is in escrow, but you need to connect your PayPal account to receive funds.`,
              isRead: false
            }
          });
          
          return NextResponse.json({
            success: true,
            data: {
              transaction: {
                ...transaction,
                status: "ESCROW"
              },
              message: "Payment is in escrow, but provider needs to connect PayPal account to receive funds."
            }
          }, { status: 200 });
        }
        
        try {
          // Get fee settings
          const { providerFeePercent } = await getFeeSettings();
          
          // Set up transaction for escrow
          const escrowEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          // Update transaction to ESCROW status
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "ESCROW" as any,
              escrowStartTime: new Date(),
              escrowEndTime: escrowEndTime
            } as any
          });
          
          // Send notification to provider about the payment
          await prisma.notification.create({
            data: {
              userId: transaction.offer.provider.id,
              type: 'PAYMENT',
              title: 'Payment In Escrow',
              content: `A payment for "${transaction.offer.service.name}" has been placed in escrow. It will be automatically released to your PayPal account in 24 hours.`,
              isRead: false
            }
          });
          
          // Send notification to the client
          await prisma.notification.create({
            data: {
              userId: transaction.offer.client.id,
              type: 'PAYMENT',
              title: 'Booking Confirmed',
              content: `Your booking for ${transaction.offer.service.name} has been confirmed. The payment is in escrow and will be released to the provider in 24 hours.`,
              isRead: false
            }
          });
          
          return NextResponse.json({
            success: true,
            data: {
              transaction: {
                ...transaction,
                status: "ESCROW"
              },
              escrowEndTime
            }
          }, { status: 200 });
          
        } catch (escrowError: any) {
          logger.error('Error setting up escrow:', escrowError);
          
          // If setting escrow fails, still attempt to complete transaction
          // Admin can manually handle any issues
          const escrowEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          await prisma.transaction.update({
            where: { id: transactionId },
            data: {
              status: "ESCROW" as any,
              escrowStartTime: new Date(),
              escrowEndTime
            } as any
          });
          
          // Notify admin about escrow setup failure
          await prisma.notification.create({
            data: {
              userId: "admin", // Replace with actual admin user ID if available
              type: 'SYSTEM',
              title: 'Escrow Setup Issue',
              content: `Issue setting up escrow for transaction ${transactionId}. Reason: ${escrowError.message}`,
              isRead: false
            }
          });
          
          return NextResponse.json({
            success: true,
            data: {
              transaction: {
                ...transaction,
                status: "ESCROW"
              },
              escrowEndTime,
              message: "Payment is in escrow, but there was an issue with setup. Admin attention may be required."
            }
          }, { status: 200 });
        }
      } catch (captureError: any) {
        logger.error('Error capturing payment:', captureError);
        
        return NextResponse.json({
          success: false,
          error: {
            code: 'CAPTURE_FAILED',
            message: 'Failed to capture payment',
            details: captureError.message
          }
        }, { status: 500 });
      }
    } else {
      // No payment intent to capture
      logger.error('No payment intent ID found for transaction:', transactionId);
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_PAYMENT',
          message: 'No payment information found for this transaction'
        }
      }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Unexpected error approving transaction:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'An unexpected error occurred' }
    }, { status: 500 });
  }
} 
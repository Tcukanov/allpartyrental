import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';
import { getFeeSettings } from '@/lib/payment/fee-settings';

/**
 * Process payment for a transaction
 * This creates a payment intent that will be captured only upon provider approval
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    console.log(`Processing payment request for transaction ${id}`);
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('User not authenticated');
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    console.log(`Transaction ID: ${id}`);

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            client: true,
            provider: true,
            service: true
          }
        },
        party: true
      }
    });

    if (!transaction) {
      console.error(`Transaction not found: ${id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    console.log('Transaction data:', JSON.stringify(transaction, null, 2));

    // Check user authorization - either the client or admin
    let clientId = null;
    let providerId = null;
    let serviceName = 'Service';

    if (transaction.offer) {
      clientId = transaction.offer.clientId;
      providerId = transaction.offer.providerId;
      serviceName = transaction.offer.service?.name || 'Offer Service';
    } else if (transaction.party) {
      clientId = transaction.party.clientId;
      
      // For direct service transactions, we need to get the provider ID
      // Get the service info if it exists
      if (transaction.offerId) {
        // Look up the service info
        const offerService = await prisma.service.findFirst({
          where: {
            offers: {
              some: {
                id: transaction.offerId
              }
            }
          }
        });

        if (offerService) {
          providerId = offerService.providerId;
          serviceName = offerService.name || 'Service';
        }
      }
    }

    // If we couldn't determine the client ID, return an error
    if (!clientId) {
      console.error(`Could not determine client for transaction ${id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction data is incomplete - missing client information' } },
        { status: 400 }
      );
    }

    // If we couldn't determine the provider ID, return an error
    if (!providerId) {
      console.error(`Could not determine provider for transaction ${id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction data is incomplete - missing provider information' } },
        { status: 400 }
      );
    }

    const isClient = session.user.id === clientId;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isClient && !isAdmin) {
      console.error(`Unauthorized access: User ${session.user.id} trying to process payment for client ${clientId}`);
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized - only the client can process this payment' } },
        { status: 403 }
      );
    }

    // Check if transaction is in a valid state
    if (transaction.status !== 'PENDING') {
      console.error(`Invalid transaction status: ${transaction.status}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction cannot be processed - invalid status' } },
        { status: 400 }
      );
    }

    // Create a payment intent
    try {
      // Get current fee settings
      const { clientFeePercent, providerFeePercent } = await getFeeSettings();
      
      console.log(`Creating payment intent for amount: ${transaction.amount}`);
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent({
        amount: Number(transaction.amount),
        currency: 'usd',
        capture_method: 'manual',
        metadata: {
          transactionId: transaction.id,
          offerId: transaction.offerId || '',
          clientId: clientId,
          providerId: providerId,
          serviceName: serviceName
        },
        clientFeePercent: clientFeePercent,
        providerFeePercent: providerFeePercent
      });
      console.log(`Payment intent created with ID: ${paymentIntentId}`);
      
      // Set a review deadline (24 hours)
      const reviewDeadline = addDays(new Date(), 1);
      
      // Update transaction with payment intent
      await prisma.transaction.update({
        where: { id },
        data: {
          status: 'PROVIDER_REVIEW',
          paymentIntentId,
          reviewDeadline
        }
      });
      console.log(`Transaction ${id} updated with payment intent ${paymentIntentId} and status changed to PROVIDER_REVIEW`);

    return NextResponse.json({
      success: true,
      data: {
          clientSecret,
          reviewDeadline
        }
      });
    } catch (paymentError) {
      console.error('Payment intent creation error:', paymentError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Failed to create payment intent',
            details: paymentError instanceof Error ? paymentError.message : String(paymentError)
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to process payment',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}
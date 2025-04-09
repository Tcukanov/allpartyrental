import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';

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
        }
      }
    });

    if (!transaction) {
      console.error(`Transaction not found: ${id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check user authorization
    const offer = transaction.offer;
    const isClient = session.user.id === offer.clientId;
    
    if (!isClient && session.user.role !== 'ADMIN') {
      console.error(`Unauthorized access: User ${session.user.id} trying to process payment for client ${offer.clientId}`);
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
      console.log(`Creating payment intent for amount: ${transaction.amount}`);
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent({
        amount: Number(transaction.amount),
        currency: 'usd',
        capture_method: 'manual',
        metadata: {
        transactionId: transaction.id,
          offerId: transaction.offerId,
          clientId: offer.clientId,
          providerId: offer.providerId,
          serviceName: offer.service.name
        },
        clientFeePercent: transaction.clientFeePercent,
        providerFeePercent: transaction.providerFeePercent
      });
      console.log(`Payment intent created with ID: ${paymentIntentId}`);
      
      // Set a review deadline (24 hours)
      const reviewDeadline = addDays(new Date(), 1);
      
      // Update transaction with payment intent
      await prisma.transaction.update({
        where: { id },
        data: {
          paymentIntentId,
          reviewDeadline
        }
      });
      console.log(`Transaction ${id} updated with payment intent ${paymentIntentId}`);

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
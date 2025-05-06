import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { paymentService } from '@/lib/payment/service';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { getFeeSettings } from '@/lib/payment/fee-settings';

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
    
    console.log(`Processing transaction approval request for ID: ${transactionId}`);
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('User not authenticated');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    console.log(`Transaction ID: ${transactionId}`);

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
      console.error(`Transaction not found: ${transactionId}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    console.log('Transaction data:', JSON.stringify(transaction, null, 2));

    // Check user authorization - either the provider or admin
    const isAdmin = session.user.role === 'ADMIN';
    const isProvider = transaction.offer.provider.id === session.user.id;
    
    if (!isAdmin && !isProvider) {
      console.error(`Unauthorized access to transaction ${transactionId} by user ${session.user.id}`);
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
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-08-16',
    });
    
    // Capture the payment to move funds into escrow
    if (transaction.paymentIntentId) {
      try {
        // Capture the payment
        const capturedPayment = await paymentService.capturePaymentIntent(transaction.paymentIntentId);
        console.log('Payment captured successfully:', capturedPayment.id);
        
        // Get provider's Stripe account ID
        const provider = await prisma.provider.findFirst({
          where: { userId: transaction.offer.provider.id }
        });
        
        if (provider?.stripeAccountId) {
          try {
            // Get fee settings
            const { providerFeePercent } = await getFeeSettings();
            
            // Calculate platform fee (provider's portion)
            const paymentIntent = await stripe.paymentIntents.retrieve(transaction.paymentIntentId);
            const totalAmount = paymentIntent.amount;
            const platformFee = Math.round(totalAmount * (providerFeePercent / 100));
            const transferAmount = totalAmount - platformFee;
            
            console.log(`Automatically transferring ${transferAmount} to provider (fee: ${platformFee})`);
            
            // Create transfer to provider's connected account
            const transfer = await stripe.transfers.create({
              amount: transferAmount,
              currency: paymentIntent.currency,
              destination: provider.stripeAccountId,
              source_transaction: typeof paymentIntent.latest_charge === 'string' 
                ? paymentIntent.latest_charge 
                : paymentIntent.latest_charge.id,
              metadata: {
                transactionId: transaction.id,
                paymentIntentId: transaction.paymentIntentId,
                providerId: transaction.offer.provider.id,
                platformFee,
                providerFeePercent,
                auto: 'true'
              }
            });
            
            console.log('Transfer created successfully:', transfer.id);
            
            // Update transaction with transfer details
            await prisma.transaction.update({
              where: { id: transactionId },
              data: {
                // Add only fields that exist in your Transaction model
                transferId: transfer.id,
                status: "COMPLETED" as any,
                escrowStartTime: new Date(),
                escrowEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
              } as any
            });
            
            // Send notification to provider about the payment
            await prisma.notification.create({
              data: {
                userId: transaction.offer.provider.id,
                type: 'PAYMENT',
                title: 'Payment Received',
                content: `A payment of ${(transferAmount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} for "${transaction.offer.service.name}" has been transferred to your account.`,
                isRead: false
              }
            });
          } catch (transferError) {
            console.error('Error transferring funds to provider:', transferError);
            // We'll continue even if transfer fails - admin can do it manually later
          }
        }
      } catch (error) {
        console.error('Error capturing payment:', error);
        return NextResponse.json(
          { success: false, error: { code: 'PAYMENT_ERROR', message: 'Failed to capture payment' } },
          { status: 500 }
        );
      }
    }
    
    // Calculate escrow end time (24 hours from now)
    const escrowEndTime = new Date();
    escrowEndTime.setHours(escrowEndTime.getHours() + 24);
    
    // Update the transaction status directly to COMPLETED and set escrow end time
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED" as any, // Unsafe cast due to Prisma typing issue
        escrowStartTime: new Date(),
        escrowEndTime
      } as any // Unsafe cast for the entire data object due to property issues
    });
    
    // Send notification to the client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Booking Confirmed',
        content: `Your booking for ${transaction.offer.service.name} has been confirmed and completed. The payment will be released to the provider in 24 hours.`,
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        escrowEndTime
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error approving transaction:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Server error' } },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';
import { getFeeSettings } from '@/lib/payment/fee-settings';

/**
 * Release captured funds for a specific transaction
 * Admin-only endpoint for manually releasing funds to providers
 */
export async function POST(request, { params }) {
  try {
    // Get transaction ID from URL parameters
    const { id } = params;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID is required' 
      }, { status: 400 });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Admin-only endpoint
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only administrators can release funds' 
      }, { status: 403 });
    }

    console.log(`Admin requested to release funds for transaction ID: ${id}`);

    // Find the transaction in the database
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            provider: true,
            service: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Check if transaction is in completed status and has a payment intent
    if (transaction.status !== 'COMPLETED' || !transaction.paymentIntentId) {
      return NextResponse.json({ 
        success: false, 
        error: `Transaction cannot be released. Status: ${transaction.status}, PaymentIntent: ${transaction.paymentIntentId ? 'exists' : 'missing'}` 
      }, { status: 400 });
    }

    // Check if funds were already released
    if (transaction.transferId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Funds have already been released for this transaction' 
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(transaction.paymentIntentId);
    
    // Verify payment is captured
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        success: false, 
        error: `Payment must be captured before funds can be released. Current status: ${paymentIntent.status}` 
      }, { status: 400 });
    }

    // Get provider Stripe account ID
    const providerId = transaction.offer.provider.userId;
    const provider = await prisma.provider.findFirst({
      where: { userId: providerId }
    });

    if (!provider || !provider.stripeAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Provider has no connected Stripe account' 
      }, { status: 400 });
    }

    // Get the fee settings
    const { providerFeePercent } = await getFeeSettings();

    // Calculate amount and fees
    const totalAmount = paymentIntent.amount; // Amount in cents
    const platformFee = Math.round(totalAmount * (providerFeePercent / 100));
    const transferAmount = totalAmount - platformFee;

    console.log(`Creating transfer: ${transferAmount} cents to ${provider.stripeAccountId} (fee: ${platformFee} cents)`);

    // Create the transfer
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: paymentIntent.currency,
      destination: provider.stripeAccountId,
      source_transaction: paymentIntent.latest_charge,
      metadata: {
        transactionId: transaction.id,
        paymentIntentId: transaction.paymentIntentId,
        providerId,
        platformFee,
        providerFeePercent
      }
    });

    // Update transaction with transfer information
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        transferId: transfer.id,
        transferAmount: transferAmount,
        platformFee: platformFee,
        transferStatus: 'COMPLETED',
        transferDate: new Date()
      }
    });

    // Send notification to provider
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: 'PAYMENT',
        title: 'Payment Received',
        content: `A payment of ${(transferAmount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} for "${transaction.offer.service.name}" has been transferred to your account.`,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          id: updatedTransaction.id,
          status: updatedTransaction.status,
          transferStatus: updatedTransaction.transferStatus,
          transferDate: updatedTransaction.transferDate
        },
        transfer: {
          id: transfer.id,
          amount: transfer.amount / 100, // Convert back to dollars for display
          currency: transfer.currency,
          created: new Date(transfer.created * 1000).toISOString()
        },
        fees: {
          platformFee: platformFee / 100, // Convert back to dollars for display
          providerFeePercent
        }
      }
    });
  } catch (error) {
    console.error('Error releasing funds to provider:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to release funds: ${error.message}`
    }, { status: 500 });
  }
} 
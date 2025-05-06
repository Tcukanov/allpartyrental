import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';
import { getFeeSettings } from '@/lib/payment/fee-settings';

/**
 * Release captured funds to a provider's Stripe account
 * This endpoint transfers money from the platform Stripe account to the provider's connected account
 * A platform fee will be retained based on the configured provider fee percentage
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Only admins or the system can release funds
    // In a production app, this would likely be triggered by a webhook or system process
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only administrators can release funds manually' 
      }, { status: 403 });
    }

    // Get paymentIntentId from request body
    const data = await request.json();
    const { paymentIntentId } = data;

    if (!paymentIntentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment intent ID is required' 
      }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify payment is captured (i.e., status is 'succeeded')
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        success: false, 
        error: `Payment must be captured before funds can be released. Current status: ${paymentIntent.status}` 
      }, { status: 400 });
    }

    // Get the provider ID from payment intent metadata
    const providerId = paymentIntent.metadata.providerId;
    if (!providerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Provider ID not found in payment metadata' 
      }, { status: 400 });
    }

    // Find provider's Stripe account ID
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

    // Create the transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: paymentIntent.currency,
      destination: provider.stripeAccountId,
      source_transaction: paymentIntent.latest_charge,
      metadata: {
        paymentIntentId,
        providerId,
        platformFee,
        providerFeePercent,
        originalAmount: totalAmount
      }
    });

    // Update transaction record in database if you have one
    // Example:
    // await prisma.transaction.update({
    //   where: { paymentIntentId },
    //   data: { 
    //     transferId: transfer.id,
    //     transferAmount,
    //     platformFee,
    //     transferStatus: 'COMPLETED'
    //   }
    // });

    return NextResponse.json({
      success: true,
      data: {
        transfer: {
          id: transfer.id,
          amount: transfer.amount / 100, // Convert back to dollars for display
          currency: transfer.currency,
          created: new Date(transfer.created * 1000).toISOString()
        },
        paymentIntent: {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back to dollars for display
          applicationFee: platformFee / 100 // Convert back to dollars for display
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
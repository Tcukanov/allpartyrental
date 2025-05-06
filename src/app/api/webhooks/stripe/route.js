import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma/client';
import { headers } from 'next/headers';

/**
 * Stripe webhook handler
 * Processes incoming events from Stripe
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Webhook Error: No Stripe signature included');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.log(`Received Stripe webhook event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
        
      case 'transfer.failed':
        await handleTransferFailed(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment_intent.succeeded event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log(`Payment succeeded: ${paymentIntent.id}`);
    
    // Find the transaction by payment intent ID
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: paymentIntent.id },
      include: {
        offer: {
          include: {
            provider: true,
            service: true,
            client: true
          }
        }
      }
    });
    
    if (!transaction) {
      console.log(`No transaction found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update the transaction status if needed
    if (transaction.status !== 'COMPLETED') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' }
      });
    }
    
    // Notify the client and provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Payment Processed',
        content: `Your payment for ${transaction.offer.service.name} has been successfully processed.`,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`);
    
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: paymentIntent.id },
      include: {
        offer: {
          include: {
            client: true,
            service: true
          }
        }
      }
    });
    
    if (!transaction) {
      console.log(`No transaction found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update the transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' }
    });
    
    // Notify the client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Payment Failed',
        content: `Your payment for ${transaction.offer.service.name} has failed. Please check your payment method and try again.`,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error handling payment_intent.payment_failed:', error);
  }
}

/**
 * Handle payment_intent.canceled event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function handlePaymentIntentCanceled(paymentIntent) {
  try {
    console.log(`Payment canceled: ${paymentIntent.id}`);
    
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: paymentIntent.id }
    });
    
    if (!transaction) {
      console.log(`No transaction found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update the transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'CANCELED' }
    });
  } catch (error) {
    console.error('Error handling payment_intent.canceled:', error);
  }
}

/**
 * Handle transfer.created event
 * @param {Object} transfer - Stripe transfer object
 */
async function handleTransferCreated(transfer) {
  try {
    console.log(`Transfer created: ${transfer.id}`);
    
    // Check for transaction ID in metadata
    if (!transfer.metadata?.transactionId) {
      console.log('No transaction ID in transfer metadata:', transfer.id);
      return;
    }
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: transfer.metadata.transactionId },
      include: {
        offer: {
          include: {
            provider: true,
            service: true
          }
        }
      }
    });
    
    if (!transaction) {
      console.log(`No transaction found with ID: ${transfer.metadata.transactionId}`);
      return;
    }
    
    // Update transaction with transfer info
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        transferId: transfer.id,
        transferStatus: 'COMPLETED',
        transferDate: new Date()
      }
    });
    
    // Notify the provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.provider.id,
        type: 'PAYMENT',
        title: 'Funds Transferred',
        content: `A payment of ${(transfer.amount / 100).toFixed(2)} ${transfer.currency.toUpperCase()} for service "${transaction.offer.service.name}" has been transferred to your Stripe account.`,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error handling transfer.created:', error);
  }
}

/**
 * Handle transfer.failed event
 * @param {Object} transfer - Stripe transfer object
 */
async function handleTransferFailed(transfer) {
  try {
    console.log(`Transfer failed: ${transfer.id}`);
    
    // Check for transaction ID in metadata
    if (!transfer.metadata?.transactionId) {
      console.log('No transaction ID in transfer metadata:', transfer.id);
      return;
    }
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: transfer.metadata.transactionId },
      include: {
        offer: {
          include: {
            provider: true
          }
        }
      }
    });
    
    if (!transaction) {
      console.log(`No transaction found with ID: ${transfer.metadata.transactionId}`);
      return;
    }
    
    // Update transaction with failed transfer
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        transferId: transfer.id,
        transferStatus: 'FAILED'
      }
    });
    
    // Notify admin (you could have an admin notification system)
    console.log(`ADMIN ALERT: Transfer ${transfer.id} for transaction ${transaction.id} has failed`);
  } catch (error) {
    console.error('Error handling transfer.failed:', error);
  }
}

/**
 * Handle charge.refunded event
 * @param {Object} charge - Stripe charge object
 */
async function handleChargeRefunded(charge) {
  try {
    console.log(`Charge refunded: ${charge.id}`);
    
    // Find payment intent by charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent);
    
    if (!paymentIntent) {
      console.log(`No payment intent found for charge: ${charge.id}`);
      return;
    }
    
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: paymentIntent.id },
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
      console.log(`No transaction found for payment intent: ${paymentIntent.id}`);
      return;
    }
    
    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'REFUNDED' }
    });
    
    // Notify the client and provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Payment Refunded',
        content: `Your payment of ${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()} for "${transaction.offer.service.name}" has been refunded.`,
        isRead: false
      }
    });
    
    await prisma.notification.create({
      data: {
        userId: transaction.offer.provider.id,
        type: 'PAYMENT',
        title: 'Payment Refunded',
        content: `A payment of ${(charge.amount / 100).toFixed(2)} ${charge.currency.toUpperCase()} for "${transaction.offer.service.name}" has been refunded to the client.`,
        isRead: false
      }
    });
  } catch (error) {
    console.error('Error handling charge.refunded:', error);
  }
} 
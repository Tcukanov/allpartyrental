import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * Verify the PayPal webhook signature
 */
const verifyWebhookSignature = (requestBody, headers) => {
  try {
    // Get the PayPal webhook ID and signature from environment variables
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const actualSignature = headers.get('paypal-transmission-sig');
    const transmissionId = headers.get('paypal-transmission-id');
    const transmissionTime = headers.get('paypal-transmission-time');
    
    if (!webhookId || !actualSignature || !transmissionId || !transmissionTime) {
      logger.error('Missing PayPal webhook verification headers');
      return false;
    }
    
    // Create the validation string
    const validationStr = transmissionId + '|' + transmissionTime + '|' + webhookId + '|' + Buffer.from(JSON.stringify(requestBody)).toString('base64');
    
    // Create the expected signature
    const hmac = crypto.createHmac('sha256', process.env.PAYPAL_WEBHOOK_SECRET);
    hmac.update(validationStr);
    const expectedSignature = hmac.digest('base64');
    
    return actualSignature === expectedSignature;
  } catch (error) {
    logger.error('Error verifying PayPal webhook signature:', error);
    return false;
  }
};

/**
 * Handle a PayPal webhook event
 */
export async function POST(request) {
  try {
    const payload = await request.json();
    const headers = request.headers;
    
    // Log the event type
    const eventType = payload.event_type;
    logger.info(`Received PayPal webhook: ${eventType}`);
    
    // Verify the webhook signature
    if (!verifyWebhookSignature(payload, headers)) {
      logger.error('Invalid PayPal webhook signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
    
    // Extract the transaction details based on the event type
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Handle payment capture completed
        await handlePaymentCaptureCompleted(payload);
        break;
      }
      
      case 'PAYMENT.CAPTURE.DENIED': {
        // Handle payment capture denied
        await handlePaymentCaptureDenied(payload);
        break;
      }
      
      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Handle payment refund
        await handlePaymentRefund(payload);
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED': {
        // Handle order approved
        await handleOrderApproved(payload);
        break;
      }
      
      case 'CHECKOUT.ORDER.COMPLETED': {
        // Handle order completed
        await handleOrderCompleted(payload);
        break;
      }
      
      case 'MERCHANT.ONBOARDING.COMPLETED': {
        // Handle merchant onboarding completed
        await handleMerchantOnboarding(payload);
        break;
      }
      
      default:
        // We'll acknowledge the webhook but not process unhandled event types
        logger.info(`Ignoring unhandled PayPal webhook event type: ${eventType}`);
    }
    
    // Always return a 200 response to acknowledge receipt of the webhook
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error handling PayPal webhook:', error);
    return NextResponse.json(
      { error: `Failed to process webhook: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Handle payment capture completed event
 * Update transaction status to PAID
 */
async function handlePaymentCaptureCompleted(payload) {
  try {
    const resource = payload.resource;
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    const captureId = resource.id;
    
    logger.info(`Processing PayPal payment capture completed: Order ID ${orderId}, Capture ID: ${captureId}`);
    
    // Find any transactions with this payment intent ID
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: orderId },
    });
    
    if (!transaction) {
      logger.warn(`No transaction found for PayPal order ID: ${orderId}`);
      return;
    }
    
    // Update the transaction status to PAID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'PAID',
        updatedAt: new Date(),
      },
    });
    
    logger.info(`Updated transaction ${transaction.id} to PAID status based on PayPal webhook`);
  } catch (error) {
    logger.error('Error processing payment capture completed webhook:', error);
    throw error;
  }
}

/**
 * Handle payment capture denied event
 * Update transaction status to FAILED
 */
async function handlePaymentCaptureDenied(payload) {
  try {
    const resource = payload.resource;
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    logger.info(`Processing PayPal payment capture denied: Order ID ${orderId}`);
    
    // Find any transactions with this payment intent ID
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: orderId },
    });
    
    if (!transaction) {
      logger.warn(`No transaction found for PayPal order ID: ${orderId}`);
      return;
    }
    
    // Update the transaction status to FAILED
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        updatedAt: new Date(),
      },
    });
    
    logger.info(`Updated transaction ${transaction.id} to FAILED status based on PayPal webhook`);
  } catch (error) {
    logger.error('Error processing payment capture denied webhook:', error);
    throw error;
  }
}

/**
 * Handle payment refund event
 * Update transaction status to REFUNDED
 */
async function handlePaymentRefund(payload) {
  try {
    const resource = payload.resource;
    const captureId = resource.links.find(link => link.href.includes('/captures/'))?.href.split('/').pop();
    
    logger.info(`Processing PayPal payment refund: Capture ID ${captureId}`);
    
    if (!captureId) {
      logger.warn('Could not determine capture ID from refund payload');
      return;
    }
    
    // Find any transactions with this payment capture reference
    // Note: You'd need to store the captureId when the payment is made
    const transactions = await prisma.transaction.findMany({
      where: {
        // You might need to adjust how you query for the transaction
        // This is just an example - you'd need to store the captureId somewhere
        paymentMethodId: captureId
      },
    });
    
    if (transactions.length === 0) {
      logger.warn(`No transactions found for PayPal capture ID: ${captureId}`);
      return;
    }
    
    // Update the transaction status to REFUNDED
    await Promise.all(transactions.map(transaction => {
      return prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          updatedAt: new Date(),
        },
      });
    }));
    
    logger.info(`Updated ${transactions.length} transactions to REFUNDED status based on PayPal webhook`);
  } catch (error) {
    logger.error('Error processing payment refund webhook:', error);
    throw error;
  }
}

/**
 * Handle order approved event
 * This is called when the buyer approves the PayPal order
 */
async function handleOrderApproved(payload) {
  try {
    const resource = payload.resource;
    const orderId = resource.id;
    
    logger.info(`Processing PayPal order approved: Order ID ${orderId}`);
    
    // This is just a notification - the actual payment capture will be handled
    // by the capture endpoint or the PAYMENT.CAPTURE.COMPLETED webhook
  } catch (error) {
    logger.error('Error processing order approved webhook:', error);
    throw error;
  }
}

/**
 * Handle order completed event
 * This is called when the entire order flow is completed
 */
async function handleOrderCompleted(payload) {
  try {
    const resource = payload.resource;
    const orderId = resource.id;
    
    logger.info(`Processing PayPal order completed: Order ID ${orderId}`);
    
    // Find any transactions with this order ID
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId: orderId },
    });
    
    if (!transaction) {
      logger.warn(`No transaction found for PayPal order ID: ${orderId}`);
      return;
    }
    
    // If the transaction isn't already PAID, update it
    if (transaction.status !== 'PAID') {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PAID',
          updatedAt: new Date(),
        },
      });
      
      logger.info(`Updated transaction ${transaction.id} to PAID status based on PayPal webhook`);
    }
  } catch (error) {
    logger.error('Error processing order completed webhook:', error);
    throw error;
  }
}

/**
 * Handle merchant onboarding completed event
 * Update provider record with PayPal merchant ID
 */
async function handleMerchantOnboarding(payload) {
  try {
    const resource = payload.resource;
    const merchantId = resource.merchant_id;
    const merchantEmail = resource.primary_email;
    const trackingId = resource.tracking_id; // This should be the provider ID if you set it during onboarding
    
    logger.info(`Processing PayPal merchant onboarding: Merchant ID ${merchantId}, Email: ${merchantEmail}`);
    
    // If we have a tracking ID (provider ID), use that
    if (trackingId) {
      const provider = await prisma.provider.findFirst({
        where: { id: trackingId },
      });
      
      if (provider) {
        await prisma.provider.update({
          where: { id: provider.id },
          data: {
            paypalMerchantId: merchantId,
            paypalEmail: merchantEmail,
            paypalOnboardingComplete: true,
          },
        });
        
        logger.info(`Updated provider ${provider.id} with PayPal merchant ID ${merchantId}`);
        return;
      }
    }
    
    // If we don't have a tracking ID or couldn't find the provider,
    // try to find a provider by email
    const user = await prisma.user.findFirst({
      where: { email: merchantEmail },
      include: { provider: true },
    });
    
    if (!user || !user.provider) {
      logger.warn(`No provider found for PayPal merchant email: ${merchantEmail}`);
      return;
    }
    
    // Update the provider record
    await prisma.provider.update({
      where: { id: user.provider.id },
      data: {
        paypalMerchantId: merchantId,
        paypalEmail: merchantEmail,
        paypalOnboardingComplete: true,
      },
    });
    
    logger.info(`Updated provider ${user.provider.id} with PayPal merchant ID ${merchantId} by email match`);
  } catch (error) {
    logger.error('Error processing merchant onboarding webhook:', error);
    throw error;
  }
} 
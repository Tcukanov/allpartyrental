import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// PayPal webhook event types we handle
const HANDLED_EVENTS = {
  'MERCHANT.PARTNER-CONSENT.REVOKED': 'handlePartnerConsentRevoked',
  'CUSTOMER.MERCHANT-INTEGRATION.PRODUCT-SUBSCRIPTION-UPDATED': 'handleProductSubscriptionUpdated',
  'PAYMENT.CAPTURE.COMPLETED': 'handlePaymentCaptureCompleted',
  'PAYMENT.CAPTURE.DENIED': 'handlePaymentCaptureDenied'
};

// GET handler for webhook endpoint verification
export async function GET() {
  return NextResponse.json({
    message: 'PayPal Webhook Endpoint Active',
    status: 'ready',
    handledEvents: Object.keys(HANDLED_EVENTS),
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function POST(req) {
  console.log('🔔 PayPal webhook received');
  
  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, headers);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const webhookData = JSON.parse(body);
    const eventType = webhookData.event_type;
    
    console.log('📋 Webhook event details:', {
      eventType,
      eventId: webhookData.id,
      createTime: webhookData.create_time,
      resourceType: webhookData.resource_type
    });
    
    // Check if we handle this event type
    if (!HANDLED_EVENTS[eventType]) {
      console.log(`ℹ️ Unhandled event type: ${eventType}`);
      return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
    }
    
    // Process the webhook event
    const handler = HANDLED_EVENTS[eventType];
    await processWebhookEvent(handler, webhookData);
    
    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Verify PayPal webhook signature for security
 */
async function verifyWebhookSignature(body, headers) {
  try {
    // PayPal webhook signature headers
    const authAlgo = headers['paypal-auth-algo'];
    const transmission = headers['paypal-transmission-id'];
    const certId = headers['paypal-cert-id'];
    const signature = headers['paypal-transmission-sig'];
    const timestamp = headers['paypal-transmission-time'];
    
    if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
      console.error('Missing required webhook headers');
      return false;
    }
    
    // For sandbox/development, we'll implement basic verification
    // In production, you should implement full certificate verification
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.warn('⚠️ PAYPAL_WEBHOOK_ID not configured, skipping signature verification');
      return true; // Allow in development
    }
    
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookId)
      .update(transmission + '|' + timestamp + '|' + webhookId + '|' + crypto.createHash('sha256').update(body).digest('base64'))
      .digest('base64');
    
    return signature === expectedSignature;
    
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Process webhook events based on type
 */
async function processWebhookEvent(handlerName, webhookData) {
  switch (handlerName) {
    case 'handlePartnerConsentRevoked':
      await handlePartnerConsentRevoked(webhookData);
      break;
    case 'handleProductSubscriptionUpdated':
      await handleProductSubscriptionUpdated(webhookData);
      break;
    case 'handlePaymentCaptureCompleted':
      await handlePaymentCaptureCompleted(webhookData);
      break;
    case 'handlePaymentCaptureDenied':
      await handlePaymentCaptureDenied(webhookData);
      break;
    default:
      console.warn(`Unknown handler: ${handlerName}`);
  }
}

/**
 * Handle when a provider revokes platform permissions
 * CRITICAL: Immediately disable their payment processing
 */
async function handlePartnerConsentRevoked(webhookData) {
  console.log('🚨 CRITICAL: Partner consent revoked');
  
  try {
    const merchantId = webhookData.resource?.merchant_id;
    if (!merchantId) {
      console.error('No merchant ID in consent revoked webhook');
      return;
    }
    
    // Find and disable the provider
    const provider = await prisma.provider.findFirst({
      where: { paypalMerchantId: merchantId }
    });
    
    if (!provider) {
      console.error(`Provider not found for merchant ID: ${merchantId}`);
      return;
    }
    
    // Disable PayPal payments for this provider
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        paypalCanReceivePayments: false,
        paypalOnboardingStatus: 'REVOKED',
        paypalStatusIssues: JSON.stringify([{
          type: 'CONSENT_REVOKED',
          message: 'PayPal permissions have been revoked. Please reconnect your PayPal account.',
          timestamp: new Date().toISOString()
        }])
      }
    });
    
    // Create notification for the provider
    await prisma.notification.create({
      data: {
        userId: provider.userId,
        type: 'PAYPAL_DISCONNECTED',
        title: 'PayPal Account Disconnected',
        content: 'Your PayPal account has been disconnected. You cannot receive payments until you reconnect your account.',
        isRead: false
      }
    });
    
    console.log(`✅ Provider ${provider.id} PayPal access revoked and disabled`);
    
  } catch (error) {
    console.error('Error handling partner consent revoked:', error);
    throw error;
  }
}

/**
 * Handle product subscription updates (e.g., Advanced Card Processing approval)
 */
async function handleProductSubscriptionUpdated(webhookData) {
  console.log('📦 Product subscription updated');
  
  try {
    const merchantId = webhookData.resource?.merchant_id;
    const product = webhookData.resource?.product;
    
    if (!merchantId || !product) {
      console.error('Missing merchant ID or product in subscription update');
      return;
    }
    
    const provider = await prisma.provider.findFirst({
      where: { paypalMerchantId: merchantId }
    });
    
    if (!provider) {
      console.error(`Provider not found for merchant ID: ${merchantId}`);
      return;
    }
    
    // Handle PPCP_CUSTOM (Advanced Card Processing) updates
    if (product === 'PPCP_CUSTOM') {
      const vettingStatus = webhookData.resource?.vetting_status;
      
      let statusMessage = '';
      let notificationTitle = '';
      let notificationContent = '';
      
      switch (vettingStatus) {
        case 'SUBSCRIBED':
          statusMessage = 'Advanced Card Processing enabled';
          notificationTitle = 'Advanced Card Processing Enabled';
          notificationContent = 'Your PayPal account now supports advanced card processing features.';
          break;
        case 'DENIED':
          statusMessage = 'Advanced Card Processing denied';
          notificationTitle = 'Advanced Card Processing Denied';
          notificationContent = 'Your application for advanced card processing was denied. You can still accept PayPal payments.';
          break;
        default:
          statusMessage = `Advanced Card Processing status: ${vettingStatus}`;
          notificationTitle = 'PayPal Account Update';
          notificationContent = `Your PayPal account status has been updated: ${vettingStatus}`;
      }
      
      // Update provider status
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          paypalStatus: JSON.stringify({
            advancedCardProcessing: vettingStatus,
            lastUpdated: new Date().toISOString()
          })
        }
      });
      
      // Create notification
      await prisma.notification.create({
        data: {
          userId: provider.userId,
          type: 'PAYPAL_STATUS_UPDATE',
          title: notificationTitle,
          content: notificationContent,
          isRead: false
        }
      });
      
      console.log(`✅ Provider ${provider.id} PPCP status updated: ${vettingStatus}`);
    }
    
  } catch (error) {
    console.error('Error handling product subscription update:', error);
    throw error;
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptureCompleted(webhookData) {
  console.log('💰 Payment capture completed');
  
  try {
    const captureId = webhookData.resource?.id;
    const orderId = webhookData.resource?.supplementary_data?.related_ids?.order_id;
    
    if (!captureId || !orderId) {
      console.error('Missing capture ID or order ID in payment webhook');
      return;
    }
    
    // Update transaction status in database
    await prisma.transaction.updateMany({
      where: { paypalOrderId: orderId },
      data: {
        status: 'COMPLETED',
        paypalCaptureId: captureId,
        completedAt: new Date()
      }
    });
    
    console.log(`✅ Transaction updated for order ${orderId}`);
    
  } catch (error) {
    console.error('Error handling payment capture completed:', error);
    throw error;
  }
}

/**
 * Handle failed payment capture
 */
async function handlePaymentCaptureDenied(webhookData) {
  console.log('❌ Payment capture denied');
  
  try {
    const orderId = webhookData.resource?.supplementary_data?.related_ids?.order_id;
    
    if (!orderId) {
      console.error('Missing order ID in payment denied webhook');
      return;
    }
    
    // Update transaction status
    await prisma.transaction.updateMany({
      where: { paypalOrderId: orderId },
      data: {
        status: 'FAILED',
        failureReason: 'Payment capture denied by PayPal'
      }
    });
    
    console.log(`✅ Transaction marked as failed for order ${orderId}`);
    
  } catch (error) {
    console.error('Error handling payment capture denied:', error);
    throw error;
  }
} 
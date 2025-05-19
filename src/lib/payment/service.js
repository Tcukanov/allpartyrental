'use strict';

import paypalClient from './paypal';
import { logger } from '@/lib/logger';
import { getFeeSettings } from './fee-settings';

/**
 * Payment Service 
 * This is a compatibility layer for legacy code that used the Stripe API
 * All operations are now redirected to PayPal
 */
export const paymentService = {
  /**
   * Create a payment intent
   * Now redirects to PayPal order creation
   */
  createPaymentIntent: async ({
    amount,
    currency = 'usd',
    capture_method = 'manual',
    metadata = {},
    clientFeePercent = null,
    providerFeePercent = null
  }) => {
    try {
      logger.info(`Creating payment intent for amount: ${amount}`);

      // If fee percentages aren't provided, get them from settings
      if (clientFeePercent === null || providerFeePercent === null) {
        try {
          const feeSettings = await getFeeSettings();
          if (clientFeePercent === null) {
            clientFeePercent = feeSettings.clientFeePercent;
          }
          if (providerFeePercent === null) {
            providerFeePercent = feeSettings.providerFeePercent;
          }
        } catch (error) {
          logger.warn('Error retrieving fee settings, using defaults:', error);
          clientFeePercent = clientFeePercent === null ? 5.0 : clientFeePercent;
          providerFeePercent = providerFeePercent === null ? 12.0 : providerFeePercent;
        }
      }
      
      // Create metadata with fee information for later use
      const metadataWithFees = {
        ...metadata,
        clientFeePercent: clientFeePercent.toString(),
        providerFeePercent: providerFeePercent.toString(),
        originalAmount: amount.toString()
      };
      
      // Create a new PayPal order
      const order = await paypalClient.createOrder(
        amount, 
        currency,
        metadataWithFees
      );
      
      logger.info(`PayPal order created: ${order.id}`);
      
      return {
        clientSecret: order.id, // Using order ID as the "client secret"
        paymentIntentId: order.id
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  },
  
  /**
   * Capture a payment intent
   * Now redirects to PayPal order capture
   */
  capturePaymentIntent: async (paymentIntentId) => {
    try {
      logger.info(`Capturing payment intent: ${paymentIntentId}`);
      
      // Capture the order in PayPal
      const capture = await paypalClient.captureOrder(paymentIntentId);
      
      logger.info(`Payment captured successfully: ${paymentIntentId}`);
      
      return capture;
    } catch (error) {
      logger.error(`Error capturing payment intent ${paymentIntentId}:`, error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  },
  
  /**
   * Cancel a payment intent
   * For PayPal, we simply get the order status
   */
  cancelPaymentIntent: async (paymentIntentId) => {
    try {
      logger.info(`Canceling payment intent: ${paymentIntentId}`);
      
      // PayPal orders expire automatically if not captured
      // Just check and return the status
      try {
        const order = await paypalClient.getOrder(paymentIntentId);
        
        return {
          id: order.id,
          status: order.status
        };
      } catch (getOrderError) {
        // If the order doesn't exist or can't be found, consider it canceled
        logger.warn(`Error retrieving order ${paymentIntentId}, considering it canceled:`, getOrderError);
        return {
          id: paymentIntentId,
          status: 'CANCELED'
        };
      }
    } catch (error) {
      logger.error(`Error canceling payment intent ${paymentIntentId}:`, error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  },
  
  /**
   * Release funds to the provider
   * Now redirects to PayPal payout
   */
  releaseFundsToProvider: async ({ paymentIntentId, providerId, amount }) => {
    try {
      logger.info(`Releasing funds for payment: ${paymentIntentId} to provider: ${providerId}`);
      
      // Get provider details for the payout
      const provider = await getProviderPayPalAccount(providerId);
      
      if (!provider || !provider.paypalEmail) {
        throw new Error(`Provider ${providerId} does not have a PayPal email configured`);
      }
      
      // Get fee settings
      let providerFeePercent;
      try {
        const feeSettings = await getFeeSettings();
        providerFeePercent = feeSettings.providerFeePercent;
      } catch (error) {
        logger.warn('Error retrieving provider fee percentage, using default:', error);
        providerFeePercent = 12.0;
      }
      
      // Calculate platform fee and transfer amount
      const platformFeeAmount = amount * (providerFeePercent / 100);
      const transferAmount = amount - platformFeeAmount;
      
      // Create a PayPal payout to the provider
      const payout = await paypalClient.createPayout(
        provider.paypalEmail,
        transferAmount,
        'USD',
        `Payment for order ${paymentIntentId}`
      );
      
      logger.info(`Funds released to provider: ${providerId}, payout: ${payout.batch_header.payout_batch_id}`);
      
      return {
        id: payout.batch_header.payout_batch_id,
        status: payout.batch_header.batch_status,
        amount: transferAmount,
        currency: 'USD'
      };
    } catch (error) {
      logger.error(`Error releasing funds for payment ${paymentIntentId}:`, error);
      throw new Error(`Failed to release funds: ${error.message}`);
    }
  }
};

/**
 * Helper function to get a provider's connected PayPal account
 */
async function getProviderPayPalAccount(providerId) {
  logger.debug(`Getting PayPal account for provider: ${providerId}`);
  
  try {
    // Look up the provider in the database
    const provider = await prisma.provider.findFirst({
      where: { userId: providerId }
    });
    
    if (!provider || !provider.paypalEmail) {
      logger.warn(`No PayPal account found for provider: ${providerId}`);
      return null;
    }
    
    logger.debug(`Found PayPal email ${provider.paypalEmail} for provider ${providerId}`);
    
    return {
      paypalEmail: provider.paypalEmail,
      isActive: true
    };
  } catch (error) {
    logger.error(`Error fetching provider PayPal account: ${error.message}`);
    return null;
  }
} 
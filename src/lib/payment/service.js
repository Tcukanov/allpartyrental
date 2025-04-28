'use strict';

import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { getFeeSettings } from '@/lib/payment/fee-settings';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Payment Service
 * Handles interactions with the Stripe API for payment processing
 */
export const paymentService = {
  /**
   * Create a payment intent
   * For our escrow system, we use manual capture to authorize the payment
   * without immediately charging the customer
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

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      
      // Create metadata with fee information for later use
      const metadataWithFees = {
        ...metadata,
        clientFeePercent: clientFeePercent.toString(),
        providerFeePercent: providerFeePercent.toString(),
        originalAmount: amount.toString()
      };
      
      // Create the payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        capture_method,
        metadata: metadataWithFees,
      });
      
      logger.info(`Payment intent created: ${paymentIntent.id}`);
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  },
  
  /**
   * Capture a payment intent
   * Used when a provider approves a service request
   * This moves the funds from authorization to actual charge (escrow)
   */
  capturePaymentIntent: async (paymentIntentId) => {
    try {
      logger.info(`Capturing payment intent: ${paymentIntentId}`);
      
      // Get the current payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'requires_capture') {
        logger.warn(`Payment intent ${paymentIntentId} is not in 'requires_capture' state (current: ${paymentIntent.status})`);
        return null;
      }
      
      // Capture the full amount
      const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);
      
      logger.info(`Payment intent captured: ${paymentIntentId}`);
      
      return capturedPayment;
    } catch (error) {
      logger.error(`Error capturing payment intent ${paymentIntentId}:`, error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  },
  
  /**
   * Cancel a payment intent
   * Used when a provider declines a service request
   * This releases the authorization without charging the customer
   */
  cancelPaymentIntent: async (paymentIntentId) => {
    try {
      logger.info(`Canceling payment intent: ${paymentIntentId}`);
      
      // Check current status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Already canceled or captured
      if (['canceled', 'succeeded'].includes(paymentIntent.status)) {
        logger.warn(`Payment intent ${paymentIntentId} is already in '${paymentIntent.status}' state`);
        return paymentIntent;
      }
      
      // Cancel the payment intent
      const canceledPayment = await stripe.paymentIntents.cancel(paymentIntentId);
      
      logger.info(`Payment intent canceled: ${paymentIntentId}`);
      
      return canceledPayment;
    } catch (error) {
      logger.error(`Error canceling payment intent ${paymentIntentId}:`, error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  },
  
  /**
   * Release funds to the provider
   * Used when a service is completed and funds are released from escrow
   * This creates a transfer to the provider's connected account
   */
  releaseFundsToProvider: async (paymentIntentId, providerId, transferGroup = null, amount = null, providerFeePercent = null) => {
    try {
      logger.info(`Releasing funds for payment: ${paymentIntentId} to provider: ${providerId}`);
      
      // Get the payment intent to determine amount
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment intent ${paymentIntentId} is not in 'succeeded' state (current: ${paymentIntent.status})`);
      }
      
      // Get the provider's connected account
      const providerAccount = await getProviderStripeAccount(providerId);
      
      if (!providerAccount) {
        throw new Error(`Provider ${providerId} does not have a connected Stripe account`);
      }
      
      // If providerFeePercent isn't provided, get it from settings or metadata
      if (providerFeePercent === null) {
        try {
          // First try to use the fee from the payment intent metadata
          providerFeePercent = parseFloat(paymentIntent.metadata.providerFeePercent || '0');
          
          // If not found in metadata, get from settings
          if (isNaN(providerFeePercent) || providerFeePercent <= 0) {
            const { providerFeePercent: settingsFee } = await getFeeSettings();
            providerFeePercent = settingsFee;
          }
        } catch (error) {
          logger.warn('Error retrieving provider fee percentage, using default:', error);
          providerFeePercent = 12.0;
        }
      }
      
      // Calculate platform fee (provider fee percentage)
      const originalAmount = amount || parseFloat(paymentIntent.metadata.originalAmount || '0');
      const platformFeeAmount = Math.round((originalAmount * providerFeePercent / 100) * 100);
      
      // Calculate amount to transfer to provider (amount - platform fee)
      const transferAmount = paymentIntent.amount - platformFeeAmount;
      
      // Create a transfer to the provider's connected account
      const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: paymentIntent.currency,
        destination: providerAccount.accountId,
        source_transaction: paymentIntent.charges.data[0].id,
        metadata: {
          paymentIntentId,
          providerId,
          platformFee: platformFeeAmount.toString(),
          providerFeePercent: providerFeePercent.toString()
        }
      });
      
      logger.info(`Funds released to provider: ${providerId}, transfer: ${transfer.id}`);
      
      return transfer;
    } catch (error) {
      logger.error(`Error releasing funds for payment ${paymentIntentId}:`, error);
      throw new Error(`Failed to release funds: ${error.message}`);
    }
  }
};

/**
 * Helper function to get a provider's connected Stripe account
 * In a real implementation, this would fetch from your database
 */
async function getProviderStripeAccount(providerId) {
  // This is a stub - in a real application, you would fetch the provider's
  // Stripe account ID from your database
  
  // TODO: Implement actual database lookup for provider's Stripe account
  
  logger.debug(`Getting Stripe account for provider: ${providerId}`);
  
  // For development/testing purposes
  return {
    accountId: process.env.STRIPE_TEST_ACCOUNT_ID || 'acct_test',
    isActive: true
  };
} 
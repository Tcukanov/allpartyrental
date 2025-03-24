// src/lib/payment/stripe.js

import Stripe from 'stripe';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Payment service with Stripe integration
 * Handles payment processing with escrow functionality
 */
export const paymentService = {
  /**
   * Create a payment intent for an offer
   * @param {Object} params - Payment parameters
   * @param {string} params.offerId - Offer ID
   * @param {string} params.clientId - Client ID
   * @param {string} params.providerId - Provider ID
   * @param {number} params.amount - Payment amount in cents
   * @param {string} params.description - Payment description
   * @returns {Promise<Object>} - Stripe payment intent data
   */
  createPaymentIntent: async ({ offerId, clientId, providerId, amount, description }) => {
    try {
      // Create transfer group ID
      const transferGroup = `offer_${offerId}`;

      // Create payment intent with application fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        description,
        metadata: {
          offerId,
          clientId,
          providerId,
          type: 'escrow'
        },
        transfer_group: transferGroup,
        application_fee_amount: Math.round(amount * 0.05), // 5% platform fee
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          transferGroup
        }
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_ERROR',
          message: error.message
        }
      };
    }
  },

  /**
   * Capture payment intent (funds move to platform/escrow)
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Updated payment intent
   */
  capturePayment: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      
      return {
        success: true,
        data: paymentIntent
      };
    } catch (error) {
      console.error('Error capturing payment:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_CAPTURE_ERROR',
          message: error.message
        }
      };
    }
  },

  /**
   * Release funds from escrow to provider
   * @param {Object} params - Release parameters
   * @param {string} params.paymentIntentId - Payment intent ID
   * @param {string} params.providerId - Provider ID
   * @param {string} params.transferGroup - Transfer group
   * @param {number} params.amount - Amount to transfer
   * @returns {Promise<Object>} - Transfer data
   */
  releaseFundsToProvider: async ({ paymentIntentId, providerId, transferGroup, amount }) => {
    try {
      // Get provider's Stripe account ID
      const provider = await getProviderStripeAccount(providerId);
      
      if (!provider || !provider.stripeAccountId) {
        return {
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: 'Provider is not connected to Stripe'
          }
        };
      }

      // Create a transfer to the provider's account
      const transfer = await stripe.transfers.create({
        amount,
        currency: 'usd',
        destination: provider.stripeAccountId,
        transfer_group: transferGroup,
        metadata: {
          paymentIntentId,
          providerId,
          type: 'escrow_release'
        }
      });

      return {
        success: true,
        data: transfer
      };
    } catch (error) {
      console.error('Error releasing funds to provider:', error);
      return {
        success: false,
        error: {
          code: 'FUND_RELEASE_ERROR',
          message: error.message
        }
      };
    }
  },

  /**
   * Issue refund to client
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Refund amount (optional, defaults to full payment)
   * @returns {Promise<Object>} - Refund data
   */
  issueRefund: async (paymentIntentId, amount = null) => {
    try {
      const refundParams = {
        payment_intent: paymentIntentId,
        metadata: {
          type: 'dispute_resolution'
        }
      };

      // If amount is specified, do a partial refund
      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);
      
      return {
        success: true,
        data: refund
      };
    } catch (error) {
      console.error('Error issuing refund:', error);
      return {
        success: false,
        error: {
          code: 'REFUND_ERROR',
          message: error.message
        }
      };
    }
  },

  /**
   * Get payment intent details
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<Object>} - Payment intent data
   */
  getPaymentIntent: async (paymentIntentId) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        data: paymentIntent
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return {
        success: false,
        error: {
          code: 'PAYMENT_INTENT_RETRIEVAL_ERROR',
          message: error.message
        }
      };
    }
  },

  /**
   * Handle Stripe webhook events
   * @param {string} requestBody - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Promise<Object>} - Processed event or error
   */
  handleWebhookEvent: async (requestBody, signature) => {
    try {
      const event = stripe.webhooks.constructEvent(
        requestBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Payment captured, update transaction status
          await updateTransactionStatus(event.data.object);
          break;
        case 'transfer.created':
          // Funds released to provider
          await handleProviderTransfer(event.data.object);
          break;
        case 'charge.refunded':
          // Refund issued to client
          await handleClientRefund(event.data.object);
          break;
      }

      return {
        success: true,
        data: { received: true, event: event.type }
      };
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error.message
        }
      };
    }
  }
};

/**
 * Get provider's Stripe account ID
 * @param {string} providerId - Provider ID
 * @returns {Promise<Object>} - Provider data with Stripe account ID
 */
async function getProviderStripeAccount(providerId) {
  // In a real implementation, this would fetch the provider from the database
  // For now, we'll return a mock value
  return {
    id: providerId,
    stripeAccountId: 'acct_mock123456' // This would be a real Stripe account ID in production
  };
}

/**
 * Update transaction status when payment succeeds
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function updateTransactionStatus(paymentIntent) {
  const { offerId } = paymentIntent.metadata;
  
  // In a real implementation, this would update the transaction in the database
  console.log(`Transaction for offer ${offerId} updated to ESCROW status`);
}

/**
 * Handle provider transfer events
 * @param {Object} transfer - Stripe transfer object
 */
async function handleProviderTransfer(transfer) {
  const { paymentIntentId, providerId } = transfer.metadata;
  
  // In a real implementation, this would update the transaction in the database
  console.log(`Funds transferred to provider ${providerId} for payment ${paymentIntentId}`);
}

/**
 * Handle client refund events
 * @param {Object} charge - Stripe charge object
 */
async function handleClientRefund(charge) {
  const paymentIntentId = charge.payment_intent;
  
  // In a real implementation, this would update the transaction in the database
  console.log(`Refund issued for payment ${paymentIntentId}`);
}
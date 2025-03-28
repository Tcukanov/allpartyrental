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
   * @param {number} params.clientFeePercent - Fee percentage charged to client
   * @param {number} params.providerFeePercent - Fee percentage charged to provider
   * @returns {Promise<Object>} - Stripe payment intent data
   */
  createPaymentIntent: async ({ 
    offerId, 
    clientId, 
    providerId, 
    amount, 
    description,
    clientFeePercent = 5.0,
    providerFeePercent = 10.0
  }) => {
    try {
      // Create transfer group ID
      const transferGroup = `offer_${offerId}`;

      // Calculate the client fee amount
      const clientFeeAmount = Math.round(amount * (clientFeePercent / 100));
      
      // Total amount to charge (service amount + client fee)
      const totalAmount = amount + clientFeeAmount;

      // Create payment intent with application fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        description,
        metadata: {
          offerId,
          clientId,
          providerId,
          baseAmount: amount,
          clientFee: clientFeeAmount,
          clientFeePercent,
          providerFeePercent,
          type: 'escrow'
        },
        transfer_group: transferGroup,
        capture_method: 'manual', // This allows us to authorize now and capture later
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          transferGroup,
          totalAmount,
          clientFeeAmount
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
   * @param {number} params.amount - Original amount to transfer
   * @param {number} params.providerFeePercent - Fee percentage charged to provider
   * @returns {Promise<Object>} - Transfer data
   */
  releaseFundsToProvider: async ({ 
    paymentIntentId, 
    providerId, 
    transferGroup, 
    amount,
    providerFeePercent = 10.0
  }) => {
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

      // Calculate provider fee
      const providerFeeAmount = Math.round(amount * (providerFeePercent / 100));
      
      // Amount to transfer to provider (original amount minus provider fee)
      const transferAmount = amount - providerFeeAmount;

      // Create a transfer to the provider's account
      const transfer = await stripe.transfers.create({
        amount: transferAmount,
        currency: 'usd',
        destination: provider.stripeAccountId,
        transfer_group: transferGroup,
        metadata: {
          paymentIntentId,
          providerId,
          originalAmount: amount,
          providerFee: providerFeeAmount,
          providerFeePercent,
          type: 'escrow_release'
        }
      });

      return {
        success: true,
        data: {
          transfer,
          transferAmount,
          providerFeeAmount
        }
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
          type: 'transaction_refund'
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
 * @param {string} providerId - Provider's user ID
 * @returns {Promise<Object>} - Provider with Stripe account ID
 */
async function getProviderStripeAccount(providerId) {
  // In a real app, retrieve the provider's Stripe account from your database
  // For now, we'll return a mock account
  return {
    id: providerId,
    stripeAccountId: process.env.STRIPE_TEST_ACCOUNT || 'acct_test',
  };
}

/**
 * Update transaction status based on Stripe event
 * @param {Object} paymentIntent - Stripe payment intent object
 */
async function updateTransactionStatus(paymentIntent) {
  // In a real app, update the transaction status in your database
  console.log('Payment captured:', paymentIntent.id);
}

/**
 * Handle provider transfer events
 * @param {Object} transfer - Stripe transfer object
 */
async function handleProviderTransfer(transfer) {
  // In a real app, update the transaction in your database
  console.log('Transfer to provider:', transfer.id);
}

/**
 * Handle client refund events
 * @param {Object} charge - Stripe charge object
 */
async function handleClientRefund(charge) {
  // In a real app, update the transaction in your database
  console.log('Refund to client:', charge.id);
}
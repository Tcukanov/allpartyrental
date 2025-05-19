// src/lib/payment/stripe.js - STRIPE INTEGRATION REMOVED

/**
 * Placeholder payment service - Stripe integration has been removed
 * All methods return error responses indicating that Stripe is no longer supported
 */
export const paymentService = {
  /**
   * Create a payment intent (REMOVED)
   */
  createPaymentIntent: async (params) => {
    console.warn('Stripe integration has been removed - createPaymentIntent called with:', params);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Capture payment intent (REMOVED)
   */
  capturePayment: async (paymentIntentId) => {
    console.warn('Stripe integration has been removed - capturePayment called with ID:', paymentIntentId);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Release funds from escrow to provider (REMOVED)
   */
  releaseFundsToProvider: async (params) => {
    console.warn('Stripe integration has been removed - releaseFundsToProvider called with:', params);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Issue refund to client (REMOVED)
   */
  issueRefund: async (paymentIntentId, amount = null) => {
    console.warn('Stripe integration has been removed - issueRefund called with ID:', paymentIntentId, 'amount:', amount);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Cancel a payment intent (REMOVED)
   */
  cancelPaymentIntent: async (paymentIntentId) => {
    console.warn('Stripe integration has been removed - cancelPaymentIntent called with ID:', paymentIntentId);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Get a payment intent (REMOVED)
   */
  getPaymentIntent: async (paymentIntentId) => {
    console.warn('Stripe integration has been removed - getPaymentIntent called with ID:', paymentIntentId);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  },

  /**
   * Create a Stripe Connect account link (REMOVED)
   */
  createAccountLink: async (params) => {
    console.warn('Stripe integration has been removed - createAccountLink called with:', params);
    return {
      success: false,
      error: {
        code: 'STRIPE_REMOVED',
        message: 'Stripe integration has been removed from this application'
      }
    };
  }
};
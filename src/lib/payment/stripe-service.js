import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
  }

  /**
   * Create a marketplace payment intent
   * This allows the platform to take a fee and pay the provider
   */
  async createMarketplacePaymentIntent({
    amount, // Total amount in cents
    currency = 'usd',
    providerStripeAccountId, // Provider's connected Stripe account ID
    platformFeeAmount, // Platform fee in cents
    metadata = {}
  }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: providerStripeAccountId,
        },
        metadata: {
          type: 'marketplace_payment',
          ...metadata
        }
      });

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Failed to create marketplace payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a standard payment intent (non-marketplace)
   * For simple direct payments
   */
  async createPaymentIntent({
    amount,
    currency = 'usd',
    metadata = {}
  }) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          type: 'direct_payment',
          ...metadata
        }
      });

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve payment intent status
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create account link for provider onboarding
   */
  async createProviderAccountLink({
    stripeAccountId,
    refreshUrl,
    returnUrl,
    type = 'account_onboarding'
  }) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: type,
      });

      return {
        success: true,
        accountLink
      };
    } catch (error) {
      console.error('Failed to create account link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a connected account for a provider
   */
  async createProviderAccount({
    email,
    businessType = 'individual', // or 'company'
    country = 'US'
  }) {
    try {
      const account = await stripe.accounts.create({
        type: 'express', // or 'standard' for more control
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessType,
      });

      return {
        success: true,
        account
      };
    } catch (error) {
      console.error('Failed to create provider account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get account status for a provider
   */
  async getProviderAccountStatus(stripeAccountId) {
    try {
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      const isPayoutsEnabled = account.payouts_enabled;
      const isChargesEnabled = account.charges_enabled;
      const requiresAction = account.requirements?.currently_due?.length > 0;
      
      return {
        success: true,
        account,
        status: {
          canReceivePayments: isChargesEnabled && isPayoutsEnabled,
          payoutsEnabled: isPayoutsEnabled,
          chargesEnabled: isChargesEnabled,
          requiresAction: requiresAction,
          currentlyDue: account.requirements?.currently_due || [],
          pastDue: account.requirements?.past_due || []
        }
      };
    } catch (error) {
      console.error('Failed to get provider account status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentIntentId, amount = null, reason = 'requested_by_customer') {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // null means full refund
        reason: reason
      });

      return {
        success: true,
        refund
      };
    } catch (error) {
      console.error('Failed to create refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a transfer to a provider (for manual payouts)
   */
  async createTransfer({
    amount,
    currency = 'usd',
    destination, // Provider's Stripe account ID
    transferGroup = null,
    metadata = {}
  }) {
    try {
      const transfer = await stripe.transfers.create({
        amount: amount,
        currency: currency,
        destination: destination,
        transfer_group: transferGroup,
        metadata: metadata
      });

      return {
        success: true,
        transfer
      };
    } catch (error) {
      console.error('Failed to create transfer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(totalAmount, feePercentage = 5) {
    return Math.round(totalAmount * (feePercentage / 100));
  }

  /**
   * Convert dollars to cents for Stripe
   */
  dollarsToCents(dollars) {
    return Math.round(dollars * 100);
  }

  /**
   * Convert cents to dollars from Stripe
   */
  centsToDollars(cents) {
    return cents / 100;
  }
}

export const stripeService = new StripeService(); 
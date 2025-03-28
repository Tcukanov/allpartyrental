import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
});

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  capture_method: 'automatic' | 'manual';
  metadata: {
    transactionId: string;
    offerId: string;
    clientId: string;
    providerId: string;
    serviceName: string;
  };
  clientFeePercent: number;
  providerFeePercent: number;
}

interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Service for handling payment-related operations
 */
export const paymentService = {
  /**
   * Create a payment intent with Stripe
   * @param params Payment parameters
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    // Convert decimal amount to cents
    const amountInCents = Math.round(Number(params.amount) * 100);
    
    // Calculate platform fee (for internal use)
    const platformFee = Math.round(
      amountInCents * ((params.clientFeePercent + params.providerFeePercent) / 100)
    );
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: params.currency,
        capture_method: params.capture_method,
        metadata: {
          ...params.metadata,
          clientFeePercent: params.clientFeePercent.toString(),
          providerFeePercent: params.providerFeePercent.toString(),
          platformFee: platformFee.toString(),
        },
        description: `Payment for ${params.metadata.serviceName}`,
      });
      
      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Capture a payment intent (move funds from authorization to capture)
   * @param paymentIntentId Payment intent ID to capture
   */
  async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.capture(paymentIntentId);
    } catch (error) {
      console.error('Error capturing payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a payment intent (release authorization)
   * @param paymentIntentId Payment intent ID to cancel
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      console.error('Error canceling payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Refund a payment
   * @param paymentIntentId Payment intent ID to refund
   */
  async refundPayment(paymentIntentId: string): Promise<Stripe.Refund> {
    try {
      return await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  },
}; 
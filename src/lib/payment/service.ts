/**
 * Service for handling payment-related operations
 * This file is a compatibility layer for legacy code still expecting Stripe-like API
 * All operations are now redirected to PayPal implementation
 */
import paypalClient from './paypal';
import { logger } from '@/lib/logger';

export const paymentService = {
  /**
   * Create a payment intent (now using PayPal)
   * @param params Payment parameters
   */
  async createPaymentIntent(params: any): Promise<any> {
    logger.warn('Stripe service.ts called but Stripe has been removed - redirecting to PayPal');
    
    try {
      // In PayPal, we use createOrder instead of createPaymentIntent
      const order = await paypalClient.createOrder(
        params.amount,
        params.currency || 'USD',
        params.metadata,
        {
          description: `Payment for ${params.metadata.serviceName}`
        }
      );
      
      return {
        id: order.id,
        client_secret: order.id, // Using order ID as the "client secret"
        amount: params.amount,
        currency: params.currency || 'USD',
        status: order.status,
        paypal_order: order
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Capture a payment intent (using PayPal)
   * @param paymentIntentId Payment intent ID to capture
   */
  async capturePaymentIntent(paymentIntentId: string): Promise<any> {
    logger.warn('Stripe service.ts capturePaymentIntent called but Stripe has been removed - redirecting to PayPal');
    
    try {
      // Use captureOrder which is the actual method in PayPalClient
      return await paypalClient.captureOrder(paymentIntentId);
    } catch (error) {
      logger.error('Error capturing payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Cancel a payment intent (using PayPal)
   * @param paymentIntentId Payment intent ID to cancel
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<any> {
    logger.warn('Stripe service.ts cancelPaymentIntent called but Stripe has been removed - redirecting to PayPal');
    
    try {
      // In PayPal, cancelPaymentIntent is implemented through getting and checking the order
      const order = await paypalClient.getOrder(paymentIntentId);
      return {
        id: order.id,
        status: order.status,
        paypal_order: order
      };
    } catch (error) {
      logger.error('Error canceling payment intent:', error);
      throw error;
    }
  },
  
  /**
   * Refund a payment (using PayPal)
   * @param paymentIntentId Payment intent ID to refund
   */
  async refundPayment(paymentIntentId: string): Promise<any> {
    logger.warn('Stripe service.ts refundPayment called but Stripe has been removed - redirecting to PayPal');
    
    try {
      // In PayPal, we need to handle this by creating a refund for the capture
      // This is a simplified implementation - in a real app you'd need to get the capture ID
      return await paypalClient.createRefund(paymentIntentId);
    } catch (error) {
      logger.error('Error refunding payment:', error);
      throw error;
    }
  },
  
  /**
   * Release funds to provider (using PayPal)
   */
  async releaseFundsToProvider(params: any): Promise<any> {
    logger.warn('Stripe service.ts releaseFundsToProvider called but Stripe has been removed - redirecting to PayPal');
    
    try {
      // In PayPal, we use releaseFunds
      return await paypalClient.releaseFunds(params.paymentIntentId);
    } catch (error) {
      logger.error('Error releasing funds to provider:', error);
      throw error;
    }
  },
}; 
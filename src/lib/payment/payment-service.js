/**
 * Payment Service - Commission-Based PayPal Integration
 * 
 * Flow:
 * 1. Client pays full amount (service + commission)
 * 2. Money goes to platform account
 * 3. After provider accepts, platform sends (amount - commission) to provider
 * 4. Platform keeps commission
 */

import { prisma } from '@/lib/prisma';
import { PayPalClient } from './paypal-client.js';

const paypalClient = new PayPalClient();

/**
 * Fee configuration
 */
async function getFeeSettings() {
  // Get from admin settings or use defaults
  try {
    const settings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: ['clientFeePercent', 'providerFeePercent']
        }
      }
    });
    
    const clientFeePercent = settings.find(s => s.key === 'clientFeePercent')?.value || '5';
    const providerFeePercent = settings.find(s => s.key === 'providerFeePercent')?.value || '12';
    
    return {
      clientFeePercent: parseFloat(clientFeePercent),
      providerFeePercent: parseFloat(providerFeePercent)
    };
  } catch (error) {
    console.error('Error getting fee settings:', error);
    return {
      clientFeePercent: 5.0,  // Default 5% client fee
      providerFeePercent: 12.0 // Default 12% provider fee (platform commission)
    };
  }
}

/**
 * Payment Service for Marketplace
 * Handles automatic commission splitting between platform and providers
 */
export class PaymentService {
  
  /**
   * Create marketplace payment order for client to pay
   * Automatically splits payment: Client Fee goes to platform, Provider gets their share
   */
  async createMarketplacePaymentOrder(transactionId, serviceAmount, providerId, metadata = {}) {
    try {
      console.log(`Creating marketplace payment for transaction ${transactionId}, amount: $${serviceAmount}`);
      
      // Get current fee settings
      const { clientFeePercent, providerFeePercent } = await getFeeSettings();
      
      // Calculate amounts
      const clientFee = serviceAmount * (clientFeePercent / 100);
      const totalClientPays = serviceAmount + clientFee; // What client pays
      
      const platformCommission = serviceAmount * (providerFeePercent / 100);
      const providerReceives = serviceAmount - platformCommission; // What provider gets
      
      console.log(`Marketplace Payment Breakdown:`);
      console.log(`- Service Amount: $${serviceAmount}`);
      console.log(`- Client Fee (${clientFeePercent}%): $${clientFee}`);
      console.log(`- Total Client Pays: $${totalClientPays}`);
      console.log(`- Platform Commission (${providerFeePercent}%): $${platformCommission}`);
      console.log(`- Provider Receives: $${providerReceives}`);
      
      // Get provider's PayPal account info
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { 
          paypalMerchantId: true,
          paypalOnboardingComplete: true,
          paypalStatus: true 
        }
      });
      
      if (!provider) {
        throw new Error('Provider not found');
      }
      
      // Check if provider has connected PayPal account
      if (!provider.paypalMerchantId || !provider.paypalOnboardingComplete) {
        console.log('Provider has not completed PayPal onboarding, using regular payment');
        return await this.createPaymentOrder(transactionId, serviceAmount, metadata);
      }
      
      // Create marketplace order with automatic splitting
      const order = await paypalClient.createMarketplaceOrder(
        totalClientPays,           // Total amount client pays
        providerReceives,          // Amount provider receives
        platformCommission + clientFee, // Total platform commission (provider fee + client fee)
        provider.paypalMerchantId, // Provider's PayPal merchant ID
        {
          transactionId,
          description: `Service booking payment - Transaction ${transactionId}`,
          paymentMethod: metadata.paymentMethod || 'card_fields'
        }
      );
      
      // Update transaction with PayPal order info
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          paymentIntentId: order.id,
          clientFeePercent: clientFeePercent,
          providerFeePercent: providerFeePercent,
          status: 'PENDING_PAYMENT'
        }
      });
      
      return {
        orderId: order.id,
        clientPays: totalClientPays,
        providerReceives: providerReceives,
        platformCommission: platformCommission + clientFee,
        isMarketplacePayment: true
      };
      
    } catch (error) {
      console.error('Error creating marketplace payment:', error);
      throw error;
    }
  }

  /**
   * Create payment order for client to pay (fallback for non-marketplace)
   * Client pays: Service Price + Client Fee
   */
  async createPaymentOrder(transactionId, serviceAmount, metadata = {}) {
    try {
      console.log(`Creating regular payment for transaction ${transactionId}, amount: $${serviceAmount}`);
      
      // Get current fee settings
      const { clientFeePercent } = await getFeeSettings();
      
      // Calculate total amount client pays (service + client fee)
      const clientFee = serviceAmount * (clientFeePercent / 100);
      const totalClientPays = serviceAmount + clientFee;
      
      console.log(`Service: $${serviceAmount}, Client Fee: $${clientFee}, Total: $${totalClientPays}`);
      
      // Create PayPal order for the full amount
      const order = await paypalClient.createOrder(totalClientPays, 'USD', {
        transactionId,
        description: `Service booking payment - Transaction ${transactionId}`,
        paymentMethod: metadata.paymentMethod || 'card_fields'
      });
      
      // Update transaction with PayPal order info
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          paymentIntentId: order.id,
          clientFeePercent: clientFeePercent,
          status: 'PENDING_PAYMENT'
        }
      });
      
      return {
        orderId: order.id,
        clientPays: totalClientPays,
        isMarketplacePayment: false
      };
      
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  }

  /**
   * Capture payment and handle marketplace distribution
   */
  async capturePayment(orderId) {
    try {
      console.log(`Capturing payment for order ${orderId}`);
      
      // Find transaction by PayPal order ID
      const transaction = await prisma.transaction.findFirst({
        where: { paymentIntentId: orderId },
        include: {
          offer: {
            include: {
              provider: true,
              client: true,
              service: true
            }
          }
        }
      });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Capture the PayPal payment
      const captureResult = await paypalClient.captureOrder(orderId);
      
      if (captureResult.status !== 'COMPLETED') {
        throw new Error(`Payment capture failed: ${captureResult.status}`);
      }
      
      // Extract payment details
      const capture = captureResult.purchase_units[0].payments.captures[0];
      const amountReceived = parseFloat(capture.amount.value);
      
      console.log(`Payment captured: ${capture.id}, Amount: $${amountReceived}`);
      
      // Check if this was a marketplace payment
      const isMarketplacePayment = transaction.offer.provider.paypalMerchantId && 
                                   transaction.offer.provider.paypalOnboardingComplete;
      
      let platformCommission = 0;
      let providerPayment = 0;
      
      if (isMarketplacePayment) {
        // Marketplace payment - commissions are handled automatically by PayPal
        const serviceAmount = parseFloat(transaction.amount);
        const { clientFeePercent, providerFeePercent } = await getFeeSettings();
        
        platformCommission = (serviceAmount * (providerFeePercent / 100)) + 
                           (serviceAmount * (clientFeePercent / 100));
        providerPayment = serviceAmount - (serviceAmount * (providerFeePercent / 100));
        
        console.log(`Marketplace payment - Platform: $${platformCommission}, Provider: $${providerPayment}`);
      } else {
        // Regular payment - we need to handle provider payout separately
        const serviceAmount = parseFloat(transaction.amount);
        const { clientFeePercent, providerFeePercent } = await getFeeSettings();
        
        platformCommission = (serviceAmount * (providerFeePercent / 100)) + 
                           (serviceAmount * (clientFeePercent / 100));
        providerPayment = serviceAmount - (serviceAmount * (providerFeePercent / 100));
        
        console.log(`Regular payment - will need manual payout to provider: $${providerPayment}`);
      }
      
      // Update transaction status
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'PAID_PENDING_PROVIDER_ACCEPTANCE',
          paymentMethodId: capture.id
        }
      });
      
      // Create notification for provider
      await prisma.notification.create({
        data: {
          userId: transaction.offer.provider.id,
          type: 'PAYMENT',
          title: 'New Booking Request - Payment Received',
          content: `You have a new booking request for "${transaction.offer.service.name}" from ${transaction.offer.client.name}. Payment of $${amountReceived.toFixed(2)} has been received. Please review and accept/decline the booking.`,
          isRead: false
        }
      });
      
      return {
        success: true,
        captureId: capture.id,
        transactionId: transaction.id,
        amountReceived: amountReceived,
        platformCommission: platformCommission,
        providerPayment: providerPayment,
        isMarketplacePayment: isMarketplacePayment
      };
      
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  /**
   * Handle provider accepting a booking (release funds in marketplace)
   */
  async handleProviderAcceptance(transactionId) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              provider: true,
              client: true,
              service: true
            }
          }
        }
      });
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      if (transaction.status !== 'PAID_PENDING_PROVIDER_ACCEPTANCE') {
        throw new Error('Transaction is not in the correct state for acceptance');
      }
      
      // Update transaction to completed
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED'
        }
      });
      
      // In marketplace payments, funds are already distributed
      // For regular payments, we would need to send payout to provider here
      const isMarketplacePayment = transaction.offer.provider.paypalMerchantId && 
                                   transaction.offer.provider.paypalOnboardingComplete;
      
      if (!isMarketplacePayment) {
        // TODO: Send payout to provider for non-marketplace payments
        console.log('TODO: Send payout to provider for non-marketplace payment');
      }
      
      // Create notification for client
      await prisma.notification.create({
        data: {
          userId: transaction.offer.client.id,
          type: 'PAYMENT',
          title: 'Booking Confirmed',
          content: `Your booking for "${transaction.offer.service.name}" has been confirmed by the provider. Service details will be shared with you soon.`,
          isRead: false
        }
      });
      
      return {
        success: true,
        isMarketplacePayment: isMarketplacePayment
      };
      
    } catch (error) {
      console.error('Error handling provider acceptance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService(); 
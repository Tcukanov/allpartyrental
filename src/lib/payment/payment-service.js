/**
 * Payment Service - Commission-Based PayPal Integration
 * 
 * Flow:
 * 1. Client pays full amount (service + commission)
 * 2. Money goes to platform account
 * 3. After provider accepts, platform sends (amount - commission) to provider
 * 4. Platform keeps commission
 */

import { PrismaClient } from '@prisma/client';
import { PayPalClientFixed } from './paypal-client.js';

const paypalClient = new PayPalClientFixed();

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
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create PayPal order for marketplace payment
   */
  async createPaymentOrder(bookingData) {
    console.log('🏪 PaymentService.createPaymentOrder called with:', bookingData);
    
    try {
      const { serviceId, userId, bookingDate, hours, addons = [] } = bookingData;

      console.log('🔍 Fetching service with provider information...');
      // Get service with provider information
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          provider: {
            include: {
              user: true
            }
          },
          category: true
        }
      });

      console.log('🔍 Service fetch result:', {
        found: !!service,
        serviceId: service?.id,
        serviceName: service?.name,
        providerId: service?.provider?.id,
        providerHasUser: !!service?.provider?.user,
        categoryName: service?.category?.name
      });

      if (!service) {
        console.log('❌ Service not found in PaymentService');
        throw new Error('Service not found');
      }

      // Check if provider has PayPal connected
      if (!service.provider.paypalCanReceivePayments) {
        console.log('❌ Provider cannot receive payments:', {
          providerId: service.provider.id,
          canReceivePayments: service.provider.paypalCanReceivePayments,
          merchantId: service.provider.paypalMerchantId,
          onboardingStatus: service.provider.paypalOnboardingStatus
        });
        throw new Error('Provider PayPal account not connected. Payments cannot be processed.');
      }

      console.log('💰 Calculating pricing...');
      // Calculate pricing
      const basePrice = service.price * hours;
      const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
      const subtotal = basePrice + addonTotal;
      
      // Platform fees (configurable)
      const platformFeePercent = 5; // 5% platform fee
      const platformFee = subtotal * (platformFeePercent / 100);
      const total = subtotal + platformFee;

      console.log('💰 Pricing breakdown:', {
        basePrice,
        addonTotal,
        subtotal,
        platformFeePercent,
        platformFee,
        total
      });

      console.log('📋 Creating PayPal order data...');
      // Create PayPal order with marketplace split
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: serviceId,
          description: `${service.name} - ${hours} hours`,
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: subtotal.toFixed(2)
              },
              handling: {
                currency_code: 'USD', 
                value: platformFee.toFixed(2)
              }
            }
          },
          payee: {
            merchant_id: service.provider.paypalMerchantId
          },
          payment_instruction: {
            disbursement_mode: 'DELAYED', // Hold funds in escrow
            platform_fees: [{
              amount: {
                currency_code: 'USD',
                value: platformFee.toFixed(2)
              }
            }]
          },
          items: [{
            name: service.name,
            description: `${service.category.name} service for ${hours} hours`,
            unit_amount: {
              currency_code: 'USD',
              value: service.price.toFixed(2)
            },
            quantity: hours.toString(),
            category: 'DIGITAL_GOODS'
          }]
        }],
        application_context: {
          brand_name: 'AllPartyRent',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXTAUTH_URL}/payments/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/payments/cancel`
        }
      };

      console.log('📋 PayPal order data created:', JSON.stringify(orderData, null, 2));

      console.log('🔗 Calling PayPal client to create order...');
      // Create PayPal order
      const order = await paypalClient.createOrder(orderData);
      
      console.log('✅ PayPal order created:', {
        orderId: order.id,
        status: order.status,
        linksCount: order.links?.length || 0
      });

      console.log('🎯 Getting or creating offer...');
      // Create database transaction record
      const offer = await this.getOrCreateOffer(serviceId, userId, bookingData);
      
      console.log('✅ Offer created/found:', {
        offerId: offer.id,
        price: offer.price,
        status: offer.status
      });
      
      console.log('💾 Creating transaction record...');
      const transaction = await this.prisma.transaction.create({
        data: {
          offerId: offer.id,
          amount: total,
          status: 'PENDING',
          paypalOrderId: order.id,
          paypalStatus: order.status,
          clientFeePercent: platformFeePercent,
          providerFeePercent: 100 - platformFeePercent, // Provider gets the rest
          termsAccepted: false
        }
      });

      console.log('✅ Transaction created:', {
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        paypalOrderId: transaction.paypalOrderId
      });

      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;
      console.log('🔗 Approval URL found:', !!approvalUrl);

      const result = {
        success: true,
        orderId: order.id,
        transactionId: transaction.id,
        approvalUrl: approvalUrl,
        total: total,
        currency: 'USD'
      };

      console.log('✅ PaymentService.createPaymentOrder completed successfully:', result);
      return result;

    } catch (error) {
      console.error('💥 Payment order creation failed in PaymentService:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Capture PayPal payment after user approval
   */
  async capturePayment(orderId) {
    try {
      // Find transaction by PayPal order ID
      const transaction = await this.prisma.transaction.findFirst({
        where: { paypalOrderId: orderId },
        include: {
          offer: {
            include: {
              service: {
                include: {
                  provider: true
                }
              },
              client: true
            }
          }
        }
      });

      if (!transaction) {
        throw new Error('Transaction not found for order ID: ' + orderId);
      }

      // Capture the PayPal payment
      const captureResult = await paypalClient.captureOrder(orderId);

      // Update transaction with capture details
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          paypalCaptureId: captureResult.id,
          paypalTransactionId: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
          paypalPayerId: captureResult.payer?.payer_id,
          paypalStatus: captureResult.status,
          escrowStartTime: new Date(),
          escrowEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days escrow
        }
      });

      return {
        success: true,
        transaction: updatedTransaction,
        captureId: captureResult.id,
        status: captureResult.status
      };

    } catch (error) {
      console.error('Payment capture failed:', error);
      
      // Update transaction status to failed
      if (orderId) {
        await this.prisma.transaction.updateMany({
          where: { paypalOrderId: orderId },
          data: { 
            status: 'FAILED',
            paypalStatus: 'FAILED'
          }
        });
      }
      
      throw error;
    }
  }

  /**
   * Get or create offer for the booking
   */
  async getOrCreateOffer(serviceId, clientId, bookingData) {
    const { bookingDate, hours, addons = [] } = bookingData;
    
    // Check if offer already exists for this booking
    let offer = await this.prisma.offer.findFirst({
      where: {
        serviceId,
        clientId,
        status: 'PENDING'
      }
    });

    if (!offer) {
      // Get service to get provider ID and city
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          provider: true,
          city: true  // Include city relation if it exists
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Handle city - get from service or use a default city
      let cityId = service.cityId;
      if (!cityId) {
        // If service doesn't have a city, get the first available city as default
        const defaultCity = await this.prisma.city.findFirst();
        if (!defaultCity) {
          throw new Error('No cities available in the system');
        }
        cityId = defaultCity.id;
        console.log('🏙️ Service has no city, using default city:', defaultCity.name);
      }

      // For direct bookings, we need to create a party first
      const party = await this.prisma.party.create({
        data: {
          name: `Direct Booking - ${service.name}`,
          date: new Date(bookingDate),
          startTime: new Date(bookingDate).toTimeString().substring(0, 5),
          duration: hours,
          guestCount: 1,
          status: 'PUBLISHED',
          clientId: clientId,
          cityId: cityId,  // Use the resolved cityId
          address: bookingData.address || 'Address to be provided',
          comments: bookingData.comments || '',
          contactPhone: bookingData.contactPhone || ''
        }
      });

      // Create party service
      const partyService = await this.prisma.partyService.create({
        data: {
          partyId: party.id,
          serviceId: serviceId,
          specificOptions: {
            hours: hours,
            addons: addons,
            notes: bookingData.comments || ''
          }
        }
      });

      // Create new offer with required partyServiceId
      offer = await this.prisma.offer.create({
        data: {
          providerId: service.providerId,
          clientId,
          serviceId,
          partyServiceId: partyService.id,
          price: service.price * hours,
          description: `Booking for ${hours} hours on ${new Date(bookingDate).toLocaleDateString()}`,
          status: 'PENDING'
        }
      });
    }

    return offer;
  }

  /**
   * Release funds from escrow to provider
   */
  async releaseFunds(transactionId) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              service: {
                include: {
                  provider: true
                }
              }
            }
          }
        }
      });

      if (!transaction || !transaction.paypalCaptureId) {
        throw new Error('Transaction not found or not captured');
      }

      if (transaction.status !== 'COMPLETED') {
        throw new Error('Transaction not in completed status');
      }

      // Release funds via PayPal
      await paypalClient.releaseFunds(transaction.paypalCaptureId, {
        merchant_id: transaction.offer.service.provider.paypalMerchantId
      });

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'RELEASED',
          escrowEndTime: new Date()
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Funds release failed:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, reason = 'Requested by customer') {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction || !transaction.paypalCaptureId) {
        throw new Error('Transaction not found or not captured');
      }

      // Process refund via PayPal
      const refundResult = await paypalClient.refundCapture(
        transaction.paypalCaptureId,
        {
          amount: {
            currency_code: 'USD',
            value: transaction.amount.toString()
          },
          note_to_payer: reason
        }
      );

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'REFUNDED',
          paypalStatus: 'REFUNDED'
        }
      });

      return {
        success: true,
        refundId: refundResult.id,
        status: refundResult.status
      };

    } catch (error) {
      console.error('Refund failed:', error);
      throw error;
    }
  }

  /**
   * Get transaction by PayPal order ID
   */
  async getTransactionByOrderId(orderId) {
    return await this.prisma.transaction.findFirst({
      where: { paypalOrderId: orderId },
      include: {
        offer: {
          include: {
            service: {
              include: {
                provider: {
                  include: {
                    user: true
                  }
                }
              }
            },
            client: true
          }
        }
      }
    });
  }
}

// Export singleton instance
export const paymentService = new PaymentService(); 
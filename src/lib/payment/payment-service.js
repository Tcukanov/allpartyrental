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
    console.log('🔥 PaymentService constructor called - NEW VERSION WITH PLATFORM FEES 🔥');
  }

  /**
   * Determine payment source from PayPal capture result
   */
  getPaymentSource(captureResult) {
    // Check payment source from the capture
    const paymentSource = captureResult.payment_source || captureResult.payer?.payment_source;
    
    if (paymentSource) {
      if (paymentSource.paypal) return 'PayPal';
      if (paymentSource.venmo) return 'Venmo';
      if (paymentSource.card) return `Card (${paymentSource.card.brand || 'Credit/Debit'})`;
      if (paymentSource.apple_pay) return 'Apple Pay';
      if (paymentSource.google_pay) return 'Google Pay';
    }

    // Fallback: check funding source
    const fundingSource = captureResult.payer?.funding_instrument?.type || 
                         captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.payment_method;
    
    if (fundingSource) {
      if (fundingSource.includes('PAYPAL') || fundingSource.includes('BALANCE')) return 'PayPal';
      if (fundingSource.includes('VENMO')) return 'Venmo';
      if (fundingSource.includes('CARD')) return 'Card';
    }

    // Default
    return 'PayPal';
  }

  /**
   * Create PayPal order for marketplace payment
   */
  async createPaymentOrder(bookingData) {
    console.log('🔥🔥🔥 PAYMENT SERVICE CREATE ORDER CALLED - NEW VERSION 🔥🔥🔥');
    console.log('🏪 PaymentService.createPaymentOrder called with:', bookingData);

    try {
      const { serviceId, userId, bookingDate, hours, paymentMethod = '', addons = [] } = bookingData;

      // NOTE: No duplicate booking check here!
      // Offers are created in saveAuthorization(), not here
      // Duplicate check happens in saveAuthorization()

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

      console.log('📋 Creating PayPal order with platform fees...');
      // Create PayPal order with platform fees as per PayPal integration guide
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
            disbursement_mode: 'INSTANT',
            platform_fees: [{
              amount: {
                currency_code: 'USD',
                value: platformFee.toFixed(2)
              },
              payee: {
                merchant_id: process.env.PAYPAL_PLATFORM_MERCHANT_ID
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
          }],
          // Add soft descriptor for better transaction descriptions
          soft_descriptor: 'AllPartyRent'
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

      console.log('💰 Platform commission configuration:', {
        platformFee: platformFee.toFixed(2),
        platformMerchantId: process.env.PAYPAL_PLATFORM_MERCHANT_ID,
        usingDedicatedAccount: !!process.env.PAYPAL_PLATFORM_MERCHANT_ID
      });

      console.log('📋 PayPal order data created:', JSON.stringify(orderData, null, 2));

      console.log('🔗 Calling PayPal client to create order...');
      // Create PayPal order with platform fees
      const order = await paypalClient.createOrder(orderData);

      console.log('✅ PayPal order created:', {
        orderId: order.id,
        status: order.status,
        linksCount: order.links?.length || 0
      });

      // IMPORTANT: We do NOT create offer/transaction here!
      // Offer and transaction are ONLY created in saveAuthorization()
      // when user actually approves payment in PayPal.
      // This prevents "ghost bookings" when user cancels payment.

      const approvalUrl = order.links.find(link => link.rel === 'approve')?.href;
      console.log('🔗 Approval URL found:', !!approvalUrl);

      const result = {
        success: true,
        orderId: order.id,
        transactionId: null, // Transaction created in saveAuthorization, not here
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
      console.log('🎯 PaymentService.capturePayment called for order:', orderId);
      
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

      console.log('💰 Transaction details before capture:', {
        transactionId: transaction.id,
        amount: transaction.amount,
        clientFeePercent: transaction.clientFeePercent,
        providerFeePercent: transaction.providerFeePercent,
        paypalOrderId: transaction.paypalOrderId,
        status: transaction.status
      });

      // Get PayPal order details before capture to see commission configuration
      console.log('🔍 Getting PayPal order details before capture...');
      const orderDetails = await paypalClient.getOrder(orderId);
      
      console.log('📋 PayPal order commission analysis:', {
        orderId: orderId,
        orderStatus: orderDetails.status,
        hasPlatformFees: !!orderDetails.purchase_units?.[0]?.payment_instruction?.platform_fees,
        platformFeesCount: orderDetails.purchase_units?.[0]?.payment_instruction?.platform_fees?.length || 0,
        platformFees: orderDetails.purchase_units?.[0]?.payment_instruction?.platform_fees || 'None configured',
        totalAmount: orderDetails.purchase_units?.[0]?.amount?.value,
        currency: orderDetails.purchase_units?.[0]?.amount?.currency_code
      });

      // Capture the PayPal payment
      console.log('💳 Capturing PayPal payment...');
      const captureResult = await paypalClient.captureOrder(orderId);
      
             console.log('✅ PayPal capture result analysis:', {
         captureId: captureResult.id,
         status: captureResult.status,
         grossAmount: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
         netAmount: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.net_amount?.value,
         paypalFee: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.paypal_fee?.value,
         platformFee: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.platform_fees?.[0]?.amount?.value,
         platformFeePayee: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.platform_fees?.[0]?.payee?.merchant_id
       });

       // Log the complete seller_receivable_breakdown for debugging
       console.log('🔍 Complete PayPal seller_receivable_breakdown:', JSON.stringify(
         captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown, 
         null, 
         2
       ));

       // Log platform fee details specifically
       const platformFees = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.seller_receivable_breakdown?.platform_fees;
       if (platformFees && platformFees.length > 0) {
         console.log('💰 Platform fee details:', {
           count: platformFees.length,
           fees: platformFees.map(fee => ({
             amount: fee.amount?.value,
             currency: fee.amount?.currency_code,
             payee: fee.payee?.merchant_id,
             payeeType: fee.payee?.email_address ? 'email' : 'merchant_id'
           }))
         });
       } else {
         console.log('❌ No platform fees found in capture result');
       }

      // Update transaction with capture details
      // NOTE: captureResult.id is the ORDER ID, the actual capture ID is in payments.captures[0].id
      const actualCaptureId = captureResult.purchase_units[0]?.payments?.captures[0]?.id;
      
      if (!actualCaptureId) {
        console.error('⚠️ No capture ID found in capture result!', JSON.stringify(captureResult, null, 2));
        throw new Error('Payment was approved but no capture ID was returned');
      }
      
      console.log('💾 Saving capture details:', {
        orderId: captureResult.id,
        captureId: actualCaptureId,
        payerId: captureResult.payer?.payer_id
      });
      
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          paypalCaptureId: actualCaptureId, // This is the ACTUAL capture ID for refunds
          paypalTransactionId: actualCaptureId, // Same as capture ID
          paypalPayerId: captureResult.payer?.payer_id,
          paypalStatus: captureResult.status,
          escrowStartTime: new Date(),
          escrowEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days escrow
        }
      });

      // Note: Offer status should already be PENDING at this point (changed in saveAuthorization)
      // Capture is only called when provider approves, so no need to update offer status here

      // Extract payment details for thank you page
      const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
      const paymentSource = this.getPaymentSource(captureResult);
      
      return {
        success: true,
        transaction: updatedTransaction,
        captureId: actualCaptureId, // Return the actual capture ID, not order ID
        status: captureResult.status,
        // Payment details for thank you page
        paymentDetails: {
          paymentSource: paymentSource,
          payerEmail: captureResult.payer?.email_address || null,
          payerName: captureResult.payer?.name ? 
            `${captureResult.payer.name.given_name || ''} ${captureResult.payer.name.surname || ''}`.trim() : null,
          shippingAddress: captureResult.purchase_units?.[0]?.shipping?.address ? {
            line1: captureResult.purchase_units[0].shipping.address.address_line_1,
            line2: captureResult.purchase_units[0].shipping.address.address_line_2,
            city: captureResult.purchase_units[0].shipping.address.admin_area_2,
            state: captureResult.purchase_units[0].shipping.address.admin_area_1,
            postalCode: captureResult.purchase_units[0].shipping.address.postal_code,
            country: captureResult.purchase_units[0].shipping.address.country_code
          } : null,
          billingAddress: captureResult.payer?.address ? {
            line1: captureResult.payer.address.address_line_1,
            line2: captureResult.payer.address.address_line_2,
            city: captureResult.payer.address.admin_area_2,
            state: captureResult.payer.address.admin_area_1,
            postalCode: captureResult.payer.address.postal_code,
            country: captureResult.payer.address.country_code
          } : null
        }
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
   * Get PayPal order details to check status
   */
  async getOrderDetails(orderId) {
    try {
      const orderDetails = await paypalClient.getOrder(orderId);
      return orderDetails;
    } catch (error) {
      console.error('Failed to get PayPal order details:', error);

      throw error;
    }
  }

  async saveAuthorization(bookingData, order) {

    const { serviceId, userId, bookingDate, hours, addons = [] } = bookingData;

    // Check for duplicate booking (already paid)
    const existingOffer = await this.prisma.offer.findFirst({
      where: {
        serviceId,
        clientId: userId,
        status: { in: ['PENDING', 'APPROVED'] }
      },
      include: {
        transaction: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (existingOffer && existingOffer.transaction?.status === 'COMPLETED') {
      console.log('⚠️ Duplicate booking attempt - payment already completed');
      throw new Error('You have already booked this service. Please check your bookings.');
    }

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

    console.log('💰 Calculating pricing...');
    // Calculate pricing
    const basePrice = service.price * hours;
    const addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
    const subtotal = basePrice + addonTotal;

    // Platform fees (configurable)
    const platformFeePercent = 5; // 5% platform fee
    const platformFee = subtotal * (platformFeePercent / 100);
    const total = subtotal + platformFee;

    console.log('🎯 Getting or creating offer...');
    // Create database transaction record
    const offer = await this.getOrCreateOffer(serviceId, userId, bookingData);

    console.log('✅ Offer created/found:', {
      offerId: offer.id,
      price: offer.price,
      status: offer.status
    });

    // Offer is already PENDING and visible to provider
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

    const result = {
      success: true,
      orderId: order.id,
      transactionId: transaction.id,
      approvalUrl: '',
      total: total,
      currency: 'USD'
    };

    console.log('✅ PaymentService.createPaymentOrder completed successfully:', result);
    return result;
  }

  /**
   * Get or create offer for the booking
   */
  async getOrCreateOffer(serviceId, clientId, bookingData) {
    const { bookingDate, hours, addons = [] } = bookingData;

    console.log('🔍 Looking for existing offer with:', {
      serviceId,
      clientId,
      bookingDate,
      hours
    });

    // Check if offer already exists for this specific booking
    let offer = await this.prisma.offer.findFirst({
      where: {
        serviceId,
        clientId,
        status: 'PENDING',
        description: {
          contains: new Date(bookingDate).toLocaleDateString()
        }
      },
      include: {
        partyService: {
          include: {
            party: true
          }
        }
      }
    });

    if (offer) {
      console.log('♻️ Found existing offer:', {
        offerId: offer.id,
        price: offer.price,
        description: offer.description
      });
    }

    if (!offer) {
      // Get service to get provider ID
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          provider: true
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Get a default city for the party (services are no longer tied to specific cities)
      const defaultCity = await this.prisma.city.findFirst();
      if (!defaultCity) {
        throw new Error('No cities available in the system');
      }
      const cityId = defaultCity.id;
      console.log('🏙️ Using default city for party:', defaultCity.name);

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
        }
      });

      // Create party service with booking details in specificOptions
      const partyService = await this.prisma.partyService.create({
        data: {
          partyId: party.id,
          serviceId: serviceId,
          specificOptions: {
            hours: hours,
            addons: addons,
            notes: bookingData.comments || '',
            address: bookingData.address || 'Address to be provided',
            contactPhone: bookingData.contactPhone || '',
            bookingType: 'direct_booking'
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
          status: 'PENDING'  // Visible to provider after authorization
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
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              provider: true
            }
          }
        }
      });

      if (!transaction || !transaction.paypalCaptureId) {
        throw new Error('Transaction not found or not captured');
      }

      if (!transaction.offer?.provider?.paypalMerchantId) {
        throw new Error('Provider PayPal merchant ID not found');
      }

      console.log('💸 Processing refund:', {
        transactionId,
        captureId: transaction.paypalCaptureId,
        amount: transaction.amount,
        merchantId: transaction.offer.provider.paypalMerchantId
      });

      // Process refund via PayPal with merchant authorization
      const refundResult = await paypalClient.refundCapture(
        transaction.paypalCaptureId,
        {
          amount: {
            currency_code: 'USD',
            value: transaction.amount.toString()
          },
          note_to_payer: reason
        },
        transaction.offer.provider.paypalMerchantId // Pass merchant ID for auth assertion
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

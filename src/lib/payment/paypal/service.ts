import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// API URLs for PayPal
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// PayPal API client class
export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // In development, use dummy values if environment variables aren't set
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    this.clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID || 
                   (isDevelopment ? 'dummy-development-client-id' : '');
    
    this.clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET || 
                       (isDevelopment ? 'dummy-development-client-secret' : '');
    
    // Only throw an error in production if credentials are missing
    if (!isDevelopment && (!this.clientId || !this.clientSecret)) {
      throw new Error('PayPal credentials are not configured');
    } else if (isDevelopment && (!process.env.PAYPAL_SANDBOX_CLIENT_ID || !process.env.PAYPAL_SANDBOX_CLIENT_SECRET)) {
      console.warn('⚠️ Running with dummy PayPal credentials. Set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET for actual API calls.');
    }
  }

  /**
   * Get an access token for PayPal API
   */
  private async getAccessToken(): Promise<string> {
    // Check if token exists and isn't expired
    if (this.accessToken && Date.now() < this.tokenExpiry - 10000) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal auth error: ${errorData.error_description || 'Unknown error'}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get PayPal access token', error);
      throw error;
    }
  }

  /**
   * Make a request to the PayPal API
   */
  private async request(endpoint: string, method: string, data?: any): Promise<any> {
    try {
      // Check if using dummy credentials in development mode
      const isDevelopment = process.env.NODE_ENV === 'development';
      const usingDummyCredentials = isDevelopment && 
        (this.clientId === 'dummy-development-client-id' || 
         !process.env.PAYPAL_SANDBOX_CLIENT_ID);
      
      // Return mock responses when using dummy credentials in development
      if (usingDummyCredentials) {
        logger.info(`PayPal mock request: ${method} ${endpoint}`);
        return this.getMockResponse(endpoint, method, data);
      }
      
      const token = await this.getAccessToken();
      const url = `${PAYPAL_API_BASE}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      // For 204 No Content responses
      if (response.status === 204) {
        return { success: true };
      }

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayPal API error: ${responseData.message || JSON.stringify(responseData)}`);
      }
      
      return responseData;
    } catch (error) {
      logger.error(`PayPal API request error: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Generate mock responses for development environment when using dummy credentials
   */
  private getMockResponse(endpoint: string, method: string, data?: any): any {
    // Generate a UUID for IDs
    const mockId = `MOCK-${Math.random().toString(36).substring(2, 15)}`;
    
    // Extract amount if present in request data
    let amount = '10.00';
    let currency = 'USD';
    
    if (data && data.purchase_units && data.purchase_units.length > 0) {
      if (data.purchase_units[0].amount) {
        amount = data.purchase_units[0].amount.value || amount;
        currency = data.purchase_units[0].amount.currency_code || currency;
      }
    }
    
    // Handle different endpoints
    if (endpoint.includes('/v2/checkout/orders') && method === 'POST') {
      // Mock create order response
      console.log(`Creating mock PayPal order with ID: ${mockId} for amount: ${amount} ${currency}`);
      return {
        id: mockId,
        status: 'CREATED',
        links: [
          {
            href: `https://mock-api.paypal.com/v2/checkout/orders/${mockId}`,
            rel: 'self',
            method: 'GET'
          },
          {
            href: `https://mock-api.paypal.com/v2/checkout/orders/${mockId}/capture`,
            rel: 'capture',
            method: 'POST'
          }
        ],
        purchase_units: [
          {
            reference_id: `mock-ref-${Date.now()}`,
            amount: {
              currency_code: currency,
              value: amount
            }
          }
        ]
      };
    } else if (endpoint.includes('/v2/checkout/orders') && endpoint.includes('/capture')) {
      // Mock capture response
      const orderId = endpoint.split('/')[4];
      console.log(`Capturing mock PayPal order with ID: ${orderId}`);
      return {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [
          {
            reference_id: `mock-ref-${Date.now()}`,
            amount: {
              currency_code: currency,
              value: amount
            },
            payments: {
              captures: [
                {
                  id: `MOCK-CAPTURE-${Math.random().toString(36).substring(2, 10)}`,
                  status: 'COMPLETED',
                  amount: {
                    currency_code: currency,
                    value: amount
                  },
                  final_capture: true,
                  disbursement_mode: "INSTANT",
                  create_time: new Date().toISOString(),
                  update_time: new Date().toISOString()
                }
              ]
            }
          }
        ]
      };
    } else if (endpoint.includes('/v2/customer/partner-referrals')) {
      // Mock partner referral response
      return {
        links: [
          {
            href: 'https://mock-api.paypal.com/merchantonboard',
            rel: 'action_url',
            method: 'GET'
          }
        ]
      };
    } else if (endpoint.includes('/v1/oauth2/token')) {
      // Mock token response
      return {
        access_token: 'MOCK-ACCESS-TOKEN',
        token_type: 'Bearer',
        expires_in: 32400
      };
    }
    
    // Default mock response
    return {
      mock: true,
      mockId: mockId,
      originalEndpoint: endpoint,
      originalMethod: method,
      originalData: data
    };
  }

  /**
   * Create a PayPal partner referral for merchant onboarding
   * @param providerId - Provider ID to associate with the PayPal account
   * @param email - Email to associate with the account
   * @param businessName - Business name of the provider
   */
  async createPartnerReferral(providerId: string, email: string, businessName: string): Promise<any> {
    // For sandbox testing without partner approval, create a direct link
    console.log(`Creating PayPal onboarding link for ${email}, Client ID: ${this.clientId.substring(0, 8)}...`);

    // Generate a tracking ID
    const timestamp = Date.now();
    const trackingId = `${providerId.substring(0, 8)}_${timestamp}`;

    // In development/sandbox, we'll use our manual onboarding page instead of PayPal's Partner API
    return {
      success: true,
      links: [
        {
          href: `${process.env.NEXTAUTH_URL}/provider/settings/payments/manual-paypal-setup?trackingId=${trackingId}&email=${encodeURIComponent(email)}&businessName=${encodeURIComponent(businessName)}`,
          rel: 'action_url',
          method: 'GET'
        }
      ]
    };
  }

  /**
   * Check the status of a merchant integration
   * @param merchantId - PayPal merchant ID to check
   */
  async getMerchantStatus(merchantId: string): Promise<any> {
    return this.request(`/v1/customer/partners/${process.env.PAYPAL_PARTNER_ID}/merchant-integrations/${merchantId}`, 'GET');
  }

  /**
   * Create an order for the PayPal checkout process
   * @param amount - Amount to charge
   * @param currency - Currency code (e.g., USD)
   * @param applicationContext - Additional context for the order
   */
  async createOrder(amount: number, currency: string, metadata?: any, applicationContext?: any): Promise<any> {
    // Ensure amount is properly formatted as dollars with 2 decimal places
    // amount is already in dollars (e.g. 628.95)
    const amountValue = parseFloat(amount.toString()).toFixed(2);
      
    console.log(`Creating PayPal order with amount: ${amountValue} ${currency}`);
    
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amountValue
          },
          reference_id: uuidv4(),
          custom_id: metadata?.transactionId || uuidv4(),
          description: metadata?.description || "Service booking payment"
        }
      ],
      application_context: applicationContext || {
        brand_name: process.env.COMPANY_NAME || "All Party Rent",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`
      }
    };

    return this.request('/v2/checkout/orders', 'POST', orderData);
  }

  /**
   * Create an order with marketplace fees
   * @param amount - Amount to charge
   * @param currency - Currency code (e.g., USD)
   * @param sellerId - Connected PayPal account ID to transfer funds to
   * @param platformFee - Fee amount to retain for the platform
   */
  async createMarketplaceOrder(
    amount: number, 
    currency: string,
    sellerId: string, 
    platformFee: number,
    metadata?: any
  ): Promise<any> {
    // Ensure amount is properly formatted as dollars with 2 decimal places
    const amountValue = parseFloat(amount.toString()).toFixed(2);
    const platformFeeValue = parseFloat(platformFee.toString()).toFixed(2);
    
    // Calculate the amount that goes to the seller (total minus platform fee)
    const sellerAmount = (parseFloat(amountValue) - parseFloat(platformFeeValue)).toFixed(2);
    
    console.log(`Creating PayPal marketplace order with amount: ${amountValue} ${currency}, platform fee: ${platformFeeValue}, seller amount: ${sellerAmount}`);
    
    // The order data structure follows PayPal's required schema for marketplace orders
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: uuidv4(),
          description: metadata?.description || "Service booking payment",
          custom_id: metadata?.transactionId || uuidv4(),
          amount: {
            currency_code: currency,
            value: amountValue,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amountValue
              }
            }
          },
          payee: {
            merchant_id: sellerId
          },
          payment_instruction: {
            disbursement_mode: "DELAYED",
            platform_fees: [
              {
                amount: {
                  currency_code: currency,
                  value: platformFeeValue
                }
              }
            ]
          },
          items: [
            {
              name: metadata?.serviceName || "Service booking",
              description: metadata?.description || "Service booking payment",
              quantity: "1",
              unit_amount: {
                currency_code: currency,
                value: amountValue
              }
            }
          ]
        }
      ],
      application_context: {
        brand_name: process.env.COMPANY_NAME || "All Party Rent",
        landing_page: "BILLING",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`
      }
    };

    return this.request('/v2/checkout/orders', 'POST', orderData);
  }

  /**
   * Capture an order (charge the payment)
   * @param orderId - PayPal order ID to capture
   */
  async captureOrder(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${orderId}/capture`, 'POST');
  }

  /**
   * Get order details
   * @param orderId - PayPal order ID to retrieve
   */
  async getOrder(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${orderId}`, 'GET');
  }

  /**
   * Create a refund for a captured payment
   * @param captureId - The capture ID from the captured payment
   * @param amount - Amount to refund (optional, defaults to full amount)
   * @param currency - Currency code (e.g., USD)
   */
  async createRefund(captureId: string, amount?: number, currency?: string): Promise<any> {
    const refundData: any = {};
    
    if (amount && currency) {
      refundData.amount = {
        value: parseFloat(amount.toString()).toFixed(2),
        currency_code: currency
      };
    }

    return this.request(`/v2/payments/captures/${captureId}/refund`, 'POST', refundData);
  }

  /**
   * Create a payout to a provider
   * @param email - PayPal email of the recipient
   * @param amount - Amount to pay out
   * @param currency - Currency code (e.g., USD)
   * @param note - Note to include with the payout
   */
  async createPayout(email: string, amount: number, currency: string, note: string): Promise<any> {
    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `batch_${uuidv4()}`,
        email_subject: "You received a payout!",
        email_message: note || "You received a payout for your services"
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount: {
            value: parseFloat(amount.toString()).toFixed(2),
            currency: currency
          },
          note: note,
          receiver: email,
          sender_item_id: uuidv4()
        }
      ]
    };

    return this.request('/v1/payments/payouts', 'POST', payoutData);
  }

  /**
   * Get the status of a payout
   * @param payoutBatchId - The payout batch ID to check
   */
  async getPayoutStatus(payoutBatchId: string): Promise<any> {
    return this.request(`/v1/payments/payouts/${payoutBatchId}`, 'GET');
  }

  /**
   * Release funds to seller (used with delayed disbursement)
   * @param orderId - The order ID to release funds for
   */
  async releaseFunds(orderId: string): Promise<any> {
    return this.request(`/v2/checkout/orders/${orderId}/release-funds`, 'POST');
  }
}

// Export singleton instance
const paypalClient = new PayPalClient();
export default paypalClient;

/**
 * Wrapper for common payment functions to align with existing service interface
 */
export const paymentService = {
  /**
   * Create a payment intent for PayPal processing
   */
  async createPaymentIntent({
    amount,
    currency = 'USD',
    paymentMethodTypes = ['card'],
    customerId,
    metadata = {},
    description,
    providerId
  }: {
    amount: number;
    currency?: string;
    paymentMethodTypes?: string[];
    customerId?: string;
    metadata?: any;
    description?: string;
    providerId?: string;
  }) {
    logger.info(`Creating PayPal payment for amount ${amount}`);
    
    try {
      let order;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const usingMockCredentials = isDevelopment && 
        (!process.env.PAYPAL_SANDBOX_CLIENT_ID || 
         !process.env.PAYPAL_SANDBOX_CLIENT_SECRET);
      
      // If we're in development with no credentials, return a mock order right away
      if (usingMockCredentials) {
        logger.info(`Using mock PayPal in development mode`);
        const mockId = `MOCK-${Math.random().toString(36).substring(2, 15)}`;
        return {
          id: mockId,
          client_secret: mockId,
          amount,
          currency,
          status: 'CREATED',
          paypal_order: {
            id: mockId,
            status: 'CREATED',
            links: []
          }
        };
      }
      
      // If provider has a connected PayPal account and we have their merchant ID
      if (providerId) {
        try {
          const provider = await getProviderPayPalAccount(providerId);
          
          if (provider && provider.paypalMerchantId) {
            // Calculate platform fee (10%)
            const platformFee = parseFloat((amount * 0.1).toFixed(2));
            
            // Create marketplace order with platform fee
            try {
              order = await paypalClient.createMarketplaceOrder(
                amount,
                currency,
                provider.paypalMerchantId,
                platformFee,
                {
                  transactionId: metadata.transactionId,
                  description: description,
                  serviceName: metadata.serviceName
                }
              );
              logger.info(`Created marketplace order with ID: ${order.id}`);
            } catch (marketplaceError) {
              // If marketplace order fails, fall back to regular order
              logger.warn(`Failed to create marketplace order: ${marketplaceError.message}. Falling back to regular order.`);
              order = await paypalClient.createOrder(
                amount, 
                currency,
                {
                  transactionId: metadata.transactionId,
                  description: description,
                  serviceName: metadata.serviceName
                }
              );
            }
          } else {
            logger.warn(`Provider ${providerId} does not have a connected PayPal account. Using regular order flow.`);
            order = await paypalClient.createOrder(
              amount, 
              currency,
              {
                transactionId: metadata.transactionId,
                description: description,
                serviceName: metadata.serviceName
              }
            );
          }
        } catch (providerError) {
          // If there's any error with the provider, fall back to a regular order
          logger.warn(`Error retrieving provider PayPal account: ${providerError.message}. Using regular order flow.`);
          order = await paypalClient.createOrder(
            amount, 
            currency,
            {
              transactionId: metadata.transactionId,
              description: description,
              serviceName: metadata.serviceName
            }
          );
        }
      } else {
        // Create regular order if no provider specified
        order = await paypalClient.createOrder(
          amount, 
          currency,
          {
            transactionId: metadata.transactionId,
            description: description,
            serviceName: metadata.serviceName
          }
        );
      }
      
      return {
        id: order.id,
        client_secret: order.id, // Using order ID as the "client secret"
        amount,
        currency,
        status: order.status,
        paypal_order: order
      };
    } catch (error) {
      logger.error('Error creating PayPal payment', error);
      throw error;
    }
  },
  
  /**
   * Capture a payment intent
   */
  async capturePaymentIntent(paymentIntentId: string) {
    try {
      const capture = await paypalClient.captureOrder(paymentIntentId);
      
      // Get amount received - it's already in dollars from PayPal
      const amountReceived = parseFloat(capture.purchase_units[0].payments.captures[0].amount.value);
      
      return {
        id: capture.id,
        status: capture.status,
        amount_received: amountReceived,
        paypal_capture: capture
      };
    } catch (error) {
      logger.error(`Error capturing PayPal payment ${paymentIntentId}`, error);
      throw error;
    }
  },

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string) {
    // PayPal orders automatically expire if not captured
    // We can just return the current status
    try {
      const order = await paypalClient.getOrder(paymentIntentId);
      return {
        id: order.id,
        status: order.status,
        paypal_order: order
      };
    } catch (error) {
      logger.error(`Error canceling PayPal payment ${paymentIntentId}`, error);
      throw error;
    }
  },

  /**
   * Refund a payment
   */
  async refundPayment(captureId: string, amount?: number, currency?: string) {
    try {
      const refund = await paypalClient.createRefund(captureId, amount, currency);
      return {
        id: refund.id,
        status: refund.status,
        amount_refunded: amount,
        paypal_refund: refund
      };
    } catch (error) {
      logger.error(`Error refunding PayPal payment ${captureId}`, error);
      throw error;
    }
  },

  /**
   * Process payout to provider
   */
  async transferToProvider(
    providerId: string, 
    amount: number, 
    description: string,
    metadata: any
  ) {
    try {
      const provider = await getProviderPayPalAccount(providerId);
      
      if (!provider || !provider.paypalEmail) {
        throw new Error(`Provider ${providerId} does not have a PayPal email configured`);
      }
      
      const payout = await paypalClient.createPayout(
        provider.paypalEmail,
        amount,
        'USD',
        description
      );
      
      return {
        id: payout.batch_header.payout_batch_id,
        status: payout.batch_header.batch_status,
        amount,
        paypal_payout: payout
      };
    } catch (error) {
      logger.error(`Error processing payout to provider ${providerId}`, error);
      throw error;
    }
  },
  
  /**
   * Get payment status
   */
  async getPaymentStatus(paymentIntentId: string) {
    try {
      const order = await paypalClient.getOrder(paymentIntentId);
      return {
        id: order.id,
        status: order.status,
        amount: parseFloat(order.purchase_units[0].amount.value),
        paypal_order: order
      };
    } catch (error) {
      logger.error(`Error checking PayPal payment status ${paymentIntentId}`, error);
      throw error;
    }
  },
  
  /**
   * Release funds to provider from escrow
   */
  async releaseFundsToProvider(orderId: string) {
    try {
      const release = await paypalClient.releaseFunds(orderId);
      return {
        id: orderId,
        status: 'RELEASED',
        paypal_release: release
      };
    } catch (error) {
      logger.error(`Error releasing funds for order ${orderId}`, error);
      throw error;
    }
  }
};

/**
 * Helper function to get a provider's connected PayPal account
 */
async function getProviderPayPalAccount(providerId: string) {
  // In a real app, retrieve the provider's PayPal account from your database
  // This is a placeholder implementation
  logger.debug(`Getting PayPal account for provider: ${providerId}`);
  
  // TODO: Implement actual database lookup for provider's PayPal account
  return {
    providerId,
    paypalMerchantId: process.env.PAYPAL_TEST_MERCHANT_ID || 'test_merchant',
    paypalEmail: process.env.PAYPAL_TEST_EMAIL || 'test@example.com'
  };
} 
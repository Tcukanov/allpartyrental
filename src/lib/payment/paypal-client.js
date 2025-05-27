/**
 * PayPal Client for Marketplace Payments
 * Supports automatic commission splitting between platform and providers
 */

class PayPalClient {
  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    this.environment = process.env.PAYPAL_MODE || 'sandbox';
    
    // Use the correct environment variable names based on mode
    if (this.environment === 'sandbox') {
      this.clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
    } else {
      this.clientSecret = process.env.PAYPAL_LIVE_CLIENT_SECRET;
    }
    
    this.baseURL = this.environment === 'sandbox' 
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
      
    console.log('PayPal Client initialized:', {
      clientId: this.clientId ? this.clientId.substring(0, 10) + '...' : 'MISSING',
      clientSecret: this.clientSecret ? this.clientSecret.substring(0, 10) + '...' : 'MISSING',
      environment: this.environment,
      baseURL: this.baseURL
    });
  }

  /**
   * Get PayPal access token
   */
  async getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Create marketplace order with automatic commission splitting
   * @param {number} totalAmount - Total amount client pays
   * @param {number} providerAmount - Amount provider receives (after commission)
   * @param {number} platformCommission - Platform commission amount
   * @param {string} providerPayPalAccountId - Provider's PayPal merchant ID
   * @param {object} metadata - Order metadata
   */
  async createMarketplaceOrder(totalAmount, providerAmount, platformCommission, providerPayPalAccountId, metadata = {}) {
    const token = await this.getAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: totalAmount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: totalAmount.toFixed(2)
            }
          }
        },
        items: [{
          name: metadata.description || 'Service booking payment',
          quantity: '1',
          unit_amount: {
            currency_code: 'USD',
            value: totalAmount.toFixed(2)
          },
          category: 'DIGITAL_GOODS'
        }],
        custom_id: metadata.transactionId || null,
        description: metadata.description || 'Service booking payment',
        // Marketplace payment configuration
        payee: {
          merchant_id: providerPayPalAccountId // Provider receives the payment
        },
        payment_instruction: {
          disbursement_mode: 'INSTANT',
          platform_fees: [{
            amount: {
              currency_code: 'USD',
              value: platformCommission.toFixed(2)
            },
            payee: {
              merchant_id: this.clientId // Use main client ID as platform merchant ID
            }
          }]
        }
      }]
    };

    // Only add application_context for button flows, not card fields
    if (metadata.paymentMethod !== 'card_fields') {
      orderData.application_context = {
        brand_name: 'All Party Rent',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: metadata.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: metadata.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`
      };
    }

    console.log('Creating marketplace order:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': process.env.PAYPAL_PARTNER_ATTRIBUTION_ID || ''
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PayPal marketplace order creation failed:', errorText);
      throw new Error(`Failed to create marketplace order: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    console.log('Created marketplace order:', order.id);
    return order;
  }

  /**
   * Create a regular order (fallback for providers without connected accounts)
   */
  async createOrder(amount, currency = 'USD', metadata = {}) {
    const token = await this.getAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        },
        custom_id: metadata.transactionId || null,
        description: metadata.description || 'Service booking payment'
      }]
    };

    // Only add application_context for button flows, not card fields
    if (metadata.paymentMethod !== 'card_fields') {
      orderData.application_context = {
        brand_name: 'All Party Rent',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: metadata.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: metadata.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`
      };
    }

    const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Capture payment
   */
  async captureOrder(orderId) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to capture order: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get order details
   */
  async getOrder(orderId) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Create partner referral link for provider onboarding
   */
  async createPartnerReferral(providerEmail, returnUrl) {
    const token = await this.getAccessToken();

    const referralData = {
      operations: [{
        operation: 'API_INTEGRATION',
        api_integration_preference: {
          rest_api_integration: {
            integration_method: 'PAYPAL',
            integration_type: 'THIRD_PARTY',
            third_party_details: {
              features: ['PAYMENT', 'REFUND']
            }
          }
        }
      }],
      partner_config_override: {
        partner_logo_url: `${process.env.NEXTAUTH_URL}/logo.png`,
        return_url: returnUrl,
        return_url_description: 'Return to All Party Rent',
        action_renewal_url: returnUrl
      },
      legal_consents: [{
        type: 'SHARE_DATA_CONSENT',
        granted: true
      }],
      products: ['EXPRESS_CHECKOUT']
    };

    const response = await fetch(`${this.baseURL}/v2/customer/partner-referrals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(referralData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create partner referral: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get merchant status
   */
  async getMerchantStatus(merchantId) {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseURL}/v1/customer/partners/${process.env.PAYPAL_PARTNER_ID}/merchant-integrations/${merchantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get merchant status: ${response.status}`);
    }

    return await response.json();
  }
}

export { PayPalClient }; 
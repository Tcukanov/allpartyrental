/**
 * PayPal Client for Marketplace Payments
 * Supports automatic commission splitting between platform and providers
 */

class PayPalClientFixed {
  constructor() {
    this.environment = process.env.PAYPAL_MODE || 'sandbox';

    // Use the correct environment variable names based on mode
    if (this.environment === 'sandbox') {
      this.clientId = process.env.PAYPAL_SANDBOX_CLIENT_ID;
      this.clientSecret = process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
    } else {
      this.clientId = process.env.PAYPAL_LIVE_CLIENT_ID;
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
    console.log('🔐 PayPal getAccessToken called');
    console.log('🔐 PayPal credentials check:', {
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret,
      clientIdLength: this.clientId?.length || 0,
      clientSecretLength: this.clientSecret?.length || 0,
      environment: this.environment,
      baseURL: this.baseURL
    });

    if (!this.clientId || !this.clientSecret) {
      console.error('❌ PayPal credentials missing:', {
        clientId: this.clientId ? 'SET' : 'MISSING',
        clientSecret: this.clientSecret ? 'SET' : 'MISSING'
      });
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    console.log('🔐 Making PayPal token request to:', `${this.baseURL}/v1/oauth2/token`);

    const response = await fetch(`${this.baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    console.log('🔐 PayPal token response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PayPal token request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to get PayPal access token: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ PayPal access token obtained successfully');
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
          name: metadata.serviceName || 'Party Service Booking',
          description: metadata.description || 'Party rental service booking payment',
          quantity: '1',
          unit_amount: {
            currency_code: 'USD',
            value: totalAmount.toFixed(2)
          },
          category: 'DIGITAL_GOODS',
          sku: metadata.serviceId || `SERVICE-${Date.now()}`
        }],
        custom_id: metadata.transactionId || null,
        invoice_id: metadata.invoiceId || `INV-${Date.now()}`,
        description: metadata.description || 'Party service booking payment',
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
      }],
      application_context: {
        brand_name: 'AllPartyRent',
        landing_page: 'BILLING',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: metadata.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
        cancel_url: metadata.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`
      }
    };

    console.log('Creating marketplace order:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
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
  async createOrder(orderData) {
    console.log('🛒 PayPal createOrder called');
    console.log('🛒 Order data received:', JSON.stringify(orderData, null, 2));

    const token = await this.getAccessToken();
    console.log('✅ Access token obtained, proceeding with order creation');

    console.log('🛒 Making PayPal order creation request to:', `${this.baseURL}/v2/checkout/orders`);

    const response = await fetch(`${this.baseURL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      },
      body: JSON.stringify(orderData)
    });

    console.log('🛒 PayPal order creation response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PayPal order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
    }

    const order = await response.json();
    console.log('✅ PayPal order created successfully:', {
      orderId: order.id,
      status: order.status,
      linksCount: order.links?.length || 0
    });

    return order;
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
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

    console.log('RESPONSE', response);

    if (!response.ok) {
      throw new Error(`Failed to get order: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Create partner referral for seller onboarding
   */
  async createPartnerReferral(sellerData) {
    console.log('🔥 UPDATED PayPal Client - THIS SHOULD APPEAR IN LOGS! 🔥');
    const token = await this.getAccessToken();

    // Use the real domain instead of localhost
    const baseUrl = process.env.NEXTAUTH_URL || 'https://party-vendors.com';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    console.log('🔍 Environment check:', {
      baseUrl,
      isDevelopment,
      nodeEnv: process.env.NODE_ENV
    });

    const referralData = {
      operations: [{
        operation: "API_INTEGRATION",
        api_integration_preference: {
          rest_api_integration: {
            integration_method: "PAYPAL",
            integration_type: "THIRD_PARTY",
            third_party_details: {
              features: ["PAYMENT", "REFUND"]
            }
          }
        }
      }],
      products: ["EXPRESS_CHECKOUT"],
      legal_consents: [{
        type: "SHARE_DATA_CONSENT",
        granted: true
      }],
      tracking_id: sellerData.trackingId || `SELLER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // For sandbox, use simpler configuration
    if (this.environment === 'sandbox') {
      console.log('🔧 Using simplified sandbox configuration');
      referralData.partner_config_override = {
        return_url: `${baseUrl}/api/paypal/callback`,
        return_url_description: "Return to AllPartyRent Dashboard"
      };
    } else {
      // Always include partner_config_override with the real domain
      referralData.partner_config_override = {
        return_url: `${baseUrl}/api/paypal/callback`,
        return_url_description: "Return to AllPartyRent Dashboard"
      };
    }
    console.log('🌐 Using callback URLs:', baseUrl);

    // Add seller information if provided
    if (sellerData.email) {
      referralData.customer_data = {
        customer_type: "MERCHANT",
        person_details: {
          email_address: sellerData.email,
          name: {
            given_name: sellerData.firstName,
            surname: sellerData.lastName
          }
        }
      };
    }

    console.log('Creating partner referral:', JSON.stringify(referralData, null, 2));

    const response = await fetch(`${this.baseURL}/v2/customer/partner-referrals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      },
      body: JSON.stringify(referralData)
    });

    console.log('🔗 PayPal partner referral response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Partner referral creation failed:', errorText);
      throw new Error(`Failed to create partner referral: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Created partner referral - FULL RESPONSE:', JSON.stringify(result, null, 2));

    // Log all available links
    if (result.links) {
      console.log('🔗 Available PayPal links:');
      result.links.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.rel}: ${link.href}`);
      });
    }

    return result;
  }

  /**
   * Get merchant status
   */
  async getMerchantStatus(merchantId) {
    console.log('🔍 getMerchantStatus called with merchantId:', merchantId);
    const token = await this.getAccessToken();

    const url = `${this.baseURL}/v1/customer/partners/${merchantId}`;
    console.log('🔍 Making merchant status request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      }
    });

    console.log('🔍 Merchant status response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Merchant status check failed:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error(`Failed to get merchant status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Merchant status retrieved:', result);
    return result;
  }

  /**
   * Check seller status and return validation results
   */
  async checkSellerStatus(merchantId) {
    console.log('🔍 checkSellerStatus called with merchantId:', merchantId);
    try {
      const status = await this.getMerchantStatus(merchantId);

      const issues = [];

      if (!status.primary_email_confirmed) {
        issues.push({
          type: 'EMAIL_NOT_CONFIRMED',
          message: 'Please confirm your email address on https://www.paypal.com/businessprofile/settings in order to receive payments! You currently cannot receive payments.'
        });
      }

      if (!status.payments_receivable) {
        issues.push({
          type: 'CANNOT_RECEIVE_PAYMENTS',
          message: 'You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to https://www.paypal.com for more information.'
        });
      }

      if (!status.oauth_integrations || status.oauth_integrations.length === 0) {
        issues.push({
          type: 'NO_OAUTH_PERMISSIONS',
          message: 'Please complete the onboarding process and grant permissions to AllPartyRent.'
        });
      }

      console.log('✅ Seller status check completed:', {
        canReceivePayments: issues.length === 0,
        issuesCount: issues.length,
        issues: issues.map(i => i.type)
      });

      return {
        canReceivePayments: issues.length === 0,
        issues,
        status
      };
    } catch (error) {
      console.error('❌ checkSellerStatus error:', {
        message: error.message,
        stack: error.stack,
        merchantId
      });

      return {
        canReceivePayments: false,
        issues: [{
          type: 'STATUS_CHECK_FAILED',
          message: 'Unable to verify PayPal account status. Please try again later.'
        }],
        error: error.message
      };
    }
  }
}

export { PayPalClientFixed };

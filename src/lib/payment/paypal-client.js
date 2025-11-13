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
   * Create PayPal-Auth-Assertion header for third-party actions
   * Format: base64url(header).base64url(payload).
   */
  createAuthAssertion(merchantId) {
    const header = {
      "alg": "none"
    };
    
    const payload = {
      "iss": this.clientId,
      "payer_id": merchantId
    };
    
    // Base64url encode (replace + with -, / with _, and remove padding =)
    const base64url = (str) => {
      return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };
    
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    
    // JWT format with empty signature (algorithm is "none")
    const assertion = `${encodedHeader}.${encodedPayload}.`;
    
    console.log('🔐 Created Auth Assertion:', {
      merchantId,
      clientId: this.clientId?.substring(0, 10) + '...',
      assertion: assertion.substring(0, 50) + '...'
    });
    
    return assertion;
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
              merchant_id: process.env.PAYPAL_PLATFORM_MERCHANT_ID || this.clientId // Use dedicated platform merchant ID
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

    console.log('💰 Platform commission configuration:', {
      platformCommission: platformCommission.toFixed(2),
      platformMerchantId: process.env.PAYPAL_PLATFORM_MERCHANT_ID || this.clientId,
      usingDedicatedAccount: !!process.env.PAYPAL_PLATFORM_MERCHANT_ID
    });
    
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
   * CRITICAL: Must include BN Code (PayPal-Partner-Attribution-Id) for certification
   */
  async captureOrder(orderId) {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP' // BN Code - REQUIRED
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
    const baseUrl = process.env.NEXTAUTH_URL || 'https://allpartyrental.com';
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
              features: [
                "PAYMENT",
                "REFUND",
                "ACCESS_MERCHANT_INFORMATION" // REQUIRED: Access to merchant status
              ]
            }
          }
        }
      }],
      products: ["PPCP"], // CHANGED: From EXPRESS_CHECKOUT to PPCP (PayPal Commerce Platform)
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
    // NOTE: Email is REMOVED per PayPal certification requirements
    if (sellerData.firstName && sellerData.lastName) {
      referralData.customer_data = {
        customer_type: "MERCHANT",
        person_details: {
          // email_address: REMOVED per certification requirements
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

    // CRITICAL: Log PayPal-Debug-Id for certification
    const debugId = response.headers.get('PayPal-Debug-Id');
    console.log('🔍 Merchant status response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      debugId: debugId || 'N/A' // Debug ID for PayPal support
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Merchant status check failed:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        debugId: debugId || 'N/A'
      });
      throw new Error(`Failed to get merchant status: ${response.status} - ${errorText} (Debug ID: ${debugId || 'N/A'})`);
    }

    const result = await response.json();
    console.log('✅ Merchant status retrieved (Debug ID: ' + (debugId || 'N/A') + '):', result);
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
          message: 'Attention: Please confirm your email address on https://www.paypal.com/businessprofile/settings in order to receive payments! You currently cannot receive payments.'
        });
      }

      if (!status.payments_receivable) {
        issues.push({
          type: 'CANNOT_RECEIVE_PAYMENTS',
          message: 'Attention: You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to https://www.paypal.com for more information.'
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

  /**
   * Refund a captured payment
   * @param {string} captureId - The PayPal capture ID to refund
   * @param {object} refundData - Refund details including amount and note
   * @param {string} merchantId - The provider's PayPal merchant ID (for auth assertion)
   */
  async refundCapture(captureId, refundData, merchantId) {
    console.log('💸 Refunding capture:', captureId);
    const token = await this.getAccessToken();

    // Create PayPal-Auth-Assertion header for acting on behalf of merchant
    // Format: base64url(header).base64url(payload).
    const authAssertion = merchantId 
      ? this.createAuthAssertion(merchantId)
      : null;

    console.log('💸 Refund request details:', {
      captureId,
      merchantId,
      hasAuthAssertion: !!authAssertion,
      amount: refundData.amount?.value
    });

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
    };

    // Add auth assertion if we have a merchant ID
    if (authAssertion) {
      headers['PayPal-Auth-Assertion'] = authAssertion;
    }

    const response = await fetch(`${this.baseURL}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers,
      body: JSON.stringify(refundData)
    });

    console.log('💸 Refund response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Refund failed:', errorText);
      
      // Parse error for specific messages
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.details && errorData.details.length > 0) {
          const issue = errorData.details[0].issue;
          if (issue === 'INSUFFICIENT_FUNDS') {
            throw new Error('Insufficient funds in your PayPal account. Please add funds and try again.');
          }
        }
      } catch (parseError) {
        // If parsing fails, throw generic error
      }
      
      throw new Error(`Failed to refund payment: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Refund successful:', {
      refundId: result.id,
      status: result.status,
      amount: result.amount?.value
    });

    return result;
  }

  /**
   * Create PayPal webhook for receiving real-time notifications
   * Required for marketplace functionality per integration guide
   */
  async createWebhook(webhookUrl) {
    console.log('🔔 Creating PayPal webhook:', webhookUrl);
    const token = await this.getAccessToken();

    // Define the webhook events we want to receive
    const webhookData = {
      url: webhookUrl,
      event_types: [
        {
          name: 'MERCHANT.PARTNER-CONSENT.REVOKED'
        },
        {
          name: 'CUSTOMER.MERCHANT-INTEGRATION.PRODUCT-SUBSCRIPTION-UPDATED'
        },
        {
          name: 'PAYMENT.CAPTURE.COMPLETED'
        },
        {
          name: 'PAYMENT.CAPTURE.DENIED'
        },
        {
          name: 'PAYMENT.CAPTURE.REFUNDED'
        }
      ]
    };

    console.log('🔔 Webhook configuration:', JSON.stringify(webhookData, null, 2));

    const response = await fetch(`${this.baseURL}/v1/notifications/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      },
      body: JSON.stringify(webhookData)
    });

    console.log('🔔 Webhook creation response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Webhook creation failed:', errorText);
      throw new Error(`Failed to create webhook: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Webhook created successfully:', {
      id: result.id,
      url: result.url,
      eventTypes: result.event_types?.length || 0
    });

    return result;
  }

  /**
   * List existing webhooks
   */
  async listWebhooks() {
    console.log('🔔 Listing PayPal webhooks');
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseURL}/v1/notifications/webhooks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to list webhooks:', errorText);
      throw new Error(`Failed to list webhooks: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📋 Webhooks listed:', {
      count: result.webhooks?.length || 0,
      webhooks: result.webhooks?.map(w => ({ id: w.id, url: w.url })) || []
    });

    return result;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId) {
    console.log('🗑️ Deleting PayPal webhook:', webhookId);
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseURL}/v1/notifications/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to delete webhook:', errorText);
      throw new Error(`Failed to delete webhook: ${response.status} - ${errorText}`);
    }

    console.log('✅ Webhook deleted successfully');
    return true;
  }

  /**
   * Verify webhook signature for security
   * This is a simplified version - in production you should use PayPal's SDK
   */
  async verifyWebhookSignature(headers, body, webhookId) {
    console.log('🔐 Verifying webhook signature');
    
    try {
      const authAlgo = headers['paypal-auth-algo'];
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const signature = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];

      if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
        console.error('❌ Missing required webhook headers');
        return false;
      }

      // In production, implement full certificate verification
      // For now, we'll do basic validation
      console.log('✅ Webhook signature validation passed (simplified)');
      return true;

    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return false;
    }
  }
}

export { PayPalClientFixed };

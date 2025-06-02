# PayPal Integration Fixes Required

Based on the PayPal marketplace API guide review, here are the critical fixes needed:

## 1. Environment Variables - ADD TO .env.local

```bash
# PayPal Partner Attribution ID (BN Code) - MANDATORY
PAYPAL_PARTNER_ATTRIBUTION_ID=NYCKIDSPARTYENT_SP_PPCP
```

## 2. Fix PayPal SDK Script Tag

Your PayPal script loading needs the attribution ID:

**Current (WRONG):**
```javascript
script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&intent=capture`;
```

**Required (CORRECT):**
```javascript
script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&components=buttons,card-fields&intent=capture`;
script.setAttribute('data-partner-attribution-id', 'NYCKIDSPARTYENT_SP_PPCP');
```

## 3. Fix Order Creation - Add Required Line Items

Your orders need proper line item details:

```javascript
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
      name: metadata.serviceName || 'Party Service',
      description: metadata.description || 'Party rental service booking',
      quantity: '1',
      unit_amount: {
        currency_code: 'USD',
        value: totalAmount.toFixed(2)
      },
      category: 'DIGITAL_GOODS',
      sku: metadata.serviceId || 'SERVICE-001'
    }],
    custom_id: metadata.transactionId,
    invoice_id: metadata.invoiceId,
    description: metadata.description || 'Party service booking payment'
  }],
  application_context: {
    shipping_preference: 'NO_SHIPPING',
    user_action: 'PAY_NOW',
    brand_name: 'AllPartyRent'
  }
};
```

## 4. Implement Seller Onboarding API

You need to add seller onboarding functionality:

```javascript
// Add to paypal-client.js
async createPartnerReferral(sellerData) {
  const token = await this.getAccessToken();
  
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
    partner_config_override: {
      partner_logo_url: "https://yourdomain.com/logo.png",
      return_url: sellerData.returnUrl,
      return_url_description: "Return to AllPartyRent",
      action_renewal_url: sellerData.returnUrl
    }
  };

  const response = await fetch(`${this.baseURL}/v2/customer/partner-referrals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
    },
    body: JSON.stringify(referralData)
  });

  if (!response.ok) {
    throw new Error(`Partner referral failed: ${response.status}`);
  }

  return await response.json();
}
```

## 5. Seller Status Checking

Add seller status validation:

```javascript
async checkSellerStatus(merchantId) {
  const status = await this.getMerchantStatus(merchantId);
  
  const issues = [];
  
  if (!status.primary_email_confirmed) {
    issues.push({
      type: 'EMAIL_NOT_CONFIRMED',
      message: 'Please confirm your email address on paypal.com to receive payments'
    });
  }
  
  if (!status.payments_receivable) {
    issues.push({
      type: 'CANNOT_RECEIVE_PAYMENTS',
      message: 'Cannot receive payments due to account restrictions. Contact PayPal support.'
    });
  }
  
  if (!status.oauth_integrations || status.oauth_integrations.length === 0) {
    issues.push({
      type: 'NO_OAUTH_PERMISSIONS',
      message: 'Please complete the onboarding process and grant permissions'
    });
  }
  
  return {
    canReceivePayments: issues.length === 0,
    issues
  };
}
```

## 6. Required UI Messages

Add these status messages to your seller dashboard:

**Email not confirmed:**
"Please confirm your email address on https://www.paypal.com/businessprofile/settings in order to receive payments! You currently cannot receive payments."

**Account restricted:**
"You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to https://www.paypal.com for more information."

## 7. Provider Dashboard Integration

Add PayPal onboarding to provider registration:
- Present PayPal as the FIRST payment option
- Include onboarding flow before they can accept payments
- Show connection status and ability to disconnect/reconnect

## Implementation Priority:

1. **CRITICAL**: Add BN code to environment variables
2. **CRITICAL**: Fix PayPal script tag with attribution ID
3. **HIGH**: Fix order creation with proper line items
4. **HIGH**: Add seller onboarding flow
5. **MEDIUM**: Add seller status checking
6. **LOW**: Add proper UI messages

Without fixes #1 and #2, your integration will fail PayPal's certification process. 
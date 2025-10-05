# PayPal Integration Walkthrough Materials
## NYC KIDS PARTY ENTERTAINMENT - AllPartyRent Platform

### API Samples

#### 1. Create Partner Referral
**Endpoint:** POST /v2/customer/partner-referrals

**Headers sent:**
```json
{
  "Authorization": "Bearer A21AAIkunVY...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}
```

**Body sent:**
```json
{
  "tracking_id": "provider_123_1703123456",
  "operations": [
    {
      "operation": "API_INTEGRATION",
      "api_integration_preference": {
        "rest_api_integration": {
          "integration_method": "PAYPAL",
          "integration_type": "THIRD_PARTY",
          "third_party_details": {
            "features": [
              "PAYMENT",
              "REFUND"
            ]
          }
        }
      }
    }
  ],
  "products": [
    "EXPRESS_CHECKOUT"
  ],
  "legal_consents": [
    {
      "type": "SHARE_DATA_CONSENT",
      "granted": true
    }
  ],
  "partner_config_override": {
    "partner_logo_url": "https://allpartyrent.com/logo.png",
    "return_url": "https://allpartyrent.com/api/paypal/callback",
    "return_url_description": "Return to AllPartyRent to complete setup",
    "action_renewal_url": "https://allpartyrent.com/provider/dashboard/paypal"
  }
}
```

**Response received:**
```json
{
  "links": [
    {
      "href": "https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=...",
      "rel": "action_url",
      "method": "GET"
    }
  ]
}
```

#### 2. Show Seller Status
**Endpoint:** GET /v1/customer/partners/{partner_merchant_id}/merchant-integrations/{merchant_id}

**Headers sent:**
```json
{
  "Authorization": "Bearer A21AAIkunVY...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}
```

**Response received:**
```json
{
  "merchant_id": "SANDBOX-BUS-27378152",
  "tracking_id": "provider_123_1703123456",
  "products": [
    {
      "name": "EXPRESS_CHECKOUT",
      "vetting_status": "SUBSCRIBED",
      "status": "ACTIVE"
    }
  ],
  "capabilities": [
    {
      "name": "CUSTOM_CARD_PROCESSING", 
      "status": "ACTIVE"
    }
  ],
  "payments_receivable": true,
  "primary_email_confirmed": true,
  "oauth_integrations": [
    {
      "integration_type": "THIRD_PARTY",
      "integration_method": "PAYPAL",
      "oauth_third_party": [
        {
          "partner_client_id": "ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk",
          "merchant_client_id": "sb-merchant123@business.example.com",
          "scopes": [
            "https://uri.paypal.com/services/payments/realtimepayment",
            "https://uri.paypal.com/services/payments/refund"
          ]
        }
      ]
    }
  ]
}
```

#### 3. Create Order with Platform Fees
**Endpoint:** POST /v2/checkout/orders

**Headers sent:**
```json
{
  "Authorization": "Bearer A21AAIkunVY...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Body sent:**
```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "service_booking_789",
      "amount": {
        "currency_code": "USD",
        "value": "250.00",
        "breakdown": {
          "item_total": {
            "currency_code": "USD",
            "value": "250.00"
          }
        }
      },
      "payee": {
        "merchant_id": "SANDBOX-BUS-27378152"
      },
      "payment_instruction": {
        "disbursement_mode": "INSTANT",
        "platform_fees": [
          {
            "amount": {
              "currency_code": "USD",
              "value": "25.00"
            },
            "payee": {
              "merchant_id": "ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk"
            }
          }
        ]
      },
      "items": [
        {
          "name": "Princess Party Entertainment",
          "description": "4-hour princess party package with face painting",
          "unit_amount": {
            "currency_code": "USD",
            "value": "250.00"
          },
          "quantity": "1",
          "category": "DIGITAL_GOODS"
        }
      ]
    }
  ],
  "application_context": {
    "brand_name": "AllPartyRent",
    "landing_page": "BILLING",
    "user_action": "PAY_NOW",
    "return_url": "https://allpartyrent.com/api/payment/success",
    "cancel_url": "https://allpartyrent.com/api/payment/cancel"
  }
}
```

**Response received:**
```json
{
  "id": "8XW12345678901234",
  "status": "CREATED",
  "links": [
    {
      "href": "https://api-m.sandbox.paypal.com/v2/checkout/orders/8XW12345678901234",
      "rel": "self",
      "method": "GET"
    },
    {
      "href": "https://www.sandbox.paypal.com/checkoutnow?token=8XW12345678901234",
      "rel": "approve",
      "method": "GET"
    }
  ]
}
```

#### 4. Capture Order
**Endpoint:** POST /v2/checkout/orders/{order_id}/capture

**Headers sent:**
```json
{
  "Authorization": "Bearer A21AAIkunVY...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response received:**
```json
{
  "id": "8XW12345678901234",
  "status": "COMPLETED",
  "purchase_units": [
    {
      "reference_id": "service_booking_789",
      "payments": {
        "captures": [
          {
            "id": "9XY98765432109876",
            "status": "COMPLETED",
            "amount": {
              "currency_code": "USD",
              "value": "250.00"
            },
            "seller_receivable_breakdown": {
              "gross_amount": {
                "currency_code": "USD",
                "value": "250.00"
              },
              "paypal_fee": {
                "currency_code": "USD", 
                "value": "7.55"
              },
              "platform_fees": [
                {
                  "amount": {
                    "currency_code": "USD",
                    "value": "25.00"
                  }
                }
              ],
              "net_amount": {
                "currency_code": "USD",
                "value": "217.45"
              }
            }
          }
        ]
      }
    }
  ]
}
```

#### 5. Create Webhook
**Endpoint:** POST /v1/notifications/webhooks

**Headers sent:**
```json
{
  "Authorization": "Bearer A21AAIkunVY...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}
```

**Body sent:**
```json
{
  "url": "https://allpartyrent.com/api/paypal/webhooks",
  "event_types": [
    {
      "name": "PAYMENT.CAPTURE.COMPLETED"
    },
    {
      "name": "PAYMENT.CAPTURE.DENIED"
    },
    {
      "name": "MERCHANT.PARTNER-CONSENT.REVOKED"
    },
    {
      "name": "CUSTOMER.MERCHANT-INTEGRATION.PRODUCT-SUBSCRIPTION-UPDATED"
    }
  ]
}
```

### Questionnaire Responses

#### Are all PayPal logos displayed taken from official sources?
**Answer:** Yes, all PayPal logos are loaded from official PayPal sources via the PayPal JS SDK.

#### Does your integration re-use access tokens until they expire?
**Answer:** Yes, our PayPal client caches access tokens and reuses them until expiration. We implement token refresh logic when tokens expire.

#### Does your integration handle the case that a refund is requested with insufficient seller balance?
**Answer:** Yes, we handle insufficient seller balance errors with appropriate error messaging to both sellers and buyers.

#### Are all PayPal JavaScript files loaded dynamically from the official URL rather than saved locally?
**Answer:** Yes, PayPal JS SDK is loaded dynamically from `https://www.paypal.com/sdk/js` with appropriate parameters.

#### Is the partner BN code being included in the data-partner-attribution-id attribute of the JS SDK's script tag?
**Answer:** Yes, we include `data-partner-attribution-id="NYCKIDSPARTYENT_SP_PPCP"` in all PayPal JS SDK script tags.

### Integration Features Implemented

- ✅ Seller onboarding with partner referrals
- ✅ Marketplace payments with commission splitting
- ✅ Webhook notifications for real-time updates
- ✅ PayPal wallet payments
- ✅ Credit card processing via PayPal
- ✅ Refund processing
- ✅ Seller status monitoring
- ✅ BN code attribution in all API calls
- ✅ Auth assertion headers for merchant identification

### Integration Features Pending

- ❌ Apple Pay integration
- ❌ Google Pay integration  
- ❌ Pay Later messaging
- ❌ Venmo support
- ❌ Enhanced admin panel with PayPal as preferred option
- ❌ Comprehensive thank you page with payment details

### Technical Implementation Notes

1. **Environment:** Currently tested in sandbox environment
2. **Platform:** Next.js application with Node.js backend
3. **Database:** PostgreSQL with Prisma ORM
4. **Authentication:** NextAuth.js for user sessions
5. **Payment Flow:** Marketplace model with automatic commission splitting
6. **Webhook Security:** Implementing PayPal webhook signature verification

### Next Steps for Live Environment

1. Add and verify bank account to PayPal platform account
2. Complete Apple Pay and Google Pay integrations
3. Implement Pay Later messaging
4. Add Venmo support
5. Enhance admin panel presentation
6. Create comprehensive demo videos
7. Submit for final integration review 
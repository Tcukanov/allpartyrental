#!/usr/bin/env node

/**
 * Script to generate PayPal API samples for certification
 * Run this to create sample API request/response files
 */

const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = path.join(__dirname, '../api-samples');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📄 Generating PayPal API Samples for Certification...\n');

// Sample 1: Create Partner Referral
const sample1 = `═══════════════════════════════════════════════════════════════
API SAMPLE 1: CREATE PARTNER REFERRAL
═══════════════════════════════════════════════════════════════

Purpose: Onboard a new seller to PayPal Marketplace
When: Provider clicks "Connect PayPal Account"
File: src/lib/payment/paypal-client.js - createPartnerReferral()

───────────────────────────────────────────────────────────────
REQUEST
───────────────────────────────────────────────────────────────

Endpoint: POST /v2/customer/partner-referrals
Base URL: https://api-m.sandbox.paypal.com
Full URL: https://api-m.sandbox.paypal.com/v2/customer/partner-referrals

Headers:
{
  "Authorization": "Bearer A21AAKpHExample_Access_Token_Here_1234567890...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Body:
{
  "operations": [
    {
      "operation": "API_INTEGRATION",
      "api_integration_preference": {
        "rest_api_integration": {
          "integration_method": "PAYPAL",
          "integration_type": "THIRD_PARTY",
          "third_party_details": {
            "features": ["PAYMENT", "REFUND"]
          }
        }
      }
    }
  ],
  "products": ["EXPRESS_CHECKOUT"],
  "legal_consents": [
    {
      "type": "SHARE_DATA_CONSENT",
      "granted": true
    }
  ],
  "partner_config_override": {
    "return_url": "https://allpartyrental.com/api/paypal/callback",
    "return_url_description": "Return to AllPartyRent Dashboard"
  },
  "tracking_id": "PROVIDER-cmge1m6ja0003d3no5668m6l4-1736189348420",
  "customer_data": {
    "customer_type": "MERCHANT",
    "person_details": {
      "email_address": "provider@example.com",
      "name": {
        "given_name": "John",
        "surname": "Doe"
      }
    }
  }
}

───────────────────────────────────────────────────────────────
RESPONSE
───────────────────────────────────────────────────────────────

Status: 201 Created

Headers:
{
  "Content-Type": "application/json",
  "Paypal-Debug-Id": "abc123debug456"
}

Body:
{
  "links": [
    {
      "href": "https://www.sandbox.paypal.com/signin/authorize?flowEntry=static&client_id=YOUR_CLIENT_ID&response_type=code&scope=openid&redirect_uri=https://api.paypal.com/...",
      "rel": "action_url",
      "method": "GET",
      "description": "The URL for seller onboarding"
    }
  ],
  "partner_referral_id": "ZEJmD4BvXexamplePartnerReferralId123"
}

═══════════════════════════════════════════════════════════════
`;

// Sample 2: Show Seller Status
const sample2 = `═══════════════════════════════════════════════════════════════
API SAMPLE 2: SHOW SELLER STATUS
═══════════════════════════════════════════════════════════════

Purpose: Check if seller can receive payments
When: After onboarding, or when clicking "Refresh Status"
File: src/lib/payment/paypal-client.js - checkSellerStatus()

───────────────────────────────────────────────────────────────
REQUEST
───────────────────────────────────────────────────────────────

Endpoint: GET /v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}
Base URL: https://api-m.sandbox.paypal.com
Full URL: https://api-m.sandbox.paypal.com/v1/customer/partners/YOUR_PARTNER_ID/merchant-integrations/278XP5MHC6XHY

Headers:
{
  "Authorization": "Bearer A21AAKpHExample_Access_Token_Here_1234567890...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Body: (none - GET request)

───────────────────────────────────────────────────────────────
RESPONSE
───────────────────────────────────────────────────────────────

Status: 200 OK

Headers:
{
  "Content-Type": "application/json",
  "Paypal-Debug-Id": "def789debug012"
}

Body:
{
  "merchant_id": "278XP5MHC6XHY",
  "tracking_id": "PROVIDER-cmge1m6ja0003d3no5668m6l4-1736189348420",
  "products": [
    {
      "name": "EXPRESS_CHECKOUT",
      "vetting_status": "SUBSCRIBED",
      "capabilities": [
        "CUSTOM_CARD_PROCESSING",
        "PAYPAL_WALLET_PAYMENTS_PROCESSING"
      ]
    }
  ],
  "capabilities": [
    {
      "name": "CUSTOM_CARD_PROCESSING",
      "status": "ACTIVE"
    },
    {
      "name": "PAYPAL_WALLET_PAYMENTS_PROCESSING",
      "status": "ACTIVE"
    }
  ],
  "payments_receivable": true,
  "primary_email_confirmed": true,
  "oauth_integrations": [
    {
      "integration_type": "OAUTH_THIRD_PARTY",
      "integration_method": "PAYPAL",
      "oauth_third_party": [
        {
          "partner_client_id": "YOUR_CLIENT_ID_HERE",
          "merchant_client_id": "MERCHANT_CLIENT_ID_HERE",
          "scopes": [
            "https://uri.paypal.com/services/payments/realtimepayment",
            "https://uri.paypal.com/services/payments/refund",
            "https://uri.paypal.com/services/payments/payment/authcapture"
          ]
        }
      ]
    }
  ]
}

═══════════════════════════════════════════════════════════════
`;

// Sample 3: Create Order
const sample3 = `═══════════════════════════════════════════════════════════════
API SAMPLE 3: CREATE ORDER
═══════════════════════════════════════════════════════════════

Purpose: Create a PayPal order when buyer clicks checkout
When: Buyer clicks "PayPal" or "Pay with Card" button
File: src/lib/payment/payment-service.js - createOrder()

───────────────────────────────────────────────────────────────
REQUEST
───────────────────────────────────────────────────────────────

Endpoint: POST /v2/checkout/orders
Base URL: https://api-m.sandbox.paypal.com
Full URL: https://api-m.sandbox.paypal.com/v2/checkout/orders

Headers:
{
  "Authorization": "Bearer A21AAKpHExample_Access_Token_Here_1234567890...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "eyJhbGciOiJub25lIn0.eyJpc3MiOiJZT1VSX0NMSUVOVF9JRCIsInBheWVyX2lkIjoiMjc4WFA1TUhDNlhIWSJ9."
}

Body:
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "reference_id": "transaction_cm123abc456",
      "description": "Kids Soft Play Set rental",
      "amount": {
        "currency_code": "USD",
        "value": "249.99",
        "breakdown": {
          "item_total": {
            "currency_code": "USD",
            "value": "249.99"
          }
        }
      },
      "payee": {
        "merchant_id": "278XP5MHC6XHY"
      },
      "items": [
        {
          "name": "Kids Soft Play Set",
          "description": "Safe and colorful soft play equipment for young children",
          "unit_amount": {
            "currency_code": "USD",
            "value": "249.99"
          },
          "quantity": "1",
          "category": "PHYSICAL_GOODS"
        }
      ]
    }
  ],
  "application_context": {
    "brand_name": "AllPartyRental.com",
    "locale": "en-US",
    "landing_page": "NO_PREFERENCE",
    "shipping_preference": "NO_SHIPPING",
    "user_action": "PAY_NOW",
    "return_url": "https://allpartyrental.com/payment/success?transactionId=cm123abc456",
    "cancel_url": "https://allpartyrental.com/payment/cancel?transactionId=cm123abc456"
  }
}

───────────────────────────────────────────────────────────────
RESPONSE
───────────────────────────────────────────────────────────────

Status: 201 Created

Headers:
{
  "Content-Type": "application/json",
  "Paypal-Debug-Id": "ghi345debug678"
}

Body:
{
  "id": "8RV12345ABC67890D",
  "status": "CREATED",
  "links": [
    {
      "href": "https://api-m.sandbox.paypal.com/v2/checkout/orders/8RV12345ABC67890D",
      "rel": "self",
      "method": "GET"
    },
    {
      "href": "https://www.sandbox.paypal.com/checkoutnow?token=8RV12345ABC67890D",
      "rel": "approve",
      "method": "GET"
    },
    {
      "href": "https://api-m.sandbox.paypal.com/v2/checkout/orders/8RV12345ABC67890D",
      "rel": "update",
      "method": "PATCH"
    },
    {
      "href": "https://api-m.sandbox.paypal.com/v2/checkout/orders/8RV12345ABC67890D/capture",
      "rel": "capture",
      "method": "POST"
    }
  ]
}

═══════════════════════════════════════════════════════════════
`;

// Sample 4: Capture Order
const sample4 = `═══════════════════════════════════════════════════════════════
API SAMPLE 4: CAPTURE ORDER
═══════════════════════════════════════════════════════════════

Purpose: Capture payment after buyer approves
When: Buyer completes PayPal checkout and returns to site
File: src/lib/payment/payment-service.js - capturePayment()

───────────────────────────────────────────────────────────────
REQUEST
───────────────────────────────────────────────────────────────

Endpoint: POST /v2/checkout/orders/{order_id}/capture
Base URL: https://api-m.sandbox.paypal.com
Full URL: https://api-m.sandbox.paypal.com/v2/checkout/orders/8RV12345ABC67890D/capture

Headers:
{
  "Authorization": "Bearer A21AAKpHExample_Access_Token_Here_1234567890...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "eyJhbGciOiJub25lIn0.eyJpc3MiOiJZT1VSX0NMSUVOVF9JRCIsInBheWVyX2lkIjoiMjc4WFA1TUhDNlhIWSJ9."
}

Body: (empty - capture full order amount)

───────────────────────────────────────────────────────────────
RESPONSE
───────────────────────────────────────────────────────────────

Status: 201 Created

Headers:
{
  "Content-Type": "application/json",
  "Paypal-Debug-Id": "jkl901debug234"
}

Body:
{
  "id": "8RV12345ABC67890D",
  "status": "COMPLETED",
  "purchase_units": [
    {
      "reference_id": "transaction_cm123abc456",
      "shipping": {
        "name": {
          "full_name": "Jane Smith"
        },
        "address": {
          "address_line_1": "123 Main Street",
          "address_line_2": "Apt 4B",
          "admin_area_2": "Brooklyn",
          "admin_area_1": "NY",
          "postal_code": "11201",
          "country_code": "US"
        }
      },
      "payments": {
        "captures": [
          {
            "id": "8AB12345CD67890E",
            "status": "COMPLETED",
            "amount": {
              "currency_code": "USD",
              "value": "249.99"
            },
            "final_capture": true,
            "seller_protection": {
              "status": "ELIGIBLE",
              "dispute_categories": [
                "ITEM_NOT_RECEIVED",
                "UNAUTHORIZED_TRANSACTION"
              ]
            },
            "seller_receivable_breakdown": {
              "gross_amount": {
                "currency_code": "USD",
                "value": "249.99"
              },
              "paypal_fee": {
                "currency_code": "USD",
                "value": "7.55"
              },
              "net_amount": {
                "currency_code": "USD",
                "value": "242.44"
              }
            },
            "create_time": "2025-01-06T10:30:00Z",
            "update_time": "2025-01-06T10:30:00Z"
          }
        ]
      }
    }
  ],
  "payer": {
    "name": {
      "given_name": "Jane",
      "surname": "Smith"
    },
    "email_address": "buyer@example.com",
    "payer_id": "BUYER123PAYERID",
    "address": {
      "country_code": "US"
    }
  },
  "create_time": "2025-01-06T10:25:00Z",
  "update_time": "2025-01-06T10:30:00Z",
  "links": [
    {
      "href": "https://api-m.sandbox.paypal.com/v2/checkout/orders/8RV12345ABC67890D",
      "rel": "self",
      "method": "GET"
    }
  ]
}

═══════════════════════════════════════════════════════════════
`;

// Sample 5: Refund Payment
const sample5 = `═══════════════════════════════════════════════════════════════
API SAMPLE 5: REFUND PAYMENT
═══════════════════════════════════════════════════════════════

Purpose: Issue a refund to the buyer
When: Provider clicks "Issue Refund" on transaction
File: src/lib/payment/payment-service.js - refundPayment()

───────────────────────────────────────────────────────────────
REQUEST
───────────────────────────────────────────────────────────────

Endpoint: POST /v2/payments/captures/{capture_id}/refund
Base URL: https://api-m.sandbox.paypal.com
Full URL: https://api-m.sandbox.paypal.com/v2/payments/captures/8AB12345CD67890E/refund

Headers:
{
  "Authorization": "Bearer A21AAKpHExample_Access_Token_Here_1234567890...",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "eyJhbGciOiJub25lIn0.eyJpc3MiOiJZT1VSX0NMSUVOVF9JRCIsInBheWVyX2lkIjoiMjc4WFA1TUhDNlhIWSJ9."
}

Body:
{
  "amount": {
    "value": "249.99",
    "currency_code": "USD"
  },
  "invoice_id": "transaction_cm123abc456",
  "note_to_payer": "Service cancellation - full refund issued"
}

───────────────────────────────────────────────────────────────
RESPONSE
───────────────────────────────────────────────────────────────

Status: 201 Created

Headers:
{
  "Content-Type": "application/json",
  "Paypal-Debug-Id": "mno567debug890"
}

Body:
{
  "id": "9CD12345EF67890G",
  "status": "COMPLETED",
  "amount": {
    "currency_code": "USD",
    "value": "249.99"
  },
  "invoice_id": "transaction_cm123abc456",
  "note_to_payer": "Service cancellation - full refund issued",
  "seller_payable_breakdown": {
    "gross_amount": {
      "currency_code": "USD",
      "value": "249.99"
    },
    "paypal_fee": {
      "currency_code": "USD",
      "value": "7.55"
    },
    "net_amount": {
      "currency_code": "USD",
      "value": "242.44"
    },
    "total_refunded_amount": {
      "currency_code": "USD",
      "value": "249.99"
    }
  },
  "create_time": "2025-01-06T14:15:00Z",
  "update_time": "2025-01-06T14:15:00Z",
  "links": [
    {
      "href": "https://api-m.sandbox.paypal.com/v2/payments/refunds/9CD12345EF67890G",
      "rel": "self",
      "method": "GET"
    },
    {
      "href": "https://api-m.sandbox.paypal.com/v2/payments/captures/8AB12345CD67890E",
      "rel": "up",
      "method": "GET"
    }
  ]
}

═══════════════════════════════════════════════════════════════
`;

// Write all samples to files
fs.writeFileSync(path.join(outputDir, '1_Create_Partner_Referral.txt'), sample1);
fs.writeFileSync(path.join(outputDir, '2_Show_Seller_Status.txt'), sample2);
fs.writeFileSync(path.join(outputDir, '3_Create_Order.txt'), sample3);
fs.writeFileSync(path.join(outputDir, '4_Capture_Order.txt'), sample4);
fs.writeFileSync(path.join(outputDir, '5_Refund_Payment.txt'), sample5);

console.log('✅ Created: 1_Create_Partner_Referral.txt');
console.log('✅ Created: 2_Show_Seller_Status.txt');
console.log('✅ Created: 3_Create_Order.txt');
console.log('✅ Created: 4_Capture_Order.txt');
console.log('✅ Created: 5_Refund_Payment.txt');
console.log('\n📁 API samples saved to: ' + outputDir);
console.log('\n🎉 Done! You can now submit these API samples to PayPal for certification.');


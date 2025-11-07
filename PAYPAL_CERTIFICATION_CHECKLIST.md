# PayPal Certification Checklist
## AllPartyRental.com - Integration Walkthrough Materials

---

## 📋 **PART 1: VIDEOS (REQUIRED)**

### **Video 1: Successful Seller Onboarding** ⏱️ 3-5 min
**What to Record:**
1. Start at: `https://allpartyrental.com/provider/join`
2. Fill out provider registration form
3. Click "Connect PayPal Account" button
4. Show PayPal onboarding flow (full-page redirect)
5. Complete PayPal account connection
6. Return to platform via callback URL
7. Show PayPal dashboard: `https://allpartyrental.com/provider/dashboard/paypal`
8. Display: ✅ Connected status, Merchant ID, Email, "Can Receive Payments: Yes"

**Key Points to Show:**
- Clear "Connect PayPal" button
- Full-page redirect (not popup)
- Return URL works
- Status shows as connected
- Seller can see their PayPal account ID

---

### **Video 2: Unsuccessful Seller Onboarding** ⏱️ 2-3 min
**What to Record:**
1. Start seller onboarding flow
2. During PayPal onboarding, click "Cancel" or close window
3. Return to platform
4. Show status: ❌ Not Connected / Pending
5. Show error message or notification
6. Demonstrate "Retry" or "Try Again" option

**Key Points to Show:**
- Graceful handling of cancelled onboarding
- Clear messaging about incomplete setup
- Option to retry onboarding

---

### **Video 3: Successful Buyer Purchase - PayPal** ⏱️ 4-6 min
**What to Record:**
1. Browse service: `https://allpartyrental.com/brooklyn/soft-play`
2. Click "View Details" on a service
3. Click "Book Now"
4. Fill out booking form (date, time, details)
5. Proceed to payment page
6. **Show PayPal button prominently displayed**
7. Click "PayPal" button
8. Complete PayPal checkout
9. Return to thank you page: `https://allpartyrental.com/payment/success`
10. **Show all required info on thank you page:**
    - ✅ Payment Source: "PayPal"
    - ✅ Buyer Email
    - ✅ Shipping Address (if applicable)
    - ✅ Billing Address

**Key Points to Show:**
- PayPal button is prominent
- No extra fees for PayPal
- Smooth checkout experience
- Complete thank you page with all details

---

### **Video 4: Successful Buyer Purchase - Venmo** ⏱️ 4-6 min
**Same as Video 3, but:**
1. Select "Venmo" as payment method
2. Complete payment via Venmo
3. Show thank you page displays: "Payment Source: Venmo"

---

### **Video 5: Successful Buyer Purchase - Card** ⏱️ 4-6 min
**Same as Video 3, but:**
1. Select "Pay with Card" option
2. Enter card details using PayPal card fields
3. Complete payment
4. Show thank you page displays: "Payment Source: Card"

---

### **Video 6: Unsuccessful Purchase - Declined Card** ⏱️ 2-3 min
**What to Record:**
1. Start checkout process
2. Enter card details that will be declined (use test card)
3. Submit payment
4. **Show error message displayed**
5. Show buyer can retry with different card
6. Show no duplicate orders were created

**Key Points to Show:**
- Clear error messaging
- Ability to retry payment
- Graceful error handling

---

## 📸 **PART 2: SCREENSHOTS (REQUIRED)**

### **Screenshot Set 1: PayPal Logos**
✅ Take screenshots showing:
1. PayPal button on checkout page
2. "We accept PayPal and Venmo" badge (if present)
3. All PayPal logos used in the site

**Must prove:** Logos are from official PayPal sources

---

### **Screenshot Set 2: Provider Dashboard**
✅ Take screenshots of:
1. `https://allpartyrental.com/provider/dashboard/paypal`
   - Show connected status
   - Show merchant ID
   - Show "Can Receive Payments: Yes"
   - Show scopes/permissions granted

2. Show "Refresh Status" button
3. Show "Disconnect Account" button with confirmation dialog

---

### **Screenshot Set 3: Pay Later Settings**
✅ Take screenshots of:
1. `https://allpartyrental.com/provider/settings`
   - Show "Enable Pay in 4" toggle switch
   - Show current setting (On/Off)

---

### **Screenshot Set 4: Refund Interface**
✅ Take screenshots of:
1. Provider transaction details page
2. "Issue Refund" button
3. Refund modal/dialog
4. Refund reason input field
5. Confirmation after refund issued

---

### **Screenshot Set 5: PayPal Messaging**
✅ Take screenshots of:
1. Checkout page showing PayPal financing messages
2. Service detail page with "Pay in 4" messaging
3. Any "Pay Later" promotional text

---

## 📄 **PART 3: API SAMPLES (REQUIRED)**

### **Sample 1: Create Partner Referral**
```
Endpoint: POST /v2/customer/partner-referrals
Headers sent:
{
  "Authorization": "Bearer ACCESS_TOKEN_HERE",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Body sent:
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
  "tracking_id": "PROVIDER-xxxxx-timestamp",
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

Response received:
{
  "links": [
    {
      "href": "https://www.sandbox.paypal.com/signin/...",
      "rel": "action_url",
      "method": "GET"
    }
  ],
  "partner_referral_id": "ABC123..."
}
```

---

### **Sample 2: Show Seller Status**
```
Endpoint: GET /v1/customer/partners/PARTNER_ID/merchant-integrations/MERCHANT_ID
Headers sent:
{
  "Authorization": "Bearer ACCESS_TOKEN_HERE",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Response received:
{
  "merchant_id": "278XP5MHC6XHY",
  "tracking_id": "PROVIDER-xxxxx-timestamp",
  "products": [
    {
      "name": "EXPRESS_CHECKOUT",
      "vetting_status": "SUBSCRIBED",
      "capabilities": ["CUSTOM_CARD_PROCESSING"]
    }
  ],
  "payments_receivable": true,
  "primary_email_confirmed": true,
  "oauth_integrations": [
    {
      "integration_type": "OAUTH_THIRD_PARTY",
      "oauth_third_party": [
        {
          "partner_client_id": "YOUR_CLIENT_ID",
          "merchant_client_id": "MERCHANT_CLIENT_ID",
          "scopes": [
            "https://uri.paypal.com/services/payments/realtimepayment"
          ]
        }
      ]
    }
  ]
}
```

---

### **Sample 3: Create Order**
```
Endpoint: POST /v2/checkout/orders
Headers sent:
{
  "Authorization": "Bearer ACCESS_TOKEN_HERE",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP",
  "PayPal-Auth-Assertion": "SELLER_AUTH_ASSERTION"
}

Body sent:
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
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
          "description": "Safe and colorful soft play equipment",
          "unit_amount": {
            "currency_code": "USD",
            "value": "249.99"
          },
          "quantity": "1"
        }
      ]
    }
  ],
  "application_context": {
    "brand_name": "AllPartyRental.com",
    "landing_page": "NO_PREFERENCE",
    "shipping_preference": "NO_SHIPPING",
    "user_action": "PAY_NOW",
    "return_url": "https://allpartyrental.com/payment/success",
    "cancel_url": "https://allpartyrental.com/payment/cancel"
  }
}

Response received:
{
  "id": "ORDER_ID_HERE",
  "status": "CREATED",
  "links": [...]
}
```

---

### **Sample 4: Capture Order**
```
Endpoint: POST /v2/checkout/orders/ORDER_ID/capture
Headers sent:
{
  "Authorization": "Bearer ACCESS_TOKEN_HERE",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Response received:
{
  "id": "ORDER_ID_HERE",
  "status": "COMPLETED",
  "purchase_units": [
    {
      "payments": {
        "captures": [
          {
            "id": "CAPTURE_ID",
            "status": "COMPLETED",
            "amount": {
              "currency_code": "USD",
              "value": "249.99"
            }
          }
        ]
      }
    }
  ],
  "payer": {
    "email_address": "buyer@example.com",
    "name": {
      "given_name": "Jane",
      "surname": "Smith"
    }
  }
}
```

---

### **Sample 5: Refund Payment**
```
Endpoint: POST /v2/payments/captures/CAPTURE_ID/refund
Headers sent:
{
  "Authorization": "Bearer ACCESS_TOKEN_HERE",
  "Content-Type": "application/json",
  "PayPal-Partner-Attribution-Id": "NYCKIDSPARTYENT_SP_PPCP"
}

Body sent:
{
  "amount": {
    "value": "249.99",
    "currency_code": "USD"
  },
  "note_to_payer": "Service cancellation - full refund"
}

Response received:
{
  "id": "REFUND_ID",
  "status": "COMPLETED",
  "amount": {
    "currency_code": "USD",
    "value": "249.99"
  }
}
```

---

## ❓ **PART 4: QUESTIONNAIRE (REQUIRED)**

### **Q1: Are all PayPal logos displayed taken from official sources?**
**Answer:** ✅ YES

**Evidence:** 
- All PayPal buttons use the official PayPal JS SDK
- Logos are rendered via `paypal.Buttons()` and `paypal.CardFields()`
- No custom/saved logo images are used
- Screenshots: [Attach Screenshot Set 1]

---

### **Q2: Does your integration re-use access tokens until they expire?**
**Answer:** ✅ YES

**Evidence:**
- Access tokens are cached in `PayPalClientFixed.getAccessToken()`
- Tokens are stored with expiration timestamp
- New tokens only requested when current token expires
- Code reference: `src/lib/payment/paypal-client.js` lines 50-75

---

### **Q3: Does your integration handle the case that a refund is requested with insufficient seller balance?**
**Answer:** ✅ YES

**Evidence:**
- Refund API endpoint catches `INSUFFICIENT_FUNDS` error
- Error message displayed to seller: "Insufficient funds. Please add funds to your PayPal account"
- Seller can retry after adding funds
- Code reference: `src/app/api/provider/transactions/[id]/refund/route.ts`
- Screenshots: [Attach Screenshot Set 4]

---

### **Q4: Are all PayPal JavaScript files loaded dynamically from the official URL rather than saved locally?**
**Answer:** ✅ YES

**Evidence:**
- JS SDK loaded via: `https://www.paypal.com/sdk/js?client-id=...`
- No local copies of PayPal JS files
- Dynamic script tag injection
- Code references:
  - `src/app/book/[serviceId]/payment/page.jsx` line 144
  - `src/app/services/[id]/page.jsx` line 170

---

### **Q5: Is the partner BN code being included in the data-partner-attribution-id attribute of the JS SDK's script tag?**
**Answer:** ✅ YES

**Evidence:**
- BN Code: `NYCKIDSPARTYENT_SP_PPCP`
- Included in all PayPal SDK script tags
- Included in all API headers as `PayPal-Partner-Attribution-Id`
- Code references:
  - Environment variable: `PAYPAL_PARTNER_ATTRIBUTION_ID`
  - Used in: `src/lib/payment/paypal-client.js`
  - Used in: All checkout pages

---

## 📦 **SUBMISSION PACKAGE**

### **Organize files as:**
```
PayPal_Certification_AllPartyRental/
├── Videos/
│   ├── 1_Successful_Seller_Onboarding.mp4
│   ├── 2_Unsuccessful_Seller_Onboarding.mp4
│   ├── 3_Successful_Purchase_PayPal.mp4
│   ├── 4_Successful_Purchase_Venmo.mp4
│   ├── 5_Successful_Purchase_Card.mp4
│   └── 6_Unsuccessful_Purchase_Declined.mp4
├── Screenshots/
│   ├── Logos/
│   ├── Provider_Dashboard/
│   ├── Pay_Later_Settings/
│   ├── Refund_Interface/
│   └── PayPal_Messaging/
├── API_Samples/
│   ├── 1_Create_Partner_Referral.txt
│   ├── 2_Show_Seller_Status.txt
│   ├── 3_Create_Order.txt
│   ├── 4_Capture_Order.txt
│   └── 5_Refund_Payment.txt
└── Questionnaire_Answers.pdf
```

---

## ✅ **CHECKLIST SUMMARY**

- [ ] Video 1: Successful seller onboarding
- [ ] Video 2: Unsuccessful seller onboarding
- [ ] Video 3: Successful purchase - PayPal
- [ ] Video 4: Successful purchase - Venmo
- [ ] Video 5: Successful purchase - Card
- [ ] Video 6: Unsuccessful purchase - Declined
- [ ] Screenshots: PayPal logos
- [ ] Screenshots: Provider dashboard
- [ ] Screenshots: Pay Later settings
- [ ] Screenshots: Refund interface
- [ ] Screenshots: PayPal messaging
- [ ] API Sample: Create Partner Referral
- [ ] API Sample: Show Seller Status
- [ ] API Sample: Create Order
- [ ] API Sample: Capture Order
- [ ] API Sample: Refund Payment
- [ ] Questionnaire: All 5 questions answered with evidence

---

## 🎯 **NEXT STEPS**

1. **Record all 6 videos** (upload to YouTube/Google Drive as unlisted)
2. **Take all screenshots** (organize by category)
3. **Generate API samples** (from your sandbox environment)
4. **Answer questionnaire** (with references to code/screenshots)
5. **Create submission package** (ZIP file or Google Drive folder)
6. **Submit to PayPal Integration Engineer**

---

**Need help with any specific video or screenshot? Let me know which one to start with!**


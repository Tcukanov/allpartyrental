# PayPal Transaction Verification Guide

## 🎯 **WHERE TO CHECK PAYPAL CERTIFICATION REQUIREMENTS IN TRANSACTIONS**

This guide shows you exactly where each PayPal certification requirement is used and how to verify it in actual transactions.

---

## 📋 **CERTIFICATION REQUIREMENTS CHECKLIST**

### ✅ **1. BN Code (PayPal-Partner-Attribution-Id)**
**Requirement:** Must be in `/v2/checkout/orders/{orderId}/capture` API call
**Your BN Code:** `NYCKIDSPARTYENT_SP_PPCP`

#### **Where It's Implemented:**
**File:** `src/lib/payment/paypal-client.js` (Lines 271-282)

```javascript
async captureOrder(orderId) {
  const token = await this.getAccessToken();

  const response = await fetch(`${this.baseURL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP' // ✅ BN CODE HERE
    },
    body: JSON.stringify({})
  });
  // ...
}
```

#### **Where It's Called:**
**File:** `src/lib/payment/payment-service.js` (Line 320)

```javascript
async capturePayment(orderId) {
  // ...
  console.log('💳 Capturing PayPal payment...');
  const captureResult = await paypalClient.captureOrder(orderId); // ✅ BN CODE SENT HERE
  // ...
}
```

#### **How to Verify in Transaction:**
1. Enable console logging
2. Make a test payment booking
3. Look for logs showing the capture request
4. You'll see: `'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'`

---

### ✅ **2. Partner Referrals API - ACCESS_MERCHANT_INFORMATION**
**Requirement:** Use `/v2/customer/partner-referrals` with `ACCESS_MERCHANT_INFORMATION` feature

#### **Where It's Implemented:**
**File:** `src/lib/payment/paypal-client.js` (Lines 332-349)

```javascript
async createPartnerReferral(sellerData) {
  // ...
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
              "ACCESS_MERCHANT_INFORMATION" // ✅ REQUIRED FEATURE
            ]
          }
        }
      }
    }],
    products: ["PPCP"], // ✅ PPCP (NOT EXPRESS_CHECKOUT)
    // ...
  };
  // ...
}
```

#### **Where It's Called:**
**File:** `src/app/api/paypal/onboard-seller/route.js` (Line 49)

```javascript
export async function POST(req) {
  // ...
  const referral = await paypalClient.createPartnerReferral(sellerData); // ✅ CALLED HERE
  // ...
}
```

#### **How to Verify:**
1. Start seller onboarding as a provider
2. Check browser console for API call
3. Look for POST to `/v2/customer/partner-referrals`
4. Verify payload includes `ACCESS_MERCHANT_INFORMATION` and `products: ["PPCP"]`

---

### ✅ **3. Email Removed from Partner Referrals**
**Requirement:** Remove `email` from `customer_data.person_details`

#### **Where It's Implemented:**
**File:** `src/lib/payment/paypal-client.js` (Lines 374-386)

```javascript
// NOTE: Email is REMOVED per PayPal certification requirements
if (sellerData.firstName && sellerData.lastName) {
  referralData.customer_data = {
    customer_type: "MERCHANT",
    person_details: {
      // email_address: REMOVED per certification requirements ✅
      name: {
        given_name: sellerData.firstName,
        surname: sellerData.lastName
      }
    }
  };
}
```

#### **How to Verify:**
1. Start seller onboarding
2. Check the API request payload
3. Confirm `customer_data.person_details` does NOT contain `email_address`

---

### ✅ **4. Merchant Status Validation**
**Requirement:** Use `/v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}` to check status

#### **Where It's Implemented:**
**File:** `src/lib/payment/paypal-client.js` (Lines 423-468)

```javascript
async getMerchantStatus(merchantId) {
  const token = await this.getAccessToken();
  const partnerId = this.clientId;

  const response = await fetch(
    `${this.baseURL}/v1/customer/partners/${partnerId}/merchant-integrations/${merchantId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'
      }
    }
  );
  
  // CRITICAL: Log PayPal-Debug-Id for certification ✅
  const debugId = response.headers.get('PayPal-Debug-Id');
  console.log('🔍 Merchant status response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    debugId: debugId || 'N/A' // ✅ DEBUG ID LOGGED
  });
  // ...
}
```

#### **Where It's Called:**
**File:** `src/app/api/paypal/callback/route.js` (Line 75)

```javascript
// After seller completes onboarding
const statusCheck = await paypalClient.checkSellerStatus(merchantIdInPayPal); // ✅ CALLED HERE
```

**Also in:** `src/app/api/paypal/refresh-status/route.ts` (Line 95)

```javascript
// When provider clicks "Refresh Status"
const statusCheck = await paypalClient.checkSellerStatus(provider.paypalMerchantId); // ✅ CALLED HERE
```

#### **How to Verify:**
1. Complete seller onboarding OR click "Refresh Status"
2. Check browser/server console
3. Look for log: `🔍 Merchant status response`
4. Copy the `debugId` value - this is what you send to PayPal

---

### ✅ **5. Error Message Display**
**Requirement:** Show specific errors when `primary_email_confirmed=false` or `payments_receivable=false`

#### **Where It's Implemented:**
**File:** `src/lib/payment/paypal-client.js` (Lines 480-492)

```javascript
async checkSellerStatus(merchantId) {
  const status = await this.getMerchantStatus(merchantId);
  const issues = [];

  // ✅ CHECK EMAIL CONFIRMATION
  if (!status.primary_email_confirmed) {
    issues.push({
      type: 'EMAIL_NOT_CONFIRMED',
      message: 'Attention: Please confirm your email address on https://www.paypal.com/businessprofile/settings in order to receive payments! You currently cannot receive payments.'
    });
  }

  // ✅ CHECK PAYMENTS RECEIVABLE
  if (!status.payments_receivable) {
    issues.push({
      type: 'CANNOT_RECEIVE_PAYMENTS',
      message: 'Attention: You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to https://www.paypal.com for more information.'
    });
  }
  
  return {
    canReceivePayments: issues.length === 0,
    issues: issues
  };
}
```

#### **Where Errors Are Saved:**
**File:** `src/app/api/paypal/callback/route.js` (Lines 80-92)

```javascript
const statusUpdateData = {
  paypalCanReceivePayments: statusCheckResult.canReceivePayments,
  paypalStatusIssues: statusCheckResult.issues && statusCheckResult.issues.length > 0 
    ? JSON.stringify(statusCheckResult.issues) // ✅ SAVED TO DATABASE
    : null
};

await prisma.provider.update({
  where: { userId: session.user.id },
  data: statusUpdateData
});
```

#### **Where Errors Are Displayed:**
**File:** `src/app/provider/dashboard/paypal/page.jsx` (Lines 598-608)

```javascript
{paypalStatus.issues && paypalStatus.issues.length > 0 && paypalStatus.issues.map((issue, index) => (
  <Alert key={index} status="error" variant="left-accent">
    <AlertIcon />
    <Box>
      <AlertTitle fontSize="md">PayPal Account Issue</AlertTitle>
      <AlertDescription fontSize="sm">
        {issue.message} {/* ✅ ERROR DISPLAYED TO USER */}
      </AlertDescription>
    </Box>
  </Alert>
))}
```

---

## 🔍 **HOW TO TEST & VERIFY IN REAL TRANSACTIONS**

### **Test 1: BN Code in Capture**

**Steps:**
1. Start development server: `npm run dev`
2. Open browser console (F12)
3. Go to a service and book it
4. Complete payment
5. Look for capture logs

**What to Look For:**
```
💳 Capturing PayPal payment...
Sending to: https://api-m.sandbox.paypal.com/v2/checkout/orders/XXX/capture
Headers: {
  'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'  ✅
}
```

---

### **Test 2: Partner Referrals with ACCESS_MERCHANT_INFORMATION**

**Steps:**
1. Log in as a new provider
2. Go to `/provider/dashboard/paypal`
3. Click "Connect PayPal Account"
4. Fill in the form
5. Open Network tab in DevTools
6. Click "Generate PayPal Link"
7. Look for POST request to `/api/paypal/onboard-seller`

**What to Look For in Request:**
```json
{
  "operations": [{
    "api_integration_preference": {
      "rest_api_integration": {
        "third_party_details": {
          "features": [
            "PAYMENT",
            "REFUND",
            "ACCESS_MERCHANT_INFORMATION"  ✅
          ]
        }
      }
    }
  }],
  "products": ["PPCP"],  ✅
  "customer_data": {
    "person_details": {
      // NO email_address field ✅
      "name": {
        "given_name": "John",
        "surname": "Doe"
      }
    }
  }
}
```

---

### **Test 3: Merchant Status Check & Debug ID**

**Steps:**
1. Log in as provider with connected PayPal
2. Go to `/provider/dashboard/paypal`
3. Open browser console
4. Click "Refresh Status"
5. Look for merchant status logs

**What to Look For:**
```
🔍 Merchant status response: {
  status: 200,
  statusText: "OK",
  ok: true,
  debugId: "abc123xyz456"  ✅ COPY THIS FOR PAYPAL
}

📊 Seller status check result: {
  canReceivePayments: true,
  issues: []
}
```

---

### **Test 4: Error Messages**

**Steps:**
```bash
# Simulate email not confirmed
node scripts/simulate-paypal-errors.js email

# Go to: http://localhost:3000/provider/dashboard/paypal
# You should see the error message displayed
```

**What to Look For:**
- Red alert box with message: "Attention: Please confirm your email address..."
- Badge showing "Disabled" for "Receive Payments"

---

## 📊 **TRANSACTION FLOW WITH BN CODE**

```
1. Client Books Service
   └─> POST /api/payments/create
       └─> PaymentService.createPaymentOrder()
           └─> PayPalClient.createOrder()
               └─> Creates PayPal order

2. Client Approves Payment
   └─> Client redirected to PayPal, approves

3. Payment Capture
   └─> POST /api/payments/capture
       └─> PaymentService.capturePayment()
           └─> PayPalClient.captureOrder(orderId)  ✅ BN CODE SENT HERE
               └─> POST /v2/checkout/orders/{id}/capture
                   Headers: {
                     'PayPal-Partner-Attribution-Id': 'NYCKIDSPARTYENT_SP_PPCP'  ✅
                   }
               └─> Returns capture result

4. Transaction Saved
   └─> Transaction record created in database
   └─> Provider receives payment (minus fees)
   └─> Client receives confirmation
```

---

## 📸 **FOR PAYPAL CERTIFICATION**

### **What to Send to PayPal:**

1. **Screenshots of Error Messages:**
   - Email not confirmed error
   - Payments not receivable error
   - Disconnect warning

2. **Debug ID from Merchant Status API:**
   - Get it from console when clicking "Refresh Status"
   - Example: `debugId: "abc123xyz456"`

3. **Confirmation that BN Code is implemented:**
   - Show the code at `src/lib/payment/paypal-client.js:279`
   - Or show capture logs with the header

---

## ✅ **VERIFICATION CHECKLIST**

- [x] BN Code in capture endpoint (`paypal-client.js:279`)
- [x] ACCESS_MERCHANT_INFORMATION feature (`paypal-client.js:343`)
- [x] PPCP product (not EXPRESS_CHECKOUT) (`paypal-client.js:349`)
- [x] Email removed from referral (`paypal-client.js:379`)
- [x] Merchant status API call (`paypal-client.js:436`)
- [x] Debug ID logging (`paypal-client.js:446`)
- [x] Email confirmation check (`paypal-client.js:480`)
- [x] Payments receivable check (`paypal-client.js:487`)
- [x] Error messages saved to DB (`callback/route.js:80-92`)
- [x] Error messages displayed in UI (`paypal/page.jsx:598-608`)

---

## 🎯 **ALL REQUIREMENTS ARE IMPLEMENTED AND ACTIVE IN TRANSACTIONS!**

Every transaction goes through these properly implemented endpoints with:
✅ Correct BN Code
✅ Proper seller validation
✅ Error detection and display
✅ Debug ID logging for support


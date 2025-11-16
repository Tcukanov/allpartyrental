# How to Get PayPal Debug ID for Certification

## 🎯 **WHAT PAYPAL NEEDS**

PayPal says:
> "Share debug IDs for `/v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}`"

They want **proof** that you're actually calling this API by providing the Debug ID from a real request.

---

## 📋 **WHY THEY CAN'T SEE IT**

PayPal can only see API calls made with **YOUR** credentials to **THEIR** merchant IDs. If you tested with:
- Sandbox merchant IDs
- Auto-generated test IDs
- Development mode mock IDs

...PayPal won't see those in their production logs.

**Solution:** Make a real call and capture the Debug ID.

---

## ✅ **METHOD 1: Use "Refresh Status" Button (EASIEST - 2 Minutes)**

### **Step 1: Log in as Provider with PayPal Connected**

1. Go to: `https://allpartyrental.com/provider/dashboard/paypal` (or localhost)
2. Make sure you're logged in as a provider who has PayPal connected
3. You should see "Connection Status: Connected"

### **Step 2: Open Browser Console**

1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Keep it open

### **Step 3: Click "Refresh Status"**

1. On the PayPal dashboard page
2. Find the **"Refresh Status"** button
3. Click it
4. Wait for it to complete

### **Step 4: Copy the Debug ID from Logs**

Look in the console for:

```javascript
🔍 Merchant status response: {
  status: 200,
  statusText: "OK",
  ok: true,
  debugId: "abc123xyz456"  // ← COPY THIS!
}
```

**OR** look in server logs for:
```
🔍 Merchant status response:
debugId: abc123xyz456  // ← COPY THIS!
```

### **Step 5: Send to PayPal**

Email PayPal:
```
Subject: Debug ID for Merchant Status API Call

Hi PayPal Team,

I have executed the merchant status API call as requested.

API Endpoint: /v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}
Debug ID: abc123xyz456

Timestamp: [Date and time of the call]
Environment: Production / Sandbox

This call is made automatically after seller onboarding and when 
providers click "Refresh Status" on their PayPal dashboard.

Best regards,
AllPartyRental Team
```

---

## ✅ **METHOD 2: Check Server Logs (If You Have Access)**

### **Step 1: Connect via SSH or Check Logs**

```bash
# If using Vercel
vercel logs --follow

# Or check your logging service (Datadog, CloudWatch, etc.)
```

### **Step 2: Make a Provider Click "Refresh Status"**

Or trigger it yourself from the provider dashboard

### **Step 3: Look for the Debug ID**

Search logs for:
```
🔍 Merchant status response
```

The next line should have:
```
debugId: "abc123xyz456"
```

### **Step 4: Copy and Send to PayPal**

---

## ✅ **METHOD 3: Run a Test Script (If Needed)**

Create a simple script to call the API:

```javascript
// scripts/test-merchant-status.js
const { PayPalClientFixed } = require('../src/lib/payment/paypal-client');

async function testMerchantStatus() {
  const paypalClient = new PayPalClientFixed();
  
  // Replace with a real merchant ID from your database
  const merchantId = 'YOUR_MERCHANT_ID_HERE';
  
  console.log('📞 Calling merchant status API...');
  
  try {
    const result = await paypalClient.checkSellerStatus(merchantId);
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', result);
    console.log('\n🎯 Look for Debug ID in the logs above');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n🎯 Look for Debug ID in the error logs above');
  }
}

testMerchantStatus();
```

Run it:
```bash
node scripts/test-merchant-status.js
```

Look for the Debug ID in the output.

---

## 🎯 **WHAT THE DEBUG ID LOOKS LIKE**

PayPal Debug IDs typically look like:
- `f536787dce096`
- `abc123def456`
- `1a2b3c4d5e6f7`

It's a unique identifier for that specific API request.

---

## 📧 **EMAIL TEMPLATE FOR PAYPAL**

```
Subject: Debug ID for Merchant Status API - Certification

Hi PayPal Team,

Thank you for the feedback. I have re-run the merchant status API call.

API Call Details:
• Endpoint: GET /v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}
• Debug ID: [PASTE DEBUG ID HERE]
• Timestamp: [Date and time]
• Environment: [Sandbox/Production]
• Merchant ID used: [merchant_id]

Implementation Details:
• The call is made automatically after seller onboarding (callback route)
• The call is also made when providers click "Refresh Status"
• Both primary_email_confirmed and payments_receivable are checked
• Results are saved to database and displayed to providers
• Code location: src/lib/payment/paypal-client.js (lines 442-481)

Please let me know if you need any additional information.

Best regards,
AllPartyRental Team
```

---

## 🔍 **QUICK CHECKLIST**

- [ ] Log in as provider with PayPal connected
- [ ] Open browser console (F12)
- [ ] Click "Refresh Status" button
- [ ] Find the Debug ID in console logs
- [ ] Copy the Debug ID
- [ ] Email it to PayPal with timestamp

**Total time: ~2 minutes**

---

## ⚠️ **IMPORTANT NOTES**

### **Use a REAL Merchant ID**

The Debug ID must come from a call with:
- ✅ Real PayPal merchant ID (from actual onboarding)
- ✅ Your production/sandbox credentials
- ✅ Recent timestamp (within last few days)

### **Don't Use:**
- ❌ Mock/fake merchant IDs
- ❌ Test IDs that don't exist in PayPal's system
- ❌ Auto-generated development IDs

### **Why This Matters:**

PayPal can only see API calls in their logs if:
1. The merchant ID exists in their system
2. The call was made with valid credentials
3. The call actually reached their servers

---

## 🎯 **TROUBLESHOOTING**

### **"I don't see a Debug ID in logs"**

**Solution:**
1. Make sure logging is enabled
2. Check you're looking at the right log level (info/debug)
3. Try Method 1 (Refresh Status button) - it logs to console

### **"Refresh Status doesn't work"**

**Solution:**
1. Make sure you have a provider with `paypalMerchantId` in database
2. Check that merchant ID is not null
3. Try with a different provider account

### **"PayPal says they still don't see it"**

**Solution:**
1. Make sure you're using **production** or **sandbox** environment (not development mocks)
2. Verify the merchant ID is real (from actual PayPal onboarding)
3. Provide the **exact timestamp** of when you made the call
4. Include your **Partner ID** in the email

---

## 📊 **EXAMPLE DEBUG ID CAPTURE**

### **What You'll See in Console:**

```
🔄 PayPal refresh status endpoint hit
🔍 Checking seller status for merchant: ABC123XYZ
🔍 getMerchantStatus called with merchantId: ABC123XYZ
🔍 Making merchant status request to: 
  https://api-m.paypal.com/v1/customer/partners/YOUR_PARTNER_ID/merchant-integrations/ABC123XYZ

🔍 Merchant status response: {
  status: 200,
  statusText: "OK", 
  ok: true,
  debugId: "f536787dce096"  // ✅ THIS IS WHAT PAYPAL NEEDS!
}

📊 Seller status check result: {
  canReceivePayments: true,
  issuesCount: 0
}
```

**Copy:** `f536787dce096`
**Send to PayPal!**

---

## 🎉 **SUMMARY**

**What PayPal Needs:**
- Debug ID from a real API call to merchant status endpoint

**How to Get It:**
1. Have a provider with PayPal connected
2. Open console
3. Click "Refresh Status"
4. Copy Debug ID from logs
5. Email to PayPal

**Time Required:** 2-3 minutes

**That's it!** Simple proof that you're actually calling their API.


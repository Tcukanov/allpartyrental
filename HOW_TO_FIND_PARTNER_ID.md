# 🔍 How to Find Your PayPal Partner ID

## 🚨 **THE ISSUE**

You're getting a **404 error** with message:
```
"Invalid account: ASpTZ567dh..." 
```

This means you're using the wrong **Partner ID** in the merchant status API call.

---

## 📋 **WHAT IS PARTNER ID?**

There are **TWO DIFFERENT IDs** in PayPal:

| ID Type | Purpose | Used For |
|---------|---------|----------|
| **Client ID** | Your app's OAuth credentials | Creating orders, capturing payments, getting access tokens |
| **Partner ID** | Your Partner Account ID | Checking merchant status, partner referrals (sometimes) |

**Usually they're the same**, but in your case PayPal is saying your Client ID is not valid as a Partner ID.

---

## 🔎 **HOW TO FIND YOUR PARTNER ID**

### **Option 1: Check PayPal Developer Dashboard**

1. Go to: https://developer.paypal.com/dashboard/
2. Log in with your partner account
3. Look for **"Partner ID"** or **"Merchant ID"** in your account settings
4. It might be under:
   - Account Settings → Business Information
   - Apps & Credentials → Partner Information
   - Integration Settings

### **Option 2: Contact PayPal Partner Support**

Since you're going through certification, ask your PayPal contact:

```
Subject: Need Partner ID for Merchant Status API

Hi PayPal Team,

I'm implementing the merchant status API call:
GET /v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}

When I use my app's Client ID (ASpTZ567dh...) as the partner_id, 
I get a 404 error: "Invalid account: ASpTZ567dh..."

Could you please provide:
1. The correct Partner ID to use in this API endpoint
2. Where I can find this Partner ID in the developer dashboard

My app details:
- Environment: Sandbox
- Client ID: ASpTZ567dh... (first 10 chars)
- Test Merchant ID: UVU4H5X4F9274

Debug ID: f86795583b4c5

Thank you!
```

### **Option 3: Check API Response from Partner Referral**

When you create a partner referral, the response includes partner information:

```javascript
const referralResponse = await paypalClient.createPartnerReferral(sellerData);
console.log('Partner info:', referralResponse);
// Look for "partner_id" in the response
```

### **Option 4: Try Your Merchant ID**

Sometimes, for sandbox testing, you might need to use:
- Your own sandbox business account's merchant ID
- A special partner test account ID

---

## 🛠️ **ONCE YOU FIND YOUR PARTNER ID**

### **Step 1: Add to Environment Variables**

Update your `.env` file or Vercel environment variables:

```bash
# Sandbox Partner ID (for merchant status API)
PAYPAL_SANDBOX_PARTNER_ID=YOUR_REAL_PARTNER_ID_HERE

# Live Partner ID (for production)
PAYPAL_LIVE_PARTNER_ID=YOUR_LIVE_PARTNER_ID_HERE
```

### **Step 2: Redeploy**

```bash
# If on Vercel
git add .
git commit -m "Add PayPal Partner ID env variable"
git push

# Then in Vercel dashboard:
# Settings → Environment Variables → Add:
# PAYPAL_SANDBOX_PARTNER_ID = YOUR_PARTNER_ID
```

### **Step 3: Test Again**

1. Click "Refresh Status" on PayPal settings page
2. Check logs - you should see:
```
🔍 Using Partner ID: YOUR_REAL...
🔍 Merchant status response: { status: 200, ok: true }
```

---

## 🎯 **TEMPORARY WORKAROUND (SANDBOX ONLY)**

If you can't find the Partner ID right now, you can **temporarily skip the status check** in sandbox:

**Edit this file:** `src/app/api/paypal/refresh-status/route.ts`

**Find this section:**
```typescript
if (isDevelopment && isAutoMerchantId) {
  // Development auto-merchant logic
} else {
  // Real PayPal API call
}
```

**Add this before the API call:**
```typescript
if (isSandboxMode && !isDevelopment) {
  console.log('🔧 Sandbox mode - auto-enabling payments until Partner ID is configured');
  updateData = {
    paypalCanReceivePayments: true,
    paypalOnboardingStatus: 'COMPLETED',
    paypalStatusIssues: null
  };
  statusMessage = 'Sandbox payments enabled - Partner ID not yet configured';
} else {
  // Make real API call
}
```

**⚠️ WARNING:** This workaround should only be used in sandbox for testing. You **MUST** get the real Partner ID for production!

---

## 📧 **SEND THIS TO PAYPAL**

Copy this into your email to PayPal support:

```
Subject: 404 Error on Merchant Status API - Need Correct Partner ID

Hi PayPal Team,

I'm implementing requirement #3 (Account Status Validation) from your certification email.

Issue:
When calling GET /v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id},
I receive a 404 error: "Invalid account: ASpTZ567dh..."

Current Setup:
• Environment: Sandbox
• App Client ID: ASpTZ567dh... (first 10 chars of 80-char ID)
• Test Merchant ID: UVU4H5X4F9274
• API Endpoint: /v1/customer/partners/ASpTZ567dh.../merchant-integrations/UVU4H5X4F9274
• Debug ID: f86795583b4c5

Question:
What Partner ID should I use in place of {partner_id} in this API endpoint?
- Should it be my app's Client ID? (currently using, but getting 404)
- Should it be my Partner Account's Merchant ID?
- Is there a different Partner ID I should request?

Could you please:
1. Provide the correct Partner ID for sandbox testing
2. Let me know where to find this in the developer dashboard
3. Confirm if this ID will be different for live environment

Thank you for your help!

Best regards,
AllPartyRental Team
```

---

## ✅ **WHAT WE'VE ALREADY FIXED**

- ✅ Correct API endpoint structure (`/v1/customer/partners/{partner_id}/merchant-integrations/{merchant_id}`)
- ✅ Support for separate Partner ID environment variable
- ✅ Debug ID logging
- ✅ Fallback to Client ID if Partner ID not set

---

## 🎯 **NEXT STEPS**

1. **Ask PayPal** for your Partner ID (use email template above)
2. **Add Partner ID** to environment variables
3. **Redeploy** your application
4. **Test again** - should get 200 response
5. **Send new Debug ID** to PayPal for certification

**You're almost there! This is the last piece!** 🚀


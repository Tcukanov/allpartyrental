# PayPal Certification - Screenshot Capture Guide

## ✅ ALL REQUIREMENTS ARE IMPLEMENTED - JUST NEED SCREENSHOTS

---

## 🎯 3 SCREENSHOTS NEEDED (15 Minutes Total)

### Screenshot 1: Disconnect Warning ✅
**What:** Popup when disconnecting PayPal

**Steps:**
1. Go to: http://localhost:3000/provider/dashboard/paypal
2. Click **"Disconnect Account"** button
3. **SCREENSHOT** the popup/dialog
4. Save as: `1_disconnect_warning.png`

---

### Screenshot 2: Payments Not Receivable Error ✅
**What:** Error message when payments_receivable = false

**Steps:**
```bash
# 1. Run this command:
node scripts/simulate-paypal-errors.js payments

# 2. Go to: http://localhost:3000/provider/dashboard/paypal

# 3. SCREENSHOT the RED error alert showing:
#    "Attention: You currently cannot receive payments due to 
#     restriction on your PayPal account..."

# 4. Save as: 2_payments_not_receivable_error.png
```

---

### Screenshot 3: Email Not Confirmed Error ✅
**What:** Error message when primary_email_confirmed = false

**Steps:**
```bash
# 1. Run this command:
node scripts/simulate-paypal-errors.js email

# 2. Refresh: http://localhost:3000/provider/dashboard/paypal

# 3. SCREENSHOT the RED error alert showing:
#    "Attention: Please confirm your email address on 
#     https://www.paypal.com/businessprofile/settings..."

# 4. Save as: 3_email_not_confirmed_error.png
```

---

### Step 4: Restore Normal State ✅

```bash
# After capturing both error screenshots, restore:
node scripts/simulate-paypal-errors.js restore
```

---

## 📋 GET DEBUG ID

**Steps:**
1. Open browser console (Press F12)
2. Go to: http://localhost:3000/provider/dashboard/paypal
3. Click **"Refresh Status"** button
4. Look for log: `🔍 Merchant status response`
5. Copy the `debugId` value
6. Note it down (you'll send this to PayPal)

---

## 📧 SEND TO PAYPAL

**Email Subject:** PayPal Certification - Implementation Complete

**Email Body:**
```
Hi PayPal Team,

All certification requirements have been implemented. 
Please find attached:

1. disconnect_warning.png
2. payments_not_receivable_error.png  
3. email_not_confirmed_error.png

Debug ID from merchant status API: [PASTE DEBUG ID HERE]

✅ All requirements completed:
- Disconnect warning message
- Error handling for payments_receivable = false
- Error handling for primary_email_confirmed = false
- ACCESS_MERCHANT_INFORMATION in Partner Referrals
- PPCP product (not EXPRESS_CHECKOUT)
- Email removed from customer_data
- BN Code: NYCKIDSPARTYENT_SP_PPCP
- Debug ID logging

Ready for certification approval.

Best regards,
AllPartyRental Team
```

---

## 🎬 FULL PROCESS (Copy & Paste Commands)

```bash
# Screenshot 1: Already can do manually (disconnect button)

# Screenshot 2: Payments error
node scripts/simulate-paypal-errors.js payments
# Go to http://localhost:3000/provider/dashboard/paypal
# Take screenshot → Save as: 2_payments_not_receivable_error.png

# Screenshot 3: Email error
node scripts/simulate-paypal-errors.js email
# Refresh http://localhost:3000/provider/dashboard/paypal
# Take screenshot → Save as: 3_email_not_confirmed_error.png

# Restore normal state
node scripts/simulate-paypal-errors.js restore

# Get Debug ID: Open console, click "Refresh Status", copy debugId
```

---

## ⏱️ TIME ESTIMATE

- Screenshot 1 (Disconnect): 2 minutes
- Screenshot 2 (Payments): 3 minutes
- Screenshot 3 (Email): 3 minutes
- Get Debug ID: 2 minutes
- Write email: 5 minutes
- **Total: ~15 minutes**

---

## ✅ VERIFICATION CHECKLIST

- [ ] Screenshot 1: Disconnect warning popup
- [ ] Screenshot 2: Payments not receivable error (red alert)
- [ ] Screenshot 3: Email not confirmed error (red alert)
- [ ] Debug ID copied from console
- [ ] Database restored to normal state
- [ ] Email drafted with all attachments
- [ ] Send email to PayPal

---

## 🚀 YOU'RE READY!

All the code is implemented correctly. You just need to:
1. Capture 3 screenshots (15 min)
2. Get debug ID (2 min)
3. Send email to PayPal (5 min)

**Total time: ~22 minutes**


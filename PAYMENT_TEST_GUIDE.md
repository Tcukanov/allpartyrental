# Payment Form Testing Guide

## 🎯 Objective
Test the complete booking and payment flow to ensure all fixes are working correctly.

## 🔧 Pre-Test Setup
1. **Server Running**: Make sure `npm run dev` is running
2. **PayPal Sandbox**: Ensure you're using sandbox environment
3. **Test Cards**: Use PayPal test card numbers

## 📋 Manual Test Steps

### Step 1: Navigate to Service
- Go to: `http://localhost:3000/services/cma4d5o25000dmlcqt66dat5d`
- ✅ Verify: Service page loads showing "MEDIUM WHITE SET 13x13"

### Step 2: Open Booking Modal
- Click **"Book Now"** button
- ✅ Verify: Modal opens with booking form

### Step 3: Fill Booking Details
- **Date**: Select any future date
- **Time**: Choose any available time (e.g., 10:00 AM)
- **Address**: Enter a test address (required field)
  ```
  123 Test Street, Test City, TC 12345
  ```
- **Comments**: (Optional) Add test comments
- ✅ Verify: All required fields are filled

### Step 4: Continue to Payment
- Click **"Continue to Payment"** button
- ✅ Verify: Payment form loads with PayPal credit card fields

### Step 5: Wait for PayPal Form
- Wait 3-5 seconds for PayPal fields to initialize
- ✅ Verify: You see 4 credit card input fields:
  - Cardholder Name
  - Card Number
  - Expiry Date
  - CVV

### Step 6: Fill Payment Details
Use these **PayPal sandbox test card details**:

```
Card Number: 4032035728288280 (Visa)
Expiry: 12/2030
CVV: 123
Name: John Doe
```

Alternative test cards:
```
Mastercard: 5256183896302662
Amex: 372013489651283
```

### Step 7: Submit Payment
- Click **"Pay $XXX.XX"** button
- ✅ Verify: Payment processing starts

### Step 8: Check Results
**Expected Success Flow:**
1. "Processing payment..." message appears
2. Payment completes successfully
3. Success message: "Payment Successful!"
4. Redirects to dashboard after 3 seconds

**Check Server Logs:**
```bash
# In your terminal, watch for these successful log entries:
✅ PayPal Client initialized
✅ Creating payment order for: { serviceId: '...', bookingDate: '...', hours: ... }
✅ Service price: $XXX for service: MEDIUM WHITE SET 13x13
✅ Using default city: [City Name]
✅ Created party: [party-id]
✅ Created party service: [party-service-id]
✅ Created offer: [offer-id]
✅ Created transaction: [transaction-id]
✅ Payment order created
✅ Payment captured successfully
```

## 🐛 Troubleshooting

### Common Issues & Solutions:

**1. "Service not found" (404)**
- ❌ Problem: Wrong service ID being passed
- ✅ Solution: Fixed - now passes correct serviceId from booking data

**2. "City argument missing" (500)**
- ❌ Problem: Service has null cityId
- ✅ Solution: Fixed - uses getDefaultCity() when cityId is missing

**3. "userId: undefined" in notification**
- ❌ Problem: Using transaction.offer.provider.userId instead of .id
- ✅ Solution: Fixed - now uses transaction.offer.provider.id

**4. "Window closed before response"**
- ❌ Problem: PayPal form error due to failed API calls
- ✅ Solution: Fixed - all API calls now work properly

**5. Duplicate credit card fields**
- ❌ Problem: Multiple PayPal form initializations
- ✅ Solution: Fixed - comprehensive duplicate prevention

## 🎯 Success Criteria

### ✅ Payment Flow Should Work When:
1. Service loads without errors
2. Booking modal opens and accepts input
3. Payment form initializes with 4 credit card fields
4. Test card details can be entered successfully
5. Payment submits without "Window closed" error
6. Success message appears
7. Database records are created properly
8. Notifications are sent to provider

### 📊 Database Verification
After successful payment, check that these records were created:
```sql
-- Check if records were created (use Prisma Studio)
Party -> PartyService -> Offer -> Transaction
```

## 🔍 Debug Information

### Console Logs to Monitor:
- PayPal SDK loading
- Card fields initialization
- API calls to /api/payments/create
- API calls to /api/payments/capture
- Database queries (Prisma logs)

### Key URLs:
- **Service**: http://localhost:3000/services/cma4d5o25000dmlcqt66dat5d
- **Prisma Studio**: http://localhost:5556 (if running)

## 🎉 Expected Final Result
- Payment completes successfully
- Provider receives notification about new booking
- Client sees success message
- All database records are properly created
- No "Window closed" or server errors

---
**Note**: All major payment flow issues have been identified and fixed. The test should now complete successfully without the previous errors. 
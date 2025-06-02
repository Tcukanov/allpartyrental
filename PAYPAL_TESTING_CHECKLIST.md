# PayPal Marketplace Integration - Testing Checklist

## ✅ IMPLEMENTATION COMPLETE

### Database Schema
- ✅ PayPal fields added to Provider model (not User model)
- ✅ Database migration successful
- ✅ API endpoints updated to use Provider model

### Required PayPal Fixes
- ✅ BN Code: `NYCKIDSPARTYENT_SP_PPCP` added to environment
- ✅ PayPal SDK script includes `data-partner-attribution-id`
- ✅ All API calls include `PayPal-Partner-Attribution-Id` header
- ✅ Order creation includes proper line item details
- ✅ Seller onboarding API implemented
- ✅ Seller status checking implemented
- ✅ PayPal Settings UI created

## 🧪 TESTING STEPS

### 1. Verify Environment Setup
```bash
# Check BN code is set
echo $PAYPAL_PARTNER_ATTRIBUTION_ID
# Should output: NYCKIDSPARTYENT_SP_PPCP

# Check in code
grep -r "NYCKIDSPARTYENT_SP_PPCP" src/
# Should show 5 matches
```

### 2. Test Provider PayPal Onboarding

#### Step 1: Access PayPal Settings
1. Go to `http://localhost:3001/provider/dashboard/paypal`
2. You should see "PayPal Payment Settings" page
3. Status should show "Not Connected"

#### Step 2: Start Onboarding Process
1. Click "Connect PayPal Account" button
2. Fill in the form:
   - First Name: Test
   - Last Name: Provider
   - Email: Your PayPal sandbox email
3. Click "Connect PayPal"
4. You should be redirected to PayPal sandbox onboarding

#### Step 3: Complete PayPal Onboarding
1. Log in with your PayPal sandbox business account
2. Grant permissions to your marketplace
3. Complete the onboarding flow
4. You should be redirected back to your app

#### Step 4: Verify Connection
1. Should show "PayPal Connected Successfully!" toast
2. Status should show "Connected"
3. Should display Merchant ID
4. Payment capabilities section should appear

### 3. Test Payment Flow

#### Verify BN Code in Network Tab
1. Open browser dev tools → Network tab
2. Make a test payment
3. Look for PayPal API calls
4. Check headers include: `PayPal-Partner-Attribution-Id: NYCKIDSPARTYENT_SP_PPCP`

#### Verify Line Items
1. In Network tab, find the "create order" call
2. Check request body includes proper `items` array with:
   - `name`: Service name
   - `description`: Service description
   - `sku`: Service ID
   - `category`: "DIGITAL_GOODS"

### 4. Test Error Scenarios

#### Email Not Confirmed
- PayPal should show appropriate warning message
- Should prevent payment processing

#### Account Restricted
- Should show restriction warning
- Should disable PayPal payments

#### Permissions Not Granted
- Should show permissions error
- Should require re-onboarding

## 🔍 VERIFICATION CHECKLIST

### PayPal SDK
- [ ] Script tag includes `data-partner-attribution-id="NYCKIDSPARTYENT_SP_PPCP"`
- [ ] PayPal loads without errors
- [ ] Card fields render properly

### API Calls
- [ ] All PayPal API calls include BN code header
- [ ] Order creation includes line item details
- [ ] Partner referral creation works
- [ ] Seller status checking works

### Database
- [ ] Provider model has all PayPal fields
- [ ] Onboarding data saves correctly
- [ ] Status updates work properly

### UI/UX
- [ ] PayPal settings page loads
- [ ] Connection status displays correctly
- [ ] Error messages show as specified in guide
- [ ] Disconnect functionality works

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: "No action URL received from PayPal"
**Solution**: Check your PayPal sandbox account permissions and BN code

### Issue: "PayPal script fails to load"
**Solution**: Verify `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly

### Issue: "Database error on onboarding"
**Solution**: Ensure user has a Provider record: `npx prisma studio`

### Issue: "Status check fails"
**Solution**: Verify merchant ID is correct and account is sandbox-ready

## 📱 TEST ACCOUNTS NEEDED

### PayPal Sandbox Business Account
- Required for provider onboarding
- Must be separate from your developer account
- Should have business verification completed

### Test Credit Cards
- Visa: 4032035728288280
- Mastercard: 5256183896302662
- Expiry: Any future date (12/2030)
- CVV: Any 3 digits (123)

## 🎯 SUCCESS CRITERIA

Your PayPal integration is ready when:

1. ✅ Provider can complete onboarding flow
2. ✅ PayPal status displays correctly
3. ✅ Payments include proper BN code and line items
4. ✅ Error messages match PayPal guide requirements
5. ✅ All API calls include required headers
6. ✅ Database stores all onboarding data

## 🚀 NEXT STEPS FOR PRODUCTION

1. **Switch to Live Environment**
   - Update `PAYPAL_MODE=live`
   - Use live PayPal credentials
   - Update client IDs

2. **PayPal Certification**
   - Complete Integration Walkthrough (IWT)
   - Provide API samples and recordings
   - Get PayPal approval

3. **Webhook Implementation** (Recommended)
   - Handle status change notifications
   - Auto-update seller capabilities
   - Improve real-time status sync

Your PayPal marketplace integration is now complete and ready for testing! 🎉 
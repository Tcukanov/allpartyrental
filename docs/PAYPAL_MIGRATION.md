# Migrating from Stripe to PayPal for Marketplaces

This guide explains how to migrate the payment processing in All Party Rent from Stripe Connect to PayPal for Marketplaces.

## Why migrate?

PayPal for Marketplaces provides several advantages over Stripe Connect:
- Higher global acceptance rate
- Lower fees for cross-border transactions
- Simpler onboarding for sellers/service providers
- Built-in dispute resolution system
- Wider international coverage

## Overview of Changes

The migration includes the following changes:
1. New PayPal API integration in `src/lib/payment/paypal`
2. New database fields for storing PayPal merchant information
3. Updated payment flow components using PayPal buttons
4. New webhook endpoints for PayPal events
5. Updated admin settings to manage PayPal configurations

## Migration Steps

### 1. Update Your Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Active payment provider ('stripe' or 'paypal')
ACTIVE_PAYMENT_PROVIDER=paypal

# PayPal configuration
PAYPAL_MODE=sandbox # 'sandbox' for testing, 'live' for production

# PayPal Sandbox environment
PAYPAL_SANDBOX_CLIENT_ID=your-sandbox-client-id
PAYPAL_SANDBOX_CLIENT_SECRET=your-sandbox-client-secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-sandbox-client-id # Same as above
PAYPAL_SANDBOX_WEBHOOK_ID=your-sandbox-webhook-id
PAYPAL_SANDBOX_WEBHOOK_SECRET=your-sandbox-webhook-secret

# PayPal Live environment (for production)
PAYPAL_LIVE_CLIENT_ID=your-live-client-id
PAYPAL_LIVE_CLIENT_SECRET=your-live-client-secret
PAYPAL_LIVE_WEBHOOK_ID=your-live-webhook-id
PAYPAL_LIVE_WEBHOOK_SECRET=your-live-webhook-secret

# PayPal Partner ID for marketplace integration
PAYPAL_PARTNER_ID=your-partner-id

# Test accounts for development
PAYPAL_TEST_MERCHANT_ID=test-merchant-id
PAYPAL_TEST_EMAIL=test-merchant@example.com
```

### 2. Run Database Migration

Run the migration to add PayPal fields to the database:

```bash
npx prisma migrate dev --name add_paypal_fields
```

This will:
- Add `paypalMerchantId`, `paypalEmail`, and `paypalOnboardingComplete` fields to the `Provider` model
- Update the `SystemSettings` table to include PayPal configuration

### 3. Set Up Your PayPal Developer Account

1. Sign up for a [PayPal Developer Account](https://developer.paypal.com/)
2. Create a REST API app in the PayPal Developer Dashboard
3. Get your Client ID and Secret for both Sandbox and Live environments
4. Enable PayPal Commerce Platform features for your app
5. Set up webhooks for your application with the following events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `MERCHANT.ONBOARDING.COMPLETED`

### 4. PayPal Partner Onboarding

To use marketplace features (paying service providers):

1. Apply for PayPal Partner status at [PayPal Partner Portal](https://www.paypal.com/partnerprogram/)
2. Receive your Partner ID and update your environment variables
3. Verify your partner account is approved for marketplace payments

### 5. Test the Integration

Before going live, test the PayPal integration using sandbox accounts:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test provider onboarding:
   - Log in as a service provider
   - Navigate to settings and connect a PayPal account
   - Verify the PayPal merchant ID is saved in the database

3. Test payment flow:
   - Create a booking for a service
   - Proceed to checkout and pay with PayPal
   - Verify the transaction is recorded correctly
   - Check that webhooks are being received and processed

### 6. Switch to PayPal in Production

Once testing is complete:

1. Update your admin settings to set PayPal as the active payment provider
2. Update environment variables with live API credentials
3. Run database migrations on your production database
4. Monitor initial transactions to ensure everything works correctly

## Fallback to Stripe

If you need to switch back to Stripe temporarily:

1. Set `ACTIVE_PAYMENT_PROVIDER=stripe` in your `.env` file
2. Update the admin settings to use Stripe as the active provider

## Component Changes

The following components have been updated or added:

- **PayPal Button Components**:
  - `src/components/payment/PayPalPaymentButton.jsx` (replaces Stripe elements)
  
- **Provider Connection**:
  - `src/components/provider/PayPalConnectButton.jsx` (replaces Stripe Connect)

- **API Endpoints**:
  - `src/app/api/payment/create-intent/route.js` (creates PayPal orders)
  - `src/app/api/payment/capture-intent/route.js` (captures PayPal payments)
  - `src/app/api/provider/paypal/*` (handles provider onboarding)
  - `src/app/api/webhooks/paypal/route.js` (processes PayPal webhooks)

## Troubleshooting

### Common Issues

1. **Provider connection fails**:
   - Check your PayPal Partner ID is correct
   - Ensure your application has the necessary permissions

2. **Payment capture fails**:
   - Verify the order was created successfully
   - Check PayPal sandbox buyer account has sufficient funds

3. **Webhooks not received**:
   - Verify your webhook URL is accessible from the internet
   - Check webhook subscription in PayPal Developer Dashboard

### Debugging

For debugging PayPal integration issues:

1. Check the server logs for detailed error messages
2. Use the PayPal Developer Dashboard to view transaction status
3. Test webhooks using the PayPal Webhook Simulator

## Support

If you encounter issues with the PayPal integration:

1. Check PayPal's [Developer Documentation](https://developer.paypal.com/docs/business/checkout/)
2. Visit PayPal's [Developer Forum](https://www.paypal-community.com/) 
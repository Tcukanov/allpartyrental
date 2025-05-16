# PayPal Integration for All Party Rent

This guide provides step-by-step instructions for setting up and testing the PayPal integration in the All Party Rent application.

## Overview

All Party Rent now uses PayPal for handling marketplace payments, replacing the previous Stripe integration. The PayPal integration supports:

- Processing customer payments through PayPal accounts
- **Direct credit card payments** without requiring a PayPal account
- Connecting service provider accounts
- Delayed disbursement (escrow) to hold funds until services are completed
- Automatic distribution of funds to service providers
- Fee handling for marketplace transactions

## Prerequisites

Before you begin:

1. Create a [PayPal Developer Account](https://developer.paypal.com/)
2. Create a REST API app in the PayPal Developer Dashboard
3. Set up a Business account to use for testing
4. **For credit card processing**: Make sure your PayPal account is approved for Advanced Credit and Debit Card payments

## Environment Setup

1. Update your `.env` file with the following PayPal configuration:

```
# Active payment provider
ACTIVE_PAYMENT_PROVIDER=paypal

# PayPal configuration
PAYPAL_MODE=sandbox # Use 'sandbox' for testing, 'live' for production

# Sandbox environment
PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id  # Same as PAYPAL_SANDBOX_CLIENT_ID

# Optional - for marketplace features
PAYPAL_PARTNER_ID=your_partner_id_if_applicable

# For webhooks (optional during development)
PAYPAL_SANDBOX_WEBHOOK_ID=your_webhook_id
PAYPAL_SANDBOX_WEBHOOK_SECRET=your_webhook_secret
```

2. If you don't have the PayPal credentials yet, you can still run the application in development mode. It will use mock responses for PayPal API calls.

## Database Setup

The PayPal integration requires new fields in the Provider model. Run the database migration:

```bash
# Apply the migration to add PayPal fields
npx prisma migrate dev --name add_paypal_fields

# Generate the updated Prisma client
npx prisma generate
```

## Payment Options

The integration supports two payment methods:

### 1. PayPal Wallet Payment

Customers can pay using their PayPal account. This is the traditional PayPal checkout flow where customers:
- Click the "Pay with PayPal" button
- Log in to their PayPal account
- Approve the payment
- Return to your site

### 2. Direct Credit Card Payment

Customers can pay directly with credit or debit cards without creating a PayPal account. This is enabled through PayPal's Advanced Credit and Debit Card payments:
- Customer clicks "Pay with Card"
- Enters their card details directly in a secure form
- Completes the payment without leaving your site

## Testing the Integration

### Step 1: Verify Basic Connectivity

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the connection by visiting:
   ```
   http://localhost:3000/api/debug/paypal-test
   ```

3. You should see one of two responses:
   - Using mock PayPal responses (if no real credentials are set)
   - PayPal connection successful (if real credentials are set)

### Step 2: Test Provider Account Connection

1. Log in as a service provider
2. Navigate to Settings > Payments
3. Click "Connect with PayPal"
4. If using real credentials, you'll be redirected to PayPal for account connection
5. If using mock data, you'll see a simulated flow

### Step 3: Test Payment Flow

1. Create a booking for a service
2. Proceed to checkout
3. Choose your payment method:
   - Click "Pay with PayPal" to use PayPal wallet
   - Click "Pay with Card" to use direct credit card payment
4. Complete the payment flow
5. Verify the transaction is recorded in your database

## Webhook Setup (For Production)

For production use, set up PayPal webhooks:

1. In the PayPal Developer Dashboard, navigate to your app
2. Go to Webhooks > Add Webhook
3. Set the webhook URL to `https://your-domain.com/api/webhooks/paypal`
4. Subscribe to these events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`
   - `MERCHANT.ONBOARDING.COMPLETED`

5. Add the webhook ID and signing secret to your environment variables:
   ```
   PAYPAL_SANDBOX_WEBHOOK_ID=your_webhook_id
   PAYPAL_SANDBOX_WEBHOOK_SECRET=your_webhook_secret
   ```

## Troubleshooting

### Common Issues

1. **"PayPal credentials are not configured" error**:
   - Check your `.env` file for proper PayPal credentials
   - For development, the application will use mock data if credentials are missing
   - For production, real credentials are required

2. **Provider connection fails**:
   - Verify your PayPal Partner ID
   - Ensure your app has the necessary permissions in PayPal Dashboard

3. **Payment button doesn't appear**:
   - Check browser console for errors
   - Verify that `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly

4. **Credit card fields not appearing**:
   - Ensure your PayPal account is approved for Advanced Credit and Debit Card payments
   - Check that the PayPal SDK is loaded with the 'hosted-fields' component
   - Look for errors in the browser console related to hosted fields initialization

5. **Webhooks not working**:
   - Verify webhook URL is publicly accessible
   - Check webhook event subscriptions in PayPal Dashboard
   - Verify webhook ID and secret in your environment variables

## Development Mocks

> **IMPORTANT NOTICE**: We are phasing out all mock implementations in favor of using real PayPal sandbox accounts.

### New Approach - Use Real Sandbox Accounts

For all development and testing:

1. **Create real PayPal sandbox accounts** through the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Configure your environment with sandbox credentials:
   ```
   PAYPAL_MODE=sandbox
   PAYPAL_SANDBOX_CLIENT_ID=your_sandbox_client_id
   PAYPAL_SANDBOX_CLIENT_SECRET=your_sandbox_client_secret
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
   ```
3. Use real PayPal Sandbox API calls instead of mock implementations
4. Document your sandbox testing credentials in a secure location

### Temporary Fallback Only

The application contains a fallback mechanism for development scenarios where sandbox credentials are not yet available:

- This fallback is provided for initial setup only
- It uses a standardized approach controlled by environment variables
- **No hardcoded mock data** should ever be added to the codebase
- All developers should transition to real sandbox accounts as soon as possible

### Rules for Development:

1. **NEVER add hardcoded mock data or responses** in the codebase
2. **ALWAYS use PayPal sandbox accounts** for testing all payment flows
3. **AVOID creating custom mock implementations** of the PayPal API
4. If you need test data, create it through the normal application flows using sandbox accounts

### When running without PayPal credentials (Temporary):

- Mock orders are created with IDs prefixed with `SANDBOX_`
- A warning is displayed in the console about missing credentials
- Limited functionality is available until proper credentials are configured
- This mode is intended for initial setup only and should not be used for feature development or testing

## Going to Production

When ready for production:

1. Create a live REST API app in the PayPal Developer Dashboard
2. Update your environment variables with production credentials:
   ```
   PAYPAL_MODE=live
   PAYPAL_LIVE_CLIENT_ID=your_live_client_id
   PAYPAL_LIVE_CLIENT_SECRET=your_live_client_secret
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_LIVE_WEBHOOK_ID=your_live_webhook_id
   PAYPAL_LIVE_WEBHOOK_SECRET=your_live_webhook_secret
   ```

3. Set up webhooks for your production endpoint
4. Ensure your account is approved for Advanced Credit and Debit Card payments if you want to use that feature

## Additional Resources

- [PayPal Checkout Integration Guide](https://developer.paypal.com/docs/checkout/)
- [PayPal Advanced Credit and Debit Card Payments](https://developer.paypal.com/docs/checkout/advanced/integrate/)
- [PayPal REST API Documentation](https://developer.paypal.com/api/rest/)
- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/) 
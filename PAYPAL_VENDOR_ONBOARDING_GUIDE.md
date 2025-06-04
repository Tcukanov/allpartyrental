# PayPal Vendor Onboarding Setup Guide

## ✅ Fixed Issues

### 1. Authentication Errors (401)
**Problem**: New vendors getting "Failed to get PayPal access token: 401" errors  
**Solution**: Set PayPal environment variables properly

### 2. Localhost URL Rejection (400 INVALID_PARAMETER_SYNTAX)
**Problem**: PayPal rejects localhost URLs in partner referral `action_renewal_url` field  
**Solution**: Removed problematic localhost URLs for development, using simplified onboarding flow

### 3. Environment Variables Setup
The following environment variables are now configured:

```bash
# Required for PayPal API authentication
PAYPAL_MODE=sandbox
PAYPAL_SANDBOX_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
PAYPAL_SANDBOX_CLIENT_SECRET=EKmv6KdCCCyqQcF73yNY9RmGfIwHD8dPb7dLZz8O1q2QzLPXvCXM5uZJlL0GXdqN-3PEKCfXC4NCN-b4

# Required for frontend components
NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk

# Optional (for compatibility)
PAYPAL_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
PAYPAL_CLIENT_SECRET=EKmv6KdCCCyqQcF73yNY9RmGfIwHD8dPb7dLZz8O1q2QzLPXvCXM5uZJlL0GXdqN-3PEKCfXC4NCN-b4
```

## 🚀 How to Start Development Server

### Option 1: Using the Environment Script
```bash
source ./set-paypal-env.sh && npm run dev
```

### Option 2: Manual Environment Setup
```bash
export PAYPAL_MODE=sandbox
export PAYPAL_SANDBOX_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
export PAYPAL_SANDBOX_CLIENT_SECRET=EKmv6KdCCCyqQcF73yNY9RmGfIwHD8dPb7dLZz8O1q2QzLPXvCXM5uZJlL0GXdqN-3PEKCfXC4NCN-b4
export NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
npm run dev
```

## 🔧 Vendor Onboarding Process

### For New Vendors (Development):
1. **Navigate to PayPal Settings**: `/provider/dashboard/paypal`
2. **Click "Connect PayPal"** button
3. **Fill out the onboarding form**:
   - First Name
   - Last Name  
   - Email Address
4. **Get redirected to PayPal** for account setup
5. **Complete PayPal onboarding** process on PayPal's site
6. **Manual Status Sync**: Return to PayPal settings page and click "Refresh Status"
7. **Payments Enabled**: After successful sync

### For New Vendors (Production):
1. **Navigate to PayPal Settings**: `/provider/dashboard/paypal`
2. **Click "Connect PayPal"** button
3. **Fill out the onboarding form**
4. **Get redirected to PayPal** for account setup
5. **Complete PayPal onboarding** process
6. **Auto-return to platform** via callback
7. **Status synced automatically**

### Key API Endpoints:
- `POST /api/paypal/onboard-seller` - Creates PayPal referral link
- `GET /api/paypal/callback` - Handles return from PayPal (production only)
- `POST /api/paypal/refresh-status` - Syncs PayPal connection status

## 🐛 Troubleshooting

### 1. 401 Authentication Errors
- **Check**: Environment variables are set
- **Fix**: Run `source ./set-paypal-env.sh` before starting server

### 2. 400 INVALID_PARAMETER_SYNTAX (action_renewal_url)
- **Problem**: PayPal rejects localhost URLs
- **Solution**: ✅ **FIXED** - Simplified onboarding for localhost development

### 3. "PayPal configuration missing" 
- **Check**: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
- **Fix**: Set the public client ID environment variable

### 4. Manual Status Sync Required (Development)
- **Expected Behavior**: In localhost development, vendors need to manually sync
- **Process**: Complete PayPal onboarding → Return to platform → Click "Refresh Status"
- **Why**: PayPal cannot callback to localhost URLs

### 5. Auto-return Not Working (Development)
- **Normal**: PayPal keeps vendors on their success page for localhost
- **Solution**: Use "Refresh Status" button after completing onboarding

## 📝 Notes

- **Localhost Limitation**: PayPal partner referrals cannot callback to localhost URLs
- **Development Workflow**: Manual status refresh required for localhost testing
- **Production Ready**: Auto-callbacks work with public URLs in production
- **Same Credentials**: Uses the same PayPal app as your successful integration
- **Merchant ID**: Your working merchant ID is `SANDBOX-BUS-27378152`
- **Multiple Vendors**: Each vendor gets their own PayPal merchant account
- **Commission Splitting**: Automatic via PayPal Marketplace features

## ✅ Development vs Production

| Feature | Development (localhost) | Production (public URL) |
|---------|------------------------|-------------------------|
| Partner Referral | ✅ Simplified flow | ✅ Full flow with callbacks |
| Onboarding URL | ✅ Works | ✅ Works |
| Auto-return | ❌ Manual sync required | ✅ Automatic |
| Status Updates | 🔄 "Refresh Status" button | ✅ Real-time |
| Vendor Experience | Good with instructions | Seamless |

## ✅ Verification Steps

1. **Check environment**: `node -e "console.log('Client ID:', process.env.PAYPAL_SANDBOX_CLIENT_ID ? 'SET' : 'NOT SET')"`
2. **Test PayPal client**: `node -e "const {PayPalClient} = require('./src/lib/payment/paypal-client.js'); new PayPal8Client();"`
3. **Start with env**: `source ./set-paypal-env.sh && npm run dev`
4. **Check logs**: Look for "🔧 Localhost detected" message
5. **Test onboarding**: Try vendor onboarding flow in browser

## 🔐 Security Notes

- Environment variables contain sensitive PayPal credentials
- Never commit `.env*` files to version control
- For production deployment, set environment variables in hosting platform
- Use the script provided (`set-paypal-env.sh`) for local development 
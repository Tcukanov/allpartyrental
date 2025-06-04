#!/bin/bash
# PayPal Environment Variables for Vendor Onboarding
# These are the same credentials used for your successful PayPal integration

export PAYPAL_MODE=sandbox
export PAYPAL_SANDBOX_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
export PAYPAL_SANDBOX_CLIENT_SECRET=EKmv6KdCCCyqQcF73yNY9RmGfIwHD8dPb7dLZz8O1q2QzLPXvCXM5uZJlL0GXdqN-3PEKCfXC4NCN-b4
export NEXT_PUBLIC_PAYPAL_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
export PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# Legacy compatibility
export PAYPAL_CLIENT_ID=ARS0BUuLt3_aqLhj9j-TiuqnpjwN1_-5IXKNQxPHxCdUCJJ3Nzu_Qz0X2xpY9KeFfGLyHBKQfN7sGBzk
export PAYPAL_CLIENT_SECRET=EKmv6KdCCCyqQcF73yNY9RmGfIwHD8dPb7dLZz8O1q2QzLPXvCXM5uZJlL0GXdqN-3PEKCfXC4NCN-b4

echo "✅ PayPal environment variables set for vendor onboarding"
echo "🚀 Ready to start development server with: npm run dev" 
import { prisma } from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

/**
 * Gets PayPal configuration based on the current mode
 * This will load from system settings if available, otherwise from environment variables
 */
export const getPayPalConfig = async () => {
  try {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Try to get settings from the database first
    const settings = await prisma.systemSettings.findFirst();
    
    const mode = settings?.payments?.paypalMode || process.env.PAYPAL_MODE || 'sandbox';
    const isSandbox = mode !== 'live';

    // If we have database settings, use those
    if (settings?.payments) {
      const payments = settings.payments;
      
      if (isSandbox) {
        return {
          mode: 'sandbox',
          clientId: payments.paypalSandboxClientId || process.env.PAYPAL_SANDBOX_CLIENT_ID || (isDevelopment ? 'dummy-sandbox-client-id' : ''),
          clientSecret: payments.paypalSandboxClientSecret || process.env.PAYPAL_SANDBOX_CLIENT_SECRET || (isDevelopment ? 'dummy-sandbox-client-secret' : ''),
          partnerId: payments.paypalPartnerId || process.env.PAYPAL_PARTNER_ID || (isDevelopment ? 'dummy-partner-id' : ''),
          webhookId: process.env.PAYPAL_SANDBOX_WEBHOOK_ID || (isDevelopment ? 'dummy-webhook-id' : ''),
          webhookSecret: process.env.PAYPAL_SANDBOX_WEBHOOK_SECRET || (isDevelopment ? 'dummy-webhook-secret' : ''),
        };
      } else {
        return {
          mode: 'live',
          clientId: payments.paypalLiveClientId || process.env.PAYPAL_LIVE_CLIENT_ID || '',
          clientSecret: payments.paypalLiveClientSecret || process.env.PAYPAL_LIVE_CLIENT_SECRET || '',
          partnerId: payments.paypalPartnerId || process.env.PAYPAL_PARTNER_ID || '',
          webhookId: process.env.PAYPAL_LIVE_WEBHOOK_ID || '',
          webhookSecret: process.env.PAYPAL_LIVE_WEBHOOK_SECRET || '',
        };
      }
    }
    
    // Fallback to environment variables with development defaults
    if (isSandbox) {
      return {
        mode: 'sandbox',
        clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID || (isDevelopment ? 'dummy-sandbox-client-id' : ''),
        clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET || (isDevelopment ? 'dummy-sandbox-client-secret' : ''),
        partnerId: process.env.PAYPAL_PARTNER_ID || (isDevelopment ? 'dummy-partner-id' : ''),
        webhookId: process.env.PAYPAL_SANDBOX_WEBHOOK_ID || (isDevelopment ? 'dummy-webhook-id' : ''),
        webhookSecret: process.env.PAYPAL_SANDBOX_WEBHOOK_SECRET || (isDevelopment ? 'dummy-webhook-secret' : ''),
      };
    } else {
      return {
        mode: 'live',
        clientId: process.env.PAYPAL_LIVE_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_LIVE_CLIENT_SECRET || '',
        partnerId: process.env.PAYPAL_PARTNER_ID || '',
        webhookId: process.env.PAYPAL_LIVE_WEBHOOK_ID || '',
        webhookSecret: process.env.PAYPAL_LIVE_WEBHOOK_SECRET || '',
      };
    }
  } catch (error) {
    logger.error('Error loading PayPal configuration:', error);
    
    // Check if we're in development mode for fallback
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Default to sandbox with environment variables or dummy values in development
    return {
      mode: 'sandbox',
      clientId: process.env.PAYPAL_SANDBOX_CLIENT_ID || (isDevelopment ? 'dummy-sandbox-client-id' : ''),
      clientSecret: process.env.PAYPAL_SANDBOX_CLIENT_SECRET || (isDevelopment ? 'dummy-sandbox-client-secret' : ''),
      partnerId: process.env.PAYPAL_PARTNER_ID || (isDevelopment ? 'dummy-partner-id' : ''),
      webhookId: process.env.PAYPAL_SANDBOX_WEBHOOK_ID || (isDevelopment ? 'dummy-webhook-id' : ''),
      webhookSecret: process.env.PAYPAL_SANDBOX_WEBHOOK_SECRET || (isDevelopment ? 'dummy-webhook-secret' : ''),
    };
  }
};

/**
 * Gets the currently active payment provider
 * Returns 'paypal' or 'stripe'
 */
export const getActivePaymentProvider = async () => {
  try {
    // Try to get settings from the database
    const settings = await prisma.systemSettings.findFirst();
    
    // Return the active provider from settings, with paypal as default
    return settings?.payments?.activePaymentProvider || process.env.ACTIVE_PAYMENT_PROVIDER || 'paypal';
  } catch (error) {
    logger.error('Error getting active payment provider:', error);
    // Default to PayPal if we can't determine
    return process.env.ACTIVE_PAYMENT_PROVIDER || 'paypal';
  }
};

/**
 * Gets the API base URL based on the mode
 */
export const getPayPalApiUrl = (mode = 'sandbox') => {
  return mode === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
};

/**
 * Gets the client-side SDK URL with the client ID
 */
export const getPayPalSdkUrl = async () => {
  const config = await getPayPalConfig();
  return `https://www.paypal.com/sdk/js?client-id=${config.clientId}&currency=USD`;
}; 
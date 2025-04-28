/**
 * Fee Settings Utility
 * Handles retrieving platform fee settings from the database
 */

import { prisma } from '@/lib/prisma/client';

// Default fee percentages
const DEFAULT_CLIENT_FEE_PERCENT = 5.0;
const DEFAULT_PROVIDER_FEE_PERCENT = 12.0;

/**
 * Get client fee percentage from system settings
 * @returns {Promise<number>} Client fee percentage
 */
export async function getClientFeePercent() {
  try {
    // Try to get the client fee from system settings
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'payments.clientFeePercent' }
    });
    
    if (setting?.value) {
      const feePercent = parseFloat(setting.value);
      if (!isNaN(feePercent) && feePercent >= 0) {
        return feePercent;
      }
    }
    
    // Return default if not found or invalid
    return DEFAULT_CLIENT_FEE_PERCENT;
  } catch (error) {
    console.error('Error retrieving client fee percentage:', error);
    return DEFAULT_CLIENT_FEE_PERCENT;
  }
}

/**
 * Get provider fee percentage from system settings
 * @returns {Promise<number>} Provider fee percentage
 */
export async function getProviderFeePercent() {
  try {
    // Try to get the provider fee from system settings
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'payments.providerFeePercent' }
    });
    
    if (setting?.value) {
      const feePercent = parseFloat(setting.value);
      if (!isNaN(feePercent) && feePercent >= 0) {
        return feePercent;
      }
    }
    
    // Return default if not found or invalid
    return DEFAULT_PROVIDER_FEE_PERCENT;
  } catch (error) {
    console.error('Error retrieving provider fee percentage:', error);
    return DEFAULT_PROVIDER_FEE_PERCENT;
  }
}

/**
 * Get both fee percentages from system settings
 * @returns {Promise<{ clientFeePercent: number, providerFeePercent: number }>} Fee percentages
 */
export async function getFeeSettings() {
  try {
    // Get both fee percentages at once
    const settings = await prisma.systemSettings.findMany({
      where: { 
        key: {
          in: ['payments.clientFeePercent', 'payments.providerFeePercent']
        }
      }
    });
    
    let clientFeePercent = DEFAULT_CLIENT_FEE_PERCENT;
    let providerFeePercent = DEFAULT_PROVIDER_FEE_PERCENT;
    
    // Parse the settings
    settings.forEach(setting => {
      const value = parseFloat(setting.value);
      if (!isNaN(value) && value >= 0) {
        if (setting.key === 'payments.clientFeePercent') {
          clientFeePercent = value;
        } else if (setting.key === 'payments.providerFeePercent') {
          providerFeePercent = value;
        }
      }
    });
    
    return { clientFeePercent, providerFeePercent };
  } catch (error) {
    console.error('Error retrieving fee settings:', error);
    return {
      clientFeePercent: DEFAULT_CLIENT_FEE_PERCENT,
      providerFeePercent: DEFAULT_PROVIDER_FEE_PERCENT
    };
  }
} 
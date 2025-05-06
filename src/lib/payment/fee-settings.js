/**
 * Fee Settings Utility
 * Handles retrieving platform fee settings from the database
 */

import { prisma } from '@/lib/prisma/client';

// Default fee percentages
const DEFAULT_CLIENT_FEE_PERCENT = 5.0;
const DEFAULT_PROVIDER_FEE_PERCENT = 12.0;

/**
 * Parse a percentage value ensuring it's a valid number
 * @param {string|number} value - The percentage value to parse
 * @param {number} defaultValue - Default value to use if parsing fails
 * @returns {number} - The parsed percentage value
 */
function parsePercentage(value, defaultValue) {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  
  // Handle string values that might include a % symbol
  if (typeof value === 'string') {
    // Remove any % symbol and trim
    value = value.replace('%', '').trim();
  }
  
  // Parse as float
  const parsed = parseFloat(value);
  
  // Validate the parsed value
  if (isNaN(parsed) || parsed < 0 || parsed > 100) {
    console.warn(`Invalid percentage value: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return parsed;
}

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
      return parsePercentage(setting.value, DEFAULT_CLIENT_FEE_PERCENT);
    }
    
    // Return default if not found
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
      return parsePercentage(setting.value, DEFAULT_PROVIDER_FEE_PERCENT);
    }
    
    // Return default if not found
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
      if (setting.key === 'payments.clientFeePercent') {
        clientFeePercent = parsePercentage(setting.value, DEFAULT_CLIENT_FEE_PERCENT);
      } else if (setting.key === 'payments.providerFeePercent') {
        providerFeePercent = parsePercentage(setting.value, DEFAULT_PROVIDER_FEE_PERCENT);
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

/**
 * Update fee settings in the database
 * @param {Object} params - The fee parameters
 * @param {number|string} params.clientFeePercent - Client fee percentage
 * @param {number|string} params.providerFeePercent - Provider fee percentage
 * @returns {Promise<{ success: boolean, error?: string }>} Result of the update
 */
export async function updateFeeSettings({ clientFeePercent, providerFeePercent }) {
  try {
    // Parse and validate percentages
    const parsedClientFee = parsePercentage(clientFeePercent, null);
    const parsedProviderFee = parsePercentage(providerFeePercent, null);
    
    // Check if both values are valid
    if (parsedClientFee === null && parsedProviderFee === null) {
      return {
        success: false,
        error: 'No valid fee percentages provided'
      };
    }
    
    // Update client fee if provided
    if (parsedClientFee !== null) {
      await prisma.systemSettings.upsert({
        where: { key: 'payments.clientFeePercent' },
        update: { value: parsedClientFee.toString() },
        create: { 
          key: 'payments.clientFeePercent',
          value: parsedClientFee.toString(),
          description: 'Percentage fee charged to clients on transactions'
        }
      });
    }
    
    // Update provider fee if provided
    if (parsedProviderFee !== null) {
      await prisma.systemSettings.upsert({
        where: { key: 'payments.providerFeePercent' },
        update: { value: parsedProviderFee.toString() },
        create: { 
          key: 'payments.providerFeePercent',
          value: parsedProviderFee.toString(),
          description: 'Percentage fee charged to providers on transactions'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating fee settings:', error);
    return {
      success: false,
      error: `Failed to update fee settings: ${error.message}`
    };
  }
} 
/**
 * Fee Configuration Service
 * Centralized management of platform fees from database
 */

import { prisma } from '@/lib/prisma/client';

// Cache for fees to avoid hitting database on every request
let feeCache = null;
let lastFetch = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get platform fee configuration from database
 * Falls back to defaults if not found
 * 
 * @returns {Promise<{clientFeePercent: number, providerFeePercent: number}>}
 */
export async function getPlatformFees() {
  // Return cached value if still valid
  if (feeCache && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
    return feeCache;
  }

  try {
    const settings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: ['platformFeePercent']
        }
      }
    });

    const platformFeePercent = settings.find(s => s.key === 'platformFeePercent')?.value;
    
    // Use the same fee percentage for both client and provider
    const feePercent = platformFeePercent ? parseFloat(platformFeePercent) : 10.0;

    feeCache = {
      clientFeePercent: feePercent,  // Client pays X% added to price
      providerFeePercent: feePercent // Provider pays X% commission
    };

    lastFetch = Date.now();

    console.log('💰 Platform fees loaded from database:', {
      platformFeePercent: `${feePercent}%`,
      cached: true,
      source: platformFeePercent ? 'database' : 'default'
    });

    return feeCache;

  } catch (error) {
    console.error('Error fetching platform fees:', error);
    
    // Return defaults on error
    const defaultFees = {
      clientFeePercent: 10.0,
      providerFeePercent: 10.0
    };

    console.log('⚠️ Using default platform fees (database unavailable):', defaultFees);
    return defaultFees;
  }
}

/**
 * Get just the platform fee percentage (for frontend use)
 * 
 * @returns {Promise<number>}
 */
export async function getPlatformFeePercent() {
  const fees = await getPlatformFees();
  return fees.clientFeePercent;
}

/**
 * Update platform fee percentage in database
 * 
 * @param {number} feePercent - Fee percentage (e.g., 10 for 10%)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePlatformFee(feePercent) {
  try {
    if (typeof feePercent !== 'number' || feePercent < 0 || feePercent > 100) {
      throw new Error('Fee percent must be a number between 0 and 100');
    }

    await prisma.adminSetting.upsert({
      where: { key: 'platformFeePercent' },
      update: { value: feePercent.toString() },
      create: { key: 'platformFeePercent', value: feePercent.toString() }
    });

    // Clear cache to force reload
    feeCache = null;
    lastFetch = null;

    console.log('✅ Platform fee updated:', `${feePercent}%`);

    return { success: true };

  } catch (error) {
    console.error('Error updating platform fee:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Initialize default fee settings if not exists
 */
export async function initializeFeeSettings() {
  try {
    const existing = await prisma.adminSetting.findUnique({
      where: { key: 'platformFeePercent' }
    });

    if (!existing) {
      await prisma.adminSetting.create({
        data: {
          key: 'platformFeePercent',
          value: '10' // Default 10%
        }
      });
      console.log('✅ Initialized default platform fee: 10%');
    }

  } catch (error) {
    console.error('Error initializing fee settings:', error);
  }
}

/**
 * Clear fee cache (useful for testing or after manual database changes)
 */
export function clearFeeCache() {
  feeCache = null;
  lastFetch = null;
  console.log('🔄 Fee cache cleared');
}


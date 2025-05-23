/**
 * Fee Settings Library
 * Manages platform commission and fee rates
 */

import { prisma } from '@/lib/prisma/client';

/**
 * Get current fee settings from admin configuration
 */
export async function getFeeSettings() {
  try {
    // Try to get fee settings from admin settings
    const adminSettings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: ['clientFeePercent', 'providerFeePercent']
        }
      }
    });
    
    // Convert to object format
    const settings = {};
    adminSettings.forEach(setting => {
      settings[setting.key] = parseFloat(setting.value) || 0;
    });
    
    // Return with defaults if not found
    return {
      clientFeePercent: settings.clientFeePercent || 5.0,  // Default 5% client fee
      providerFeePercent: settings.providerFeePercent || 12.0, // Default 12% provider fee
    };
    
  } catch (error) {
    console.error('Error getting fee settings:', error);
    
    // Return defaults on error
    return {
      clientFeePercent: 5.0,
      providerFeePercent: 12.0,
    };
  }
}

/**
 * Update fee settings in admin configuration
 */
export async function updateFeeSettings({ clientFeePercent, providerFeePercent }) {
  try {
    const updates = [];
    
    if (clientFeePercent !== undefined) {
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'clientFeePercent' },
          update: { value: clientFeePercent.toString() },
          create: { key: 'clientFeePercent', value: clientFeePercent.toString() }
        })
      );
    }
    
    if (providerFeePercent !== undefined) {
      updates.push(
        prisma.adminSetting.upsert({
          where: { key: 'providerFeePercent' },
          update: { value: providerFeePercent.toString() },
          create: { key: 'providerFeePercent', value: providerFeePercent.toString() }
        })
      );
    }
    
    await Promise.all(updates);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error updating fee settings:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
} 
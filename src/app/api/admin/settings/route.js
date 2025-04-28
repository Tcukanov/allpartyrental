import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Default settings when none are found in the database
const DEFAULT_SETTINGS = {
  general: {
    siteName: 'AllPartyRent',
    tagline: 'Rent anything, for any party',
    adminEmail: 'admin@allpartyrent.com',
    supportEmail: 'support@allpartyrent.com',
    timezone: 'America/New_York',
    maintenanceMode: false,
  },
  payments: {
    currency: 'USD',
    clientFeePercent: 5.0,
    providerFeePercent: 12.0,
    escrowPeriodHours: 24,
    reviewPeriodHours: 24,
    stripeMode: 'test',
    stripeTestPublicKey: 'pk_test_*****',
    stripeTestSecretKey: 'sk_test_*****',
    stripeLivePublicKey: 'pk_live_*****',
    stripeLiveSecretKey: 'sk_live_*****',
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
    emailService: 'sendgrid',
    sendgridApiKey: 'SG.*****',
    smsService: 'twilio',
    twilioAccountSid: 'AC*****',
    twilioAuthToken: '*****',
    twilioPhoneNumber: '+1234567890',
  },
  security: {
    registrationEnabled: true,
    requireEmailVerification: true,
    twoFactorEnabled: false,
    loginAttempts: 5,
    sessionTimeout: 24,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: true,
  }
};

// Helper function to get settings from SystemSettings table
async function getSettingsFromDatabase() {
  // Create a settings object with default values
  const settings = { ...DEFAULT_SETTINGS };
  
  try {
    // Get all settings from the database
    const dbSettings = await prisma.systemSettings.findMany();
    
    // Organize settings by section
    dbSettings.forEach(setting => {
      const [section, key] = setting.key.split('.');
      
      if (section && key && settings[section]) {
        try {
          // Parse values that should be numbers or booleans
          if (typeof settings[section][key] === 'number') {
            settings[section][key] = parseFloat(setting.value);
          } else if (typeof settings[section][key] === 'boolean') {
            settings[section][key] = setting.value === 'true';
          } else {
            settings[section][key] = setting.value;
          }
        } catch (e) {
          console.error(`Error parsing setting ${setting.key}:`, e);
        }
      }
    });
    
    return settings;
  } catch (error) {
    console.error('Error retrieving settings from database:', error);
    return settings;
  }
}

// Helper function to save settings to SystemSettings table
async function saveSettingsToDatabase(newSettings) {
  try {
    // Flatten the settings object for storage
    const flatSettings = [];
    
    Object.entries(newSettings).forEach(([section, sectionSettings]) => {
      Object.entries(sectionSettings).forEach(([key, value]) => {
        flatSettings.push({
          key: `${section}.${key}`,
          value: value.toString() // Convert all values to strings for storage
        });
      });
    });
    
    // Create a transaction to update all settings at once
    await prisma.$transaction(
      flatSettings.map(setting => 
        prisma.systemSettings.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: {
            key: setting.key,
            value: setting.value
          }
        })
      )
    );
    
    return true;
  } catch (error) {
    console.error('Error saving settings to database:', error);
    throw error;
  }
}

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.warn('Unauthorized access attempt to settings API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      console.warn(`User attempted to access settings without admin privileges`);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    console.info(`Admin retrieved system settings`);
    
    // Get settings from database
    const settings = await getSettingsFromDatabase();
    
    // Return the settings
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings', message: error.message ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.warn('Unauthorized access attempt to update settings API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      console.warn(`User attempted to update settings without admin privileges`);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const newSettings = await request.json();
    
    // Validate settings (simplified, in a real app you'd do more validation)
    if (!newSettings || typeof newSettings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      );
    }
    
    // Save the settings to the database
    await saveSettingsToDatabase(newSettings);
    
    console.info(`Admin updated system settings`);
    
    // Return success
    return NextResponse.json({
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', message: error.message ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
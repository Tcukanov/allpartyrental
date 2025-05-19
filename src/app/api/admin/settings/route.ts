import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Define types for settings
interface GeneralSettings {
  siteName: string;
  contactEmail: string;
  platformFee: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: string;
  tagline: string;
  adminEmail: string;
  supportEmail: string;
  timezone: string;
  maintenanceMode: boolean;
}

interface AppearanceSettings {
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  favicon: string;
  headerStyle: string;
  footerStyle: string;
}

interface PaymentSettings {
  currency: string;
  clientFeePercent: number;
  providerFeePercent: number;
  escrowPeriodHours: number;
  reviewPeriodHours: number;
  paypalMode: string;
  paypalSandboxClientId: string;
  paypalSandboxClientSecret: string;
  paypalLiveClientId: string;
  paypalLiveClientSecret: string;
  paypalPartnerId: string;
  activePaymentProvider: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminAlerts: boolean;
  emailService: string;
  sendgridApiKey: string;
  smsService: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}

interface SecuritySettings {
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  twoFactorEnabled: boolean;
  loginAttempts: number;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
}

interface SystemSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  payments: PaymentSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

// Default settings when none are found in the database
const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'All Party Rent',
    contactEmail: 'contact@example.com',
    platformFee: '15',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    tagline: 'Rent anything, for any party',
    adminEmail: 'admin@allpartyrent.com',
    supportEmail: 'support@allpartyrent.com',
    timezone: 'America/New_York',
    maintenanceMode: false,
  },
  appearance: {
    primaryColor: '#6B46C1',
    accentColor: '#3182CE',
    logoUrl: '/images/logo.png',
    favicon: '/favicon.ico',
    headerStyle: 'default',
    footerStyle: 'default',
  },
  payments: {
    currency: 'USD',
    clientFeePercent: 5.0,
    providerFeePercent: 12.0,
    escrowPeriodHours: 24,
    reviewPeriodHours: 24,
    paypalMode: 'sandbox',
    paypalSandboxClientId: 'sandbox_client_id_*****',
    paypalSandboxClientSecret: 'sandbox_client_secret_*****',
    paypalLiveClientId: 'live_client_id_*****',
    paypalLiveClientSecret: 'live_client_secret_*****',
    paypalPartnerId: 'partner_id_*****',
    activePaymentProvider: 'paypal'
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
async function getSettingsFromDatabase(): Promise<SystemSettings> {
  // Create a settings object with default values
  const settings = { ...DEFAULT_SETTINGS };
  
  try {
    // Get all settings from the database
    const dbSettings = await prisma.systemSettings.findMany();
    
    // Organize settings by section
    dbSettings.forEach(setting => {
      const [section, key] = setting.key.split('.');
      
      if (section && key && settings[section as keyof SystemSettings]) {
        try {
          const sectionObj = settings[section as keyof SystemSettings];
          const typedKey = key as keyof typeof sectionObj;
          
          // Parse values that should be numbers or booleans
          if (typeof sectionObj[typedKey] === 'number') {
            (sectionObj as any)[typedKey] = parseFloat(setting.value);
          } else if (typeof sectionObj[typedKey] === 'boolean') {
            (sectionObj as any)[typedKey] = setting.value === 'true';
          } else {
            (sectionObj as any)[typedKey] = setting.value;
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
async function saveSettingsToDatabase(newSettings: SystemSettings): Promise<boolean> {
  try {
    // Flatten the settings object for storage
    const flatSettings: { key: string; value: string }[] = [];
    
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

export async function GET(request: Request): Promise<NextResponse> {
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
  } catch (error: any) {
    console.error('Error retrieving settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings', message: error.message ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
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
    const newSettings = await request.json() as SystemSettings;
    
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
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', message: error.message ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
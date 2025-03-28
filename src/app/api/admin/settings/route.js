import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

// Mock settings data (in a real app this would be stored in a database)
const SETTINGS = {
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
    platformFeePercent: 5,
    stripeMode: 'test',
    stripeTestPublicKey: 'pk_test_*****',
    stripeTestSecretKey: 'sk_test_*****',
    stripeLivePublicKey: 'pk_live_*****',
    stripeLiveSecretKey: 'sk_live_*****',
    escrowPeriodDays: 7,
    reviewPeriodHours: 24,
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

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      logger.warn('Unauthorized access attempt to settings API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      logger.warn(`User ${session.user.email} attempted to access settings without admin privileges`);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    logger.info(`Admin ${session.user.email} retrieved system settings`);
    
    // Return the settings
    return NextResponse.json(SETTINGS);
  } catch (error) {
    logger.error('Error retrieving settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      logger.warn('Unauthorized access attempt to update settings API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      logger.warn(`User ${session.user.email} attempted to update settings without admin privileges`);
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
    
    // In a real app, you would update these settings in your database
    // For this example, we're just logging that the settings would be updated
    logger.info(`Admin ${session.user.email} updated system settings`);
    
    // Here you would actually save the settings
    // For example: await prisma.settings.update({ data: newSettings })
    
    // Return success
    return NextResponse.json({
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', message: error.message },
      { status: 500 }
    );
  }
} 
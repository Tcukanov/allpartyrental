import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal';

/**
 * Get the provider's PayPal account status
 * This endpoint retrieves the current PayPal connection status for a provider
 */
export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to check PayPal status' },
        { status: 401 }
      );
    }

    console.log(`Checking PayPal status for user ID: ${session.user.id}`);
    
    // Get the provider profile with fresh data - avoid any caching issues
    const user = await prisma.$transaction(async (tx) => {
      return await tx.user.findUnique({
        where: { id: session.user.id },
        include: { provider: true },
      });
    });

    // Ensure the user is a provider
    if (!user) {
      console.error(`User ${session.user.id} not found in database`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!user.provider) {
      console.error(`User ${session.user.id} is not a provider`);
      return NextResponse.json(
        { error: 'Only providers can check PayPal account status' },
        { status: 403 }
      );
    }

    const { paypalMerchantId, paypalEmail, paypalOnboardingComplete } = user.provider;
    console.log(`Provider PayPal status for user ${user.id}, provider ${user.provider.id}:`, {
      merchantId: paypalMerchantId,
      email: paypalEmail,
      onboardingComplete: paypalOnboardingComplete
    });
    
    // Check if the provider has a PayPal merchant ID
    if (!paypalMerchantId) {
      console.log(`No PayPal merchant ID found for provider ${user.provider.id}`);
      return NextResponse.json({
        connected: false,
        paypalMerchantId: null,
        paypalEmail: null,
        paypalOnboardingComplete: false,
        message: 'PayPal account not connected'
      });
    }

    // For sandbox testing, we'll trust the values in the database
    const isDevelopment = process.env.NODE_ENV === 'development';
    let accountStatus = 'CONNECTED';
    
    // Check for various sandbox patterns in merchant ID or email
    const isSandbox = 
      paypalMerchantId.startsWith('SANDBOX_') || 
      paypalEmail?.includes('sandbox') ||
      (paypalEmail && paypalEmail !== user.email); // If using a different email than the user's, it's likely sandbox
    
    let accountType = isSandbox ? 'SANDBOX' : 'PRODUCTION';
    
    // In development, always treat as sandbox
    if (isDevelopment) {
      accountType = 'SANDBOX';
    }
    
    // Only check with PayPal API in production with a valid partner ID
    if (!isDevelopment && !paypalMerchantId.startsWith('SANDBOX_') && process.env.PAYPAL_PARTNER_ID) {
      try {
        const merchantInfo = await paypalClient.getMerchantStatus(paypalMerchantId);
        if (merchantInfo) {
          accountStatus = merchantInfo.status || 'CONNECTED';
        }
      } catch (apiError) {
        console.error('Error checking merchant status with PayPal API:', apiError);
        // Continue with the process even if PayPal API has an issue
      }
    }
    
    const responseData = {
      connected: true,
      paypalMerchantId,
      paypalEmail,
      paypalOnboardingComplete,
      accountStatus,
      accountType,
      message: `PayPal ${accountType.toLowerCase()} account connected`
    };
    
    console.log(`Returning PayPal status for provider ${user.provider.id}:`, responseData);
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error checking PayPal status:', error);
    return NextResponse.json(
      { error: `Failed to check PayPal status: ${error.message}` },
      { status: 500 }
    );
  }
} 
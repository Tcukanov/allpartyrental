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

    // Get the provider profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true },
    });

    // Ensure the user is a provider
    if (!user.provider) {
      return NextResponse.json(
        { error: 'Only providers can check PayPal account status' },
        { status: 403 }
      );
    }

    const { paypalMerchantId, paypalEmail, paypalOnboardingComplete } = user.provider;
    
    // Check if the provider has a PayPal merchant ID
    if (!paypalMerchantId) {
      return NextResponse.json({
        connected: false,
        paypalMerchantId: null,
        paypalEmail: null,
        paypalOnboardingComplete: false,
        message: 'PayPal account not connected'
      });
    }

    // For real accounts, verify the connection status with PayPal
    let accountStatus = 'UNKNOWN';
    try {
      if (!paypalMerchantId.startsWith('MOCK_')) {
        const merchantInfo = await paypalClient.getMerchantStatus(paypalMerchantId);
        if (merchantInfo) {
          accountStatus = merchantInfo.status || 'UNKNOWN';
        }
      } else {
        accountStatus = 'CONNECTED'; // Mock status for development
      }
    } catch (apiError) {
      console.error('Error checking merchant status with PayPal API:', apiError);
      // Continue with the process even if PayPal API has an issue
    }
    
    return NextResponse.json({
      connected: true,
      paypalMerchantId,
      paypalEmail,
      paypalOnboardingComplete,
      accountStatus,
      message: 'PayPal account connected'
    });
  } catch (error) {
    console.error('Error checking PayPal status:', error);
    return NextResponse.json(
      { error: `Failed to check PayPal status: ${error.message}` },
      { status: 500 }
    );
  }
} 
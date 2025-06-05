import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Reset provider's PayPal connection
 * POST /api/paypal/reset-provider
 */
export async function POST(req) {
  console.log('🔄 PayPal reset provider endpoint hit');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Only providers can reset their PayPal connection' }, { status: 403 });
    }

    console.log('🔄 Resetting PayPal connection for provider:', session.user.id);

    // Reset all PayPal-related fields
    const updatedProvider = await prisma.provider.update({
      where: { userId: session.user.id },
      data: {
        paypalMerchantId: null,
        paypalEmail: null,
        paypalOnboardingId: null,
        paypalTrackingId: null,
        paypalOnboardingStatus: 'NOT_STARTED',
        paypalCanReceivePayments: false,
        paypalStatusIssues: null,
        paypalOnboardingComplete: false
      }
    });

    console.log('✅ Provider PayPal connection reset successfully');

    return NextResponse.json({
      success: true,
      message: 'PayPal connection reset successfully. You can now start the onboarding process again.',
      data: {
        onboardingStatus: 'NOT_STARTED',
        canReceivePayments: false
      }
    });

  } catch (error) {
    console.error('💥 PayPal reset error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to reset PayPal connection'
    }, { status: 500 });
  }
} 
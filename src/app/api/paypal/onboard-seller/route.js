import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PayPalClient } from '@/lib/payment/paypal-client';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Only providers can onboard to PayPal' }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, email } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, email' 
      }, { status: 400 });
    }

    const paypalClient = new PayPalClient();
    
    // Check if we're in localhost environment
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    
    // Create PayPal partner referral
    const sellerData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      trackingId: `PROVIDER-${session.user.id}-${Date.now()}`
    };

    // Only add return URL for non-localhost environments
    if (!isLocalhost) {
      sellerData.returnUrl = `${baseUrl}/api/paypal/callback`;
    }

    const referral = await paypalClient.createPartnerReferral(sellerData);

    // Store onboarding information in database - Provider model
    await prisma.provider.update({
      where: { userId: session.user.id },
      data: {
        paypalOnboardingId: referral.partner_referral_id,
        paypalTrackingId: sellerData.trackingId,
        paypalOnboardingStatus: 'PENDING'
      }
    });

    // Extract the action URL for onboarding
    const actionUrl = referral.links?.find(link => link.rel === 'action_url')?.href;

    if (!actionUrl) {
      throw new Error('No action URL received from PayPal');
    }

    // For localhost development, provide additional instructions
    const response = {
      success: true,
      data: {
        onboardingUrl: actionUrl,
        referralId: referral.partner_referral_id,
        trackingId: sellerData.trackingId
      }
    };

    if (isLocalhost) {
      response.data.instructions = {
        message: "For localhost development: Complete the PayPal onboarding process. After completion, return to the PayPal settings page and click 'Refresh Status' to sync your connection.",
        requiresManualSync: true
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('PayPal seller onboarding error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create PayPal onboarding link'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal';

/**
 * Checks and saves the PayPal merchant ID for a provider
 * This endpoint is called after successful PayPal onboarding
 */
export async function POST(request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to check PayPal account' },
        { status: 401 }
      );
    }

    // Get the request body containing merchantId
    const body = await request.json();
    const { merchantId, sandboxEmail } = body;
    
    if (!merchantId && !sandboxEmail) {
      return NextResponse.json(
        { error: 'Merchant ID or sandbox email is required' },
        { status: 400 }
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
        { error: 'Only providers can connect PayPal accounts' },
        { status: 403 }
      );
    }

    let accountStatus = 'CONNECTED';
    let primaryEmail = sandboxEmail || user.email;
    let finalMerchantId = merchantId;
    
    // For sandbox mode, we may not get a merchant ID directly
    // In this case, we can create a placeholder merchant ID based on the email
    if (!finalMerchantId && primaryEmail) {
      // Generate a placeholder merchant ID based on email
      finalMerchantId = `SANDBOX_${Buffer.from(primaryEmail).toString('base64').substring(0, 12)}`;
      console.log(`Generated sandbox merchant ID ${finalMerchantId} for email ${primaryEmail}`);
    }
    
    if (!finalMerchantId) {
      return NextResponse.json(
        { error: 'Could not determine PayPal merchant ID' },
        { status: 400 }
      );
    }
    
    // In production with a real partner account, verify merchant status with PayPal API
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!isDevelopment && process.env.PAYPAL_PARTNER_ID && !finalMerchantId.startsWith('SANDBOX_')) {
      try {
        const merchantInfo = await paypalClient.getMerchantStatus(finalMerchantId);
        if (merchantInfo) {
          accountStatus = merchantInfo.status || 'CONNECTED';
          if (merchantInfo.primary_email) {
            primaryEmail = merchantInfo.primary_email;
          }
        }
      } catch (apiError) {
        console.error('Error checking merchant status with PayPal API:', apiError);
        // Continue with the process even if PayPal API has an issue
      }
    }
    
    console.log(`Updating provider ${user.provider.id} with PayPal info: ID=${finalMerchantId}, Email=${primaryEmail}`);
    
    // Update the provider's PayPal information
    const updatedProvider = await prisma.provider.update({
      where: { id: user.provider.id },
      data: {
        paypalMerchantId: finalMerchantId,
        paypalEmail: primaryEmail,
        paypalOnboardingComplete: true
      }
    });
    
    console.log(`Updated PayPal info for provider ${user.provider.id}, merchant ID: ${finalMerchantId}`);
    
    return NextResponse.json({
      success: true,
      merchantId: finalMerchantId,
      accountStatus,
      primaryEmail
    });
  } catch (error) {
    console.error('Error checking PayPal account:', error);
    return NextResponse.json(
      { error: `Failed to check PayPal account: ${error.message}` },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal/service';

/**
 * Handles the PayPal Connect callback
 * This route will be called when a provider returns from PayPal onboarding
 */
export async function GET(request) {
  try {
    // Get the query parameters
    const { searchParams } = new URL(request.url);
    
    // Get tracking ID and merchant ID from the query parameters
    const trackingId = searchParams.get('tracking_id');
    const merchantId = searchParams.get('merchantId');
    const permissionsGranted = searchParams.get('permissionsGranted');

    console.log(`PayPal callback received: trackingId=${trackingId}, merchantId=${merchantId}, permissionsGranted=${permissionsGranted}`);

    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized access to PayPal callback. Redirecting to sign in.');
      
      // Redirect to sign in page (if we have parameters, include them in the callback)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/signin?callbackUrl=/api/provider/paypal/callback?trackingId=${trackingId || ''}&merchantId=${merchantId || ''}`
      );
    }

    // Check if the merchant ID was provided
    if (!merchantId) {
      console.error('Missing merchantId in PayPal callback');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=Missing+merchantId+in+PayPal+callback`
      );
    }

    // Check if permissions were granted
    if (permissionsGranted !== 'true') {
      console.warn(`User denied PayPal permissions. trackingId=${trackingId}, merchantId=${merchantId}`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=PayPal+permissions+not+granted`
      );
    }

    // Update the provider record with the PayPal merchant ID
    await prisma.provider.update({
      where: { userId: session.user.id },
      data: { 
        paypalMerchantId: merchantId,
        paypalOnboardingComplete: true
      },
    });

    console.log(`Updated provider ${session.user.id} with PayPal merchant ID ${merchantId}`);

    // Redirect to the success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/provider/settings/payments?success=PayPal+account+connected+successfully`
    );
  } catch (error) {
    console.error('PayPal callback error:', error);
    
    // Redirect with error message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=${encodeURIComponent(error.message)}`
    );
  }
} 
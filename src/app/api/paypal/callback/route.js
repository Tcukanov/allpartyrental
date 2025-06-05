import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PayPalClientFixed } from '@/lib/payment/paypal-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');
    const merchantIdInPayPal = searchParams.get('merchantIdInPayPal');
    const permissionsGranted = searchParams.get('permissionsGranted');
    const accountStatus = searchParams.get('accountStatus');
    const consentStatus = searchParams.get('consentStatus');
    const isEmailConfirmed = searchParams.get('isEmailConfirmed');

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.redirect(`https://party-vendors.com/auth/signin`);
    }

    console.log('PayPal callback received:', {
      merchantId,
      merchantIdInPayPal,
      permissionsGranted,
      accountStatus,
      consentStatus,
      isEmailConfirmed
    });

    // Update user's PayPal information
    const updateData = {
      paypalMerchantId: merchantIdInPayPal,
      paypalOnboardingStatus: permissionsGranted === 'true' ? 'COMPLETED' : 'FAILED'
    };

    await prisma.provider.update({
      where: { userId: session.user.id },
      data: updateData
    });

    // If onboarding was successful, check seller status
    if (permissionsGranted === 'true' && merchantIdInPayPal) {
      try {
        const paypalClient = new PayPalClientFixed();
        const statusCheck = await paypalClient.checkSellerStatus(merchantIdInPayPal);
        
        // Update status based on seller validation
        await prisma.provider.update({
          where: { userId: session.user.id },
          data: {
            paypalCanReceivePayments: statusCheck.canReceivePayments,
            paypalStatusIssues: JSON.stringify(statusCheck.issues)
          }
        });
      } catch (error) {
        console.error('Failed to check seller status:', error);
      }
    }

    // Redirect back to provider dashboard with status
    const redirectUrl = permissionsGranted === 'true' 
      ? `https://party-vendors.com/provider/dashboard/paypal?status=success`
      : `https://party-vendors.com/provider/dashboard/paypal?status=failed`;

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('PayPal callback error:', error);
    return NextResponse.redirect(
      `https://party-vendors.com/provider/dashboard/paypal?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PayPalClientFixed } from '@/lib/payment/paypal-client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  console.log('🚀 PayPal callback route hit!');
  try {
    const { searchParams } = new URL(req.url);
    
    // Log ALL parameters received
    console.log('📝 All callback parameters received:');
    for (const [key, value] of searchParams.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const merchantId = searchParams.get('merchantId');
    const merchantIdInPayPal = searchParams.get('merchantIdInPayPal');
    const permissionsGranted = searchParams.get('permissionsGranted');
    const accountStatus = searchParams.get('accountStatus');
    const consentStatus = searchParams.get('consentStatus');
    const isEmailConfirmed = searchParams.get('isEmailConfirmed');

    const session = await getServerSession(authOptions);
    
    console.log('👤 Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });
    
    if (!session?.user) {
      console.log('❌ No session found, redirecting to signin');
      const baseUrl = process.env.NEXTAUTH_URL || 'https://allpartyrental.com';
      return NextResponse.redirect(`${baseUrl}/auth/signin`);
    }

    console.log('📋 PayPal callback received:', {
      merchantId,
      merchantIdInPayPal,
      permissionsGranted,
      accountStatus,
      consentStatus,
      isEmailConfirmed,
      userId: session.user.id
    });

    // Update user's PayPal information
    const updateData = {
      paypalMerchantId: merchantIdInPayPal,
      paypalOnboardingStatus: permissionsGranted === 'true' ? 'COMPLETED' : 'FAILED',
      paypalEmail: session.user.email // Store email as fallback
    };

    console.log('💾 Updating provider with data:', updateData);

    const updatedProvider = await prisma.provider.update({
      where: { userId: session.user.id },
      data: updateData
    });

    console.log('✅ Provider updated successfully:', {
      id: updatedProvider.id,
      paypalMerchantId: updatedProvider.paypalMerchantId,
      paypalOnboardingStatus: updatedProvider.paypalOnboardingStatus
    });

    // If onboarding was successful, check seller status
    if (permissionsGranted === 'true' && merchantIdInPayPal) {
      console.log('🔍 Checking seller status for merchant:', merchantIdInPayPal);
      try {
        const paypalClient = new PayPalClientFixed();
        const statusCheck = await paypalClient.checkSellerStatus(merchantIdInPayPal);
        
        console.log('📊 Seller status check result:', statusCheck);
        
        // Update status based on seller validation
        const statusUpdateData = {
          paypalCanReceivePayments: statusCheck.canReceivePayments,
          paypalStatusIssues: statusCheck.issues ? JSON.stringify(statusCheck.issues) : null
        };
        
        console.log('💾 Updating status with:', statusUpdateData);
        
        await prisma.provider.update({
          where: { userId: session.user.id },
          data: statusUpdateData
        });
        
        console.log('✅ Status updated successfully');
      } catch (error) {
        console.error('❌ Failed to check seller status:', error);
      }
    }

    // Redirect back to provider dashboard with status
    const baseUrl = process.env.NEXTAUTH_URL || 'https://allpartyrental.com';
    const redirectUrl = permissionsGranted === 'true' 
      ? `${baseUrl}/provider/dashboard/paypal?status=success&merchant=${encodeURIComponent(merchantIdInPayPal || 'unknown')}`
      : `${baseUrl}/provider/dashboard/paypal?status=failed`;

    console.log('🔄 Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('💥 PayPal callback error:', error);
    const baseUrl = process.env.NEXTAUTH_URL || 'https://allpartyrental.com';
    return NextResponse.redirect(
      `${baseUrl}/provider/dashboard/paypal?status=error&message=${encodeURIComponent(error.message)}`
    );
  }
} 
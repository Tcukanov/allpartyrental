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
    let statusCheckResult = null;
    if (permissionsGranted === 'true' && merchantIdInPayPal) {
      console.log('🔍 Checking seller status for merchant:', merchantIdInPayPal);
      try {
        const paypalClient = new PayPalClientFixed();
        statusCheckResult = await paypalClient.checkSellerStatus(merchantIdInPayPal);
        
        console.log('📊 Seller status check result:', statusCheckResult);
        
        // Update status based on seller validation
        const statusUpdateData = {
          paypalCanReceivePayments: statusCheckResult.canReceivePayments,
          paypalStatusIssues: statusCheckResult.issues && statusCheckResult.issues.length > 0 
            ? JSON.stringify(statusCheckResult.issues) 
            : null
        };
        
        console.log('💾 Updating status with:', statusUpdateData);
        
        await prisma.provider.update({
          where: { userId: session.user.id },
          data: statusUpdateData
        });
        
        if (statusCheckResult.canReceivePayments) {
          console.log('✅ Status updated successfully - account can receive payments');
        } else {
          console.log('⚠️ Status updated - account has issues preventing payments:', statusCheckResult.issues);
        }
      } catch (error) {
        console.error('❌ Failed to check seller status:', error);
        
        // IMPORTANT: Save the API error to database so user knows there's an issue
        const errorUpdateData = {
          paypalCanReceivePayments: false,
          paypalStatusIssues: JSON.stringify([{
            type: 'STATUS_CHECK_FAILED',
            message: 'Unable to verify PayPal account status. Please try again later.'
          }])
        };
        
        console.log('💾 Saving error status to database:', errorUpdateData);
        
        await prisma.provider.update({
          where: { userId: session.user.id },
          data: errorUpdateData
        });
      }
    }

    // Redirect back to provider dashboard with appropriate status
    const baseUrl = process.env.NEXTAUTH_URL || 'https://allpartyrental.com';
    let redirectUrl;
    
    if (permissionsGranted !== 'true') {
      // Onboarding was cancelled or failed
      redirectUrl = `${baseUrl}/provider/dashboard/paypal?status=failed`;
    } else if (!merchantIdInPayPal) {
      // No merchant ID received
      redirectUrl = `${baseUrl}/provider/dashboard/paypal?status=error&message=${encodeURIComponent('No merchant ID received from PayPal')}`;
    } else if (statusCheckResult && !statusCheckResult.canReceivePayments) {
      // Connected but has issues (email not confirmed, payments not receivable, etc.)
      redirectUrl = `${baseUrl}/provider/dashboard/paypal?status=connected_with_issues&merchant=${encodeURIComponent(merchantIdInPayPal)}`;
    } else if (statusCheckResult && statusCheckResult.canReceivePayments) {
      // Fully connected and ready
      redirectUrl = `${baseUrl}/provider/dashboard/paypal?status=success&merchant=${encodeURIComponent(merchantIdInPayPal)}`;
    } else {
      // Status check failed (API error)
      redirectUrl = `${baseUrl}/provider/dashboard/paypal?status=verification_pending&merchant=${encodeURIComponent(merchantIdInPayPal)}`;
    }

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
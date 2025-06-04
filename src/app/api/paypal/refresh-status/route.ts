import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { PayPalClient } from "@/lib/payment/paypal-client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get provider record
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      return NextResponse.json({ 
        error: 'Provider record not found' 
      }, { status: 404 });
    }

    const paypalClient = new PayPalClient();
    let updateData: any = {};
    let statusMessage = 'PayPal status refreshed';

    // If we have a merchant ID, verify status with PayPal
    if (provider.paypalMerchantId) {
      try {
        const statusCheck = await paypalClient.checkSellerStatus(provider.paypalMerchantId);
        
        updateData = {
          paypalCanReceivePayments: statusCheck.canReceivePayments,
          paypalStatusIssues: statusCheck.issues.length > 0 ? JSON.stringify(statusCheck.issues) : null,
          paypalOnboardingStatus: statusCheck.canReceivePayments ? 'COMPLETED' : 'PENDING'
        };
        
        statusMessage = statusCheck.canReceivePayments 
          ? 'PayPal account verified and ready to receive payments'
          : 'PayPal account found but has issues preventing payments';
          
      } catch (error) {
        console.error('Failed to check PayPal status:', error);
        
        return NextResponse.json({
          success: false,
          error: 'Unable to verify PayPal status. Please try again later or contact support.',
          data: {
            merchantId: provider.paypalMerchantId,
            email: provider.paypalEmail,
            canReceivePayments: provider.paypalCanReceivePayments || false,
            onboardingStatus: provider.paypalOnboardingStatus || 'UNKNOWN',
            issues: ['Unable to verify status with PayPal API']
          }
        });
      }
    } 
    // For development: Allow manual connection to known sandbox account
    else if (process.env.NODE_ENV === 'development') {
      // Check if we can connect to the known sandbox merchant ID
      const knownSandboxMerchantId = 'SANDBOX-BUS-27378152';
      const knownSandboxEmail = 'sb-rvbjg42194005@business.example.com';
      
      try {
        console.log('Development mode: Attempting to connect to known sandbox account...');
        const statusCheck = await paypalClient.checkSellerStatus(knownSandboxMerchantId);
        
        // If successful, connect to this account
        updateData = {
          paypalMerchantId: knownSandboxMerchantId,
          paypalEmail: knownSandboxEmail,
          paypalCanReceivePayments: statusCheck.canReceivePayments,
          paypalStatusIssues: statusCheck.issues.length > 0 ? JSON.stringify(statusCheck.issues) : null,
          paypalOnboardingStatus: 'COMPLETED'
        };
        
        statusMessage = 'Connected to development sandbox account';
        
      } catch (error) {
        console.log('Could not connect to known sandbox account:', error.message);
        
        return NextResponse.json({
          success: false,
          error: 'No PayPal connection found. Please complete PayPal onboarding or contact support for development environment setup.',
          data: {
            merchantId: null,
            email: null,
            canReceivePayments: false,
            onboardingStatus: 'NOT_STARTED',
            issues: ['PayPal onboarding required']
          }
        });
      }
    }
    // Production: Require proper onboarding
    else {
      return NextResponse.json({
        success: false,
        error: 'No PayPal merchant ID found. Please complete PayPal onboarding first.',
        data: {
          merchantId: null,
          email: null,
          canReceivePayments: false,
          onboardingStatus: 'NOT_STARTED',
          issues: []
        }
      });
    }

    // Update provider with refreshed status
    await prisma.provider.update({
      where: { userId: session.user.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: statusMessage,
      data: {
        merchantId: updateData.paypalMerchantId || provider.paypalMerchantId,
        email: updateData.paypalEmail || provider.paypalEmail,
        canReceivePayments: updateData.paypalCanReceivePayments,
        onboardingStatus: updateData.paypalOnboardingStatus,
        issues: updateData.paypalStatusIssues ? JSON.parse(updateData.paypalStatusIssues) : []
      }
    });

  } catch (error) {
    console.error('Error refreshing PayPal status:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh PayPal status' 
    }, { status: 500 });
  }
} 
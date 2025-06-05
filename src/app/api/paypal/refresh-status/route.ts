import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { PayPalClientFixed } from "@/lib/payment/paypal-client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get or create provider record
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create provider record if it doesn't exist
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business'
        }
      });
    }

    const paypalClient = new PayPalClientFixed();
    let updateData: any = {};
    let statusMessage = 'PayPal status refreshed';

    if (provider.paypalMerchantId) {
      console.log('🔍 Checking status for existing merchant ID:', provider.paypalMerchantId);
      
      // Check if this is an auto-generated merchant ID (development mode)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isAutoMerchantId = provider.paypalMerchantId?.startsWith('auto-merchant-');
      
      if (isDevelopment && isAutoMerchantId) {
        // For auto-generated merchant IDs in development, enable payments automatically
        console.log('🔧 Development mode - enabling auto-merchant for payments');
        updateData = {
          paypalCanReceivePayments: true,
          paypalOnboardingStatus: 'COMPLETED',
          paypalStatusIssues: null
        };
        statusMessage = 'Development sandbox account ready - payments enabled!';
      } else {
        // Try to verify with real PayPal API
        try {
          const statusCheck = await paypalClient.checkSellerStatus(provider.paypalMerchantId);

          if (statusCheck.canReceivePayments) {
            updateData = {
              paypalCanReceivePayments: true,
              paypalOnboardingStatus: 'COMPLETED',
              paypalStatusIssues: null
            };
            statusMessage = 'PayPal connection verified - ready to receive payments!';
          } else {
            updateData = {
              paypalCanReceivePayments: false,
              paypalOnboardingStatus: 'ISSUES',
              paypalStatusIssues: JSON.stringify(statusCheck.issues)
            };
            statusMessage = 'PayPal account has issues that prevent receiving payments';
          }
        } catch (error) {
          console.error('Error checking PayPal merchant status:', error);
          updateData = {
            paypalCanReceivePayments: false,
            paypalOnboardingStatus: 'ERROR',
            paypalStatusIssues: JSON.stringify([{ 
              type: 'CONNECTION_ERROR', 
              message: 'Failed to verify PayPal account status' 
            }])
          };
          statusMessage = 'Failed to verify PayPal account status';
        }
      }
    } else {
      // No merchant ID - check if in development mode for sandbox connection
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (isDevelopment) {
        // Development mode: Check if onboarding was completed and manually connect
        const knownSandboxMerchantId = 'SANDBOX-BUS-27378152';
        const knownSandboxEmail = session.user.email || 'sb-rvbjg42194005@business.example.com';
        
        console.log('🔧 Development mode - attempting to connect to sandbox account');
        
        // For development, assume successful connection after onboarding
        if ((provider as any).paypalOnboardingStatus === 'PENDING') {
          updateData = {
            paypalMerchantId: knownSandboxMerchantId,
            paypalEmail: knownSandboxEmail,
            paypalCanReceivePayments: true,
            paypalOnboardingStatus: 'COMPLETED',
            paypalStatusIssues: null,
            paypalOnboardingComplete: true
          };
          statusMessage = `Successfully connected to sandbox PayPal account`;
        } else {
          return NextResponse.json({
            error: { 
              message: 'No PayPal merchant ID found. Please complete PayPal onboarding first.' 
            }
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({
          error: { 
            message: 'No PayPal merchant ID found. Please complete PayPal onboarding first.' 
          }
        }, { status: 400 });
      }
    }

    // Update provider with refreshed status
    const updatedProvider = await prisma.provider.update({
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
      error: { message: 'Failed to refresh PayPal status' }
    }, { status: 500 });
  }
} 
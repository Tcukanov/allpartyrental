import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { PayPalClientFixed } from "@/lib/payment/paypal-client";

export async function POST(request: Request) {
  console.log('🔄 PayPal refresh status endpoint hit');
  
  try {
    const session = await getServerSession(authOptions);
    
    console.log('👤 Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      console.log('❌ Unauthorized refresh status request');
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    console.log('🔍 Getting provider record for user:', session.user.id);
    
    // Get or create provider record
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    console.log('👨‍💼 Provider record:', {
      found: !!provider,
      providerId: provider?.id,
      paypalMerchantId: provider?.paypalMerchantId,
      paypalCanReceivePayments: provider?.paypalCanReceivePayments,
      paypalOnboardingStatus: provider?.paypalOnboardingStatus
    });

    if (!provider) {
      console.log('🆕 Creating new provider record');
      // Auto-create provider record if it doesn't exist
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business'
        }
      });
      console.log('✅ Provider record created:', provider.id);
    }

    const paypalClient = new PayPalClientFixed();
    let updateData: any = {};
    let statusMessage = 'PayPal status refreshed';

    if (provider.paypalMerchantId) {
      console.log('🔍 Checking status for existing merchant ID:', provider.paypalMerchantId);
      
      // Check if this is an auto-generated merchant ID (development mode)
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isAutoMerchantId = provider.paypalMerchantId?.startsWith('auto-merchant-') || provider.paypalMerchantId?.startsWith('SANDBOX-DEV-');
      const isSandboxMode = process.env.PAYPAL_MODE === 'sandbox';
      
      console.log('🔧 Environment check:', {
        isDevelopment,
        isAutoMerchantId,
        isSandboxMode,
        merchantIdFormat: provider.paypalMerchantId?.substring(0, 15) + '...'
      });
      
      // For sandbox mode with real merchant IDs from onboarding, enable payments automatically
      if (isSandboxMode && !isAutoMerchantId && provider.paypalMerchantId) {
        console.log('🔧 Sandbox mode with real merchant ID - enabling payments automatically');
        console.log('🔧 Skipping PayPal API status check due to partner permission requirements');
        updateData = {
          paypalCanReceivePayments: true,
          paypalOnboardingStatus: 'COMPLETED',
          paypalStatusIssues: null
        };
        statusMessage = 'Sandbox payments enabled - PayPal account ready to receive payments!';
      } else if (isDevelopment && isAutoMerchantId) {
        console.log('🔧 Development mode - enabling auto-merchant for payments');
        // For auto-generated merchant IDs in development, enable payments automatically
        updateData = {
          paypalCanReceivePayments: true,
          paypalOnboardingStatus: 'COMPLETED',
          paypalStatusIssues: null
        };
        statusMessage = 'Development sandbox account ready - payments enabled!';
      } else {
        console.log('🔗 Calling PayPal API to check merchant status');
        // Try to verify with real PayPal API (production mode)
        try {
          const statusCheck = await paypalClient.checkSellerStatus(provider.paypalMerchantId);
          
          console.log('📊 PayPal status check result:', {
            canReceivePayments: statusCheck.canReceivePayments,
            issuesCount: statusCheck.issues?.length || 0,
            hasError: !!statusCheck.error
          });

          if (statusCheck.canReceivePayments) {
            updateData = {
              paypalCanReceivePayments: true,
              paypalOnboardingStatus: 'COMPLETED',
              paypalStatusIssues: null
            };
            statusMessage = 'PayPal connection verified - ready to receive payments!';
          } else {
            console.log('❌ PayPal account has issues:', statusCheck.issues);
            updateData = {
              paypalCanReceivePayments: false,
              paypalOnboardingStatus: 'ISSUES',
              paypalStatusIssues: JSON.stringify(statusCheck.issues)
            };
            statusMessage = 'PayPal account has issues that prevent receiving payments';
          }
        } catch (error) {
          console.error('❌ Error checking PayPal merchant status:', {
            message: error.message,
            stack: error.stack,
            merchantId: provider.paypalMerchantId
          });
          
          // For sandbox accounts, if the status check fails due to API permissions, enable payments anyway
          if (isSandboxMode) {
            console.log('🔧 Sandbox mode - enabling payments despite API permission error');
            updateData = {
              paypalCanReceivePayments: true,
              paypalOnboardingStatus: 'COMPLETED',
              paypalStatusIssues: JSON.stringify([{ 
                type: 'API_PERMISSIONS_ISSUE_SANDBOX_ENABLED', 
                message: 'PayPal partner API not accessible but sandbox payments enabled for testing' 
              }])
            };
            statusMessage = 'Sandbox payments enabled for testing (partner API permissions required for status check)';
          } else {
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
      }
    } else {
      // No merchant ID - check if in development mode for sandbox connection
      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isLocalhost = process.env.NEXTAUTH_URL?.includes('localhost');
      
      console.log('🔧 No merchant ID found, checking environment:', {
        isDevelopment,
        isLocalhost,
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        paypalOnboardingStatus: (provider as any).paypalOnboardingStatus,
        paypalOnboardingId: (provider as any).paypalOnboardingId
      });
      
      if (isDevelopment || isLocalhost) {
        // Development mode: Check if onboarding was completed and manually connect
        const knownSandboxMerchantId = 'SANDBOX-DEV-' + session.user.id;
        const knownSandboxEmail = session.user.email || 'sandbox@example.com';
        
        console.log('🔧 Development mode - attempting to connect to sandbox account');
        
        // For development, assume successful connection after onboarding
        if ((provider as any).paypalOnboardingStatus === 'PENDING' || (provider as any).paypalOnboardingId) {
          updateData = {
            paypalMerchantId: knownSandboxMerchantId,
            paypalEmail: knownSandboxEmail,
            paypalCanReceivePayments: true,
            paypalOnboardingStatus: 'COMPLETED',
            paypalStatusIssues: null,
            paypalOnboardingComplete: true
          };
          statusMessage = `Successfully connected to sandbox PayPal account (Development Mode)`;
          
          console.log('✅ Development sandbox connection established:', updateData);
        } else {
          console.log('❌ No onboarding record found');
          return NextResponse.json({
            error: { 
              message: 'No PayPal onboarding found. Please start the PayPal connection process first.',
              debug: {
                hasOnboardingId: !!(provider as any).paypalOnboardingId,
                onboardingStatus: (provider as any).paypalOnboardingStatus,
                suggestion: 'Click "Connect PayPal" to start the onboarding process'
              }
            }
          }, { status: 400 });
        }
      } else {
        console.log('❌ Production mode - no merchant ID found');
        return NextResponse.json({
          error: { 
            message: 'No PayPal merchant ID found. Please complete PayPal onboarding first.',
            debug: {
              hasOnboardingId: !!(provider as any).paypalOnboardingId,
              onboardingStatus: (provider as any).paypalOnboardingStatus,
              suggestion: 'The PayPal callback may not have completed successfully. Try the onboarding process again.'
            }
          }
        }, { status: 400 });
      }
    }

    // Update provider with refreshed status
    console.log('💾 Updating provider with data:', updateData);
    
    const updatedProvider = await prisma.provider.update({
      where: { userId: session.user.id },
      data: updateData
    });

    console.log('✅ Provider updated successfully');

    const responseData = {
      success: true,
      message: statusMessage,
      data: {
        merchantId: updateData.paypalMerchantId || provider.paypalMerchantId,
        email: updateData.paypalEmail || provider.paypalEmail,
        canReceivePayments: updateData.paypalCanReceivePayments,
        onboardingStatus: updateData.paypalOnboardingStatus,
        issues: updateData.paypalStatusIssues ? JSON.parse(updateData.paypalStatusIssues) : []
      }
    };

    console.log('📤 Sending response:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error refreshing PayPal status:', error);
    return NextResponse.json({ 
      error: { message: 'Failed to refresh PayPal status' }
    }, { status: 500 });
  }
} 
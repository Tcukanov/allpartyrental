import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'PROVIDER') {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }

    // Find the provider record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
    });

    if (!user?.provider) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Provider record not found" } 
      }, { status: 404 });
    }

    const provider = user.provider;

    // If no PayPal merchant ID, can't refresh status
    if (!provider.paypalMerchantId) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "PayPal account not connected" } 
      }, { status: 400 });
    }

    try {
      // Get PayPal access token
      const clientId = process.env.PAYPAL_CLIENT_ID!;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
      const baseURL = process.env.PAYPAL_ENVIRONMENT === 'production' 
        ? 'https://api.paypal.com' 
        : 'https://api.sandbox.paypal.com';

      // Get access token
      const tokenResponse = await fetch(`${baseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Check merchant status
      const merchantResponse = await fetch(`${baseURL}/v1/customer/partners/${clientId}/merchant-integrations/${provider.paypalMerchantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!merchantResponse.ok) {
        console.error('Failed to fetch merchant status:', merchantResponse.status, await merchantResponse.text());
        throw new Error('Failed to fetch merchant status from PayPal');
      }

      const merchantData = await merchantResponse.json();
      console.log('PayPal merchant status:', merchantData);

      // Check if merchant can receive payments
      const canReceivePayments = merchantData.payments_receivable || false;
      const onboardingStatus = merchantData.primary_email_confirmed ? 'COMPLETED' : 'PENDING';
      const issues = [];

      // Check for common issues
      if (!merchantData.primary_email_confirmed) {
        issues.push({ 
          message: "Email address not confirmed. Please check your PayPal account and confirm your email." 
        });
      }

      if (!merchantData.legal_name) {
        issues.push({ 
          message: "Business information incomplete. Please complete your PayPal business profile." 
        });
      }

      // Update provider record with latest status
      const updatedProvider = await prisma.provider.update({
        where: { id: provider.id },
        data: {
          paypalCanReceivePayments: canReceivePayments,
          paypalOnboardingStatus: onboardingStatus,
          paypalStatusIssues: JSON.stringify(issues)
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: {
          canReceivePayments,
          onboardingStatus,
          issues,
          merchantData: {
            merchantId: provider.paypalMerchantId,
            emailConfirmed: merchantData.primary_email_confirmed,
            legalName: merchantData.legal_name,
            paymentsReceivable: merchantData.payments_receivable
          }
        }
      });

    } catch (paypalError: any) {
      console.error('PayPal API error:', paypalError);
      
      // If we can't reach PayPal, assume sandbox account is ready
      if (provider.paypalMerchantId?.includes('SANDBOX')) {
        const updatedProvider = await prisma.provider.update({
          where: { id: provider.id },
          data: {
            paypalCanReceivePayments: true,
            paypalOnboardingStatus: 'COMPLETED',
            paypalStatusIssues: JSON.stringify([])
          }
        });

        return NextResponse.json({ 
          success: true, 
          data: {
            canReceivePayments: true,
            onboardingStatus: 'COMPLETED',
            issues: [],
            merchantData: {
              merchantId: provider.paypalMerchantId,
              emailConfirmed: true,
              legalName: 'Sandbox Account',
              paymentsReceivable: true
            },
            note: 'Sandbox account enabled for testing'
          }
        });
      }

      throw paypalError;
    }

  } catch (error: any) {
    console.error('Error refreshing PayPal status:', error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        message: "Failed to refresh PayPal status",
        details: error.message
      } 
    }, { status: 500 });
  }
} 
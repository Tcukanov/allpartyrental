import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal/service';

/**
 * Updates a provider's PayPal merchant ID manually
 * Used for troubleshooting when automatic onboarding fails
 */
export async function POST(request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to update your PayPal account' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { merchantId } = body;
    
    if (!merchantId || typeof merchantId !== 'string') {
      return NextResponse.json(
        { error: 'A valid PayPal merchant ID is required' },
        { status: 400 }
      );
    }

    // Get the user with their provider profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true },
    });

    // Ensure the user is a provider
    if (!user.provider) {
      return NextResponse.json(
        { error: 'Only providers can update their PayPal account' },
        { status: 403 }
      );
    }

    // Verify the merchant ID with PayPal API if possible
    try {
      const merchantStatus = await paypalClient.getMerchantStatus(merchantId);
      console.log(`Verified PayPal merchant ID ${merchantId} for user ${user.id}: Status=${merchantStatus.status}`);
      
      // Update the provider record
      await prisma.provider.update({
        where: { userId: user.id },
        data: {
          paypalMerchantId: merchantId,
          paypalOnboardingComplete: merchantStatus.status === 'ACTIVE',
          paypalEmail: merchantStatus.primary_email || user.email
        }
      });
      
      return NextResponse.json({
        success: true,
        merchantId,
        message: `PayPal merchant ID updated and verified with status: ${merchantStatus.status}`
      });
    } catch (error) {
      console.error(`Error verifying merchant ID ${merchantId}:`, error);
      
      // If verification fails but we're in development mode, still update the ID
      if (process.env.NODE_ENV === 'development') {
        await prisma.provider.update({
          where: { userId: user.id },
          data: {
            paypalMerchantId: merchantId,
            paypalOnboardingComplete: false
          }
        });
        
        return NextResponse.json({
          success: true,
          merchantId,
          warning: 'In development mode: ID updated without verification',
          message: 'PayPal merchant ID updated, but could not be verified with PayPal.'
        });
      }
      
      return NextResponse.json({
        success: false,
        error: `Failed to verify PayPal merchant ID: ${error.message}`
      });
    }
  } catch (error) {
    console.error('Error updating PayPal account:', error);
    return NextResponse.json(
      { error: `Failed to update PayPal account: ${error.message}` },
      { status: 500 }
    );
  }
} 
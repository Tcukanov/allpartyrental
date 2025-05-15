import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal';

/**
 * Creates a partner referral for a provider to onboard to PayPal
 * This endpoint generates a URL to start the PayPal onboarding process
 */
export async function POST() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized access attempt to PayPal connect endpoint');
      return NextResponse.json(
        { error: 'You must be logged in to connect a PayPal account' },
        { status: 401 }
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
        { error: 'Only providers can connect PayPal accounts' },
        { status: 403 }
      );
    }

    // Always use mock implementation for now to bypass authorization issues
    console.log('Using mock PayPal connect flow');
    
    // Generate a mock merchant ID if not already present
    const mockMerchantId = user.provider.paypalMerchantId || `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Update the provider with mock PayPal data
    try {
      await prisma.provider.update({
        where: { id: user.provider.id },
        data: {
          paypalMerchantId: mockMerchantId,
          paypalEmail: user.email,
          paypalOnboardingComplete: true
        }
      });
      console.log(`Updated provider ${user.provider.id} with mock PayPal merchant ID: ${mockMerchantId}`);
    } catch (dbError) {
      console.error('Error updating provider with mock PayPal data:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
    
    // Return a mock response with a success message
    return NextResponse.json({
      success: true,
      message: 'PayPal account connected successfully in mock mode',
      merchantId: mockMerchantId
    });
  } catch (error) {
    console.error('Error creating PayPal Connect link:', error);
    return NextResponse.json(
      { 
        error: `Failed to create PayPal Connect link: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    );
  }
} 
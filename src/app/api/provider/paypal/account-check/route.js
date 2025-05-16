import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal';

/**
 * Checks and saves the PayPal merchant ID for a provider
 * This endpoint is called after successful PayPal onboarding or manual setup
 */
export async function POST(request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'You must be logged in to connect PayPal account' },
        { status: 401 }
      );
    }

    // Get the request body containing merchantId
    const body = await request.json();
    const { merchantId, sandboxEmail } = body;
    
    if (!merchantId && !sandboxEmail) {
      return NextResponse.json(
        { error: 'Merchant ID or sandbox email is required' },
        { status: 400 }
      );
    }
    
    // Get the provider profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true },
    });

    // Ensure the user is a provider
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    let providerId;
    
    // If provider doesn't exist yet, create it
    if (!user.provider) {
      console.log(`Provider record not found for user ${user.id}, creating new provider record`);
      
      // Create a provider record for this user
      const newProvider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: user.name || 'My Business',
          isVerified: false,
          verificationLevel: 0
        }
      });
      
      providerId = newProvider.id;
      console.log(`Created new provider record with ID ${providerId}`);
    } else {
      providerId = user.provider.id;
      console.log(`Using existing provider record: ${providerId} for user ${user.id}`);
    }

    let accountStatus = 'CONNECTED';
    let primaryEmail = sandboxEmail || user.email;
    // Use the provided merchant ID directly - no more mock IDs
    let finalMerchantId = merchantId;

    if (!finalMerchantId) {
      return NextResponse.json(
        { error: 'A valid PayPal merchant ID is required. Please obtain this from your PayPal Developer Dashboard.' },
        { status: 400 }
      );
    }
    
    console.log(`Updating provider ${providerId} with PayPal info: ID=${finalMerchantId}, Email=${primaryEmail}`);
    
    // Force-set onboarding as complete since we're in manual mode
    console.log(`Directly updating provider ${providerId} with PayPal info in database`);
    
    // Disconnect and reconnect to ensure a fresh connection
    await prisma.$disconnect();
    await prisma.$connect();
    
    // Direct update approach with explicit parameter values
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        paypalMerchantId: finalMerchantId,
        paypalEmail: primaryEmail,
        paypalOnboardingComplete: true,
        // Force update timestamp to ensure changes are detected
        updatedAt: new Date()
      }
    });
    
    // Verify the update was successful
    console.log(`Updated PayPal info for provider ${updatedProvider.id}:`, {
      merchantId: updatedProvider.paypalMerchantId,
      email: updatedProvider.paypalEmail,
      onboardingComplete: updatedProvider.paypalOnboardingComplete
    });
    
    // Extra verification - do a separate query to ensure data was persisted
    const verifyUpdate = await prisma.provider.findUnique({
      where: { id: providerId }
    });
    
    // If verification fails, try a raw SQL update as a last resort
    if (!verifyUpdate.paypalMerchantId || verifyUpdate.paypalMerchantId !== finalMerchantId) {
      console.error(`Verification failed - data not properly saved. Merchant ID expected: ${finalMerchantId}, got: ${verifyUpdate.paypalMerchantId}`);
      
      // Try a raw query as a fallback (use with caution)
      try {
        await prisma.$executeRaw`
          UPDATE "Provider" 
          SET "paypalMerchantId" = ${finalMerchantId}, 
              "paypalEmail" = ${primaryEmail}, 
              "paypalOnboardingComplete" = true,
              "updatedAt" = NOW()
          WHERE "id" = ${providerId}
        `;
        console.log(`Executed raw SQL update for provider ${providerId}`);
      } catch (sqlError) {
        console.error('Error executing raw SQL update:', sqlError);
      }
      
      // Check one more time
      const finalCheck = await prisma.provider.findUnique({
        where: { id: providerId }
      });
      
      console.log(`Final verification check:`, {
        merchantId: finalCheck.paypalMerchantId,
        email: finalCheck.paypalEmail,
        onboardingComplete: finalCheck.paypalOnboardingComplete
      });
    }
    
    // Do one final direct DB query for logging
    try {
      const finalReadCheck = await prisma.$queryRaw`
        SELECT "id", "userId", "paypalMerchantId", "paypalEmail", "paypalOnboardingComplete", "updatedAt"
        FROM "Provider"
        WHERE "id" = ${providerId}
      `;
      console.log('Final DB read check:', finalReadCheck);
    } catch (readError) {
      console.error('Error performing final DB read check:', readError);
    }
    
    return NextResponse.json({
      success: true,
      merchantId: finalMerchantId,
      accountStatus,
      primaryEmail
    });
  } catch (error) {
    console.error('Error checking PayPal account:', error);
    return NextResponse.json(
      { error: `Failed to connect PayPal account: ${error.message}` },
      { status: 500 }
    );
  }
} 
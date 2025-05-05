import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';

/**
 * Handles the Stripe Connect OAuth callback
 * This route will be called by Stripe after a provider completes the Connect onboarding
 * 
 * @returns {Promise<NextResponse>} The response redirecting the user back to the settings page
 */
export async function GET(request) {
  try {
    // Get the authorization code and state from query params
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // Check if code exists
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=missing_code`
      );
    }
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      // Save the code and state in a session or temporary storage 
      // so they can be used after authentication
      // For this implementation, we'll just include them in the URL
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/signin?callbackUrl=/api/provider/stripe/callback?code=${code}&state=${state}`
      );
    }
    
    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Exchange the authorization code for an access token and connected account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    
    // Get the connected account ID
    const connectedAccountId = response.stripe_user_id;
    
    // Find the provider record
    const providerRecord = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!providerRecord) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=provider_not_found`
      );
    }
    
    // Validate the state parameter if provided
    // The state format we used is "userId_timestamp_randomString"
    if (state && state.includes('_')) {
      const stateUserId = state.split('_')[0];
      
      // If the state contains a user ID that doesn't match the authenticated user,
      // we should reject the request
      if (stateUserId && stateUserId !== session.user.id) {
        return NextResponse.redirect(
          `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=invalid_state`
        );
      }
    }
    
    // Update the provider record with the Stripe account ID
    await prisma.provider.update({
      where: { userId: session.user.id },
      data: { stripeAccountId: connectedAccountId },
    });
    
    // Redirect the user back to the payment settings page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/provider/settings/payments?success=true`
    );
  } catch (error) {
    console.error('Stripe callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/provider/settings/payments?error=${encodeURIComponent(error.message)}`
    );
  }
} 
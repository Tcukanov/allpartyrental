import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';

/**
 * Creates an account link for a provider to onboard to Stripe Connect
 * 
 * @returns {Promise<NextResponse>} The response containing the account link URL
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a provider
    const provider = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, email: true },
    });

    if (!provider || provider.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Only providers can connect Stripe accounts' },
        { status: 403 }
      );
    }

    // Check if STRIPE_SECRET_KEY exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY in environment variables");
      return NextResponse.json(
        { error: 'Stripe configuration is missing' },
        { status: 500 }
      );
    }

    // Initialize Stripe with secret key from environment variables
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Check if provider already has a Stripe account
    const existingProvider = await prisma.provider.findUnique({
      where: { userId: provider.id },
      select: { stripeAccountId: true },
    });

    let accountId;
    
    if (existingProvider?.stripeAccountId) {
      // Use existing Stripe account
      accountId = existingProvider.stripeAccountId;
      console.log(`Using existing Stripe account: ${accountId}`);
    } else {
      // Create a new Stripe account
      console.log(`Creating new Stripe account for provider: ${provider.id}`);
      try {
        const account = await stripe.accounts.create({
          type: 'standard',
          email: provider.email,
          metadata: {
            userId: provider.id,
          },
        });
        
        accountId = account.id;
        
        // Update provider with Stripe account ID
        await prisma.provider.update({
          where: { userId: provider.id },
          data: { stripeAccountId: account.id },
        });
      } catch (stripeError) {
        console.error('Stripe account creation error:', stripeError);
        return NextResponse.json(
          { error: `Stripe account creation failed: ${stripeError.message}` },
          { status: 500 }
        );
      }
    }

    // Create an account link for the user to complete onboarding
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?refresh=true`,
        return_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?success=true`,
        type: 'account_onboarding',
      });
      
      return NextResponse.json({ url: accountLink.url });
    } catch (linkError) {
      console.error('Error creating account link:', linkError);
      return NextResponse.json(
        { error: `Failed to create onboarding link: ${linkError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json(
      { error: `Failed to create Stripe Connect link: ${error.message}` },
      { status: 500 }
    );
  }
} 
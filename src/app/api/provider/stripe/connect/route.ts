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
export async function GET(): Promise<NextResponse> {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a provider
    const provider = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
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
    if (provider.provider?.stripeAccountId) {
      // Provider already has a Stripe account, create account link
      try {
        const accountLink = await stripe.accountLinks.create({
          account: provider.provider.stripeAccountId,
          refresh_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?refresh=true`,
          return_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?success=true`,
          type: 'account_onboarding',
        });
        
        return NextResponse.json({ url: accountLink.url });
      } catch (error: any) {
        console.error('Error creating account link:', error);
        
        // If the error is because the account link expired, we can create a new account link
        // or provide a link to the dashboard
        return NextResponse.json(
          { error: `Failed to create account link: ${error.message}` },
          { status: 500 }
        );
      }
    } else {
      // For new providers, create a new Stripe account and then an account link
      try {
        // Create a new account
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: provider.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        
        // Save the account ID in our database
        if (!provider.provider) {
          // Create provider record if it doesn't exist
          await prisma.provider.create({
            data: { 
              userId: provider.id,
              stripeAccountId: account.id,
            },
          });
        } else {
          // Update existing provider record
          await prisma.provider.update({
            where: { userId: provider.id },
            data: { stripeAccountId: account.id },
          });
        }
        
        // Create an account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?refresh=true`,
          return_url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?success=true`,
          type: 'account_onboarding',
        });
        
        return NextResponse.json({ url: accountLink.url });
      } catch (error: any) {
        console.error('Error creating Stripe account or link:', error);
        
        // Check for platform setup errors
        if (error.message && 
            (error.message.includes('Please review the responsibilities') || 
             error.message.includes('platform-profile'))) {
          // This is a platform setup error, redirect with platform_error parameter
          return NextResponse.json(
            { 
              error: 'Stripe Connect platform setup required', 
              platformSetupRequired: true,
              url: `${process.env.NEXTAUTH_URL}/provider/settings/payments?platform_error=true`
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: `Failed to set up Stripe account: ${error.message}` },
          { status: 500 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json(
      { error: `Failed to create Stripe Connect link: ${error.message}` },
      { status: 500 }
    );
  }
} 
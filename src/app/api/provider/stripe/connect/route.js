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

    // Initialize Stripe with secret key from environment variables
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create an account link for the provider to onboard with Stripe
    const account = await stripe.accounts.create({
      type: 'standard',
      email: provider.email,
      metadata: {
        userId: provider.id,
      },
    });

    // Update provider with Stripe account ID
    await prisma.user.update({
      where: { id: provider.id },
      data: { stripeAccountId: account.id },
    });

    // Create an account link for the user to complete onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXTAUTH_URL}/provider/settings?refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/provider/settings?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect link' },
      { status: 500 }
    );
  }
} 
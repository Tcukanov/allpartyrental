import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    // Verify user is a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
    });
    
    if (!user || !user.provider) {
      return NextResponse.json(
        { error: 'User is not a provider' },
        { status: 403 }
      );
    }
    
    const provider = user.provider;
    
    // Check if provider has a Stripe connected account
    if (!provider.stripeAccountId) {
      return NextResponse.json({
        isConnected: false,
        details: null
      });
    }
    
    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(provider.stripeAccountId);
    
    return NextResponse.json({
      isConnected: true,
      details: {
        accountId: provider.stripeAccountId,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        country: account.country,
        defaultCurrency: account.default_currency,
        created: account.created
      }
    });
  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch Stripe status', details: error.message },
      { status: 500 }
    );
  }
} 
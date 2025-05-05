import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';

/**
 * Checks for a connected Stripe account and saves the account ID
 * This is called after a user successfully completes the Stripe OAuth flow
 * 
 * @returns {Promise<NextResponse>} JSON response indicating success or failure
 */
export async function POST() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
    });

    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Only providers can check Stripe accounts' },
        { status: 403 }
      );
    }
    
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Search for the connected account by email
    const accounts = await stripe.accounts.list({
      limit: 10,
    });
    
    // Find an account that matches the provider's email
    const matchingAccount = accounts.data.find(account => 
      account.email === user.email
    );
    
    if (!matchingAccount) {
      return NextResponse.json({
        success: false,
        message: 'No Stripe account found for this email'
      });
    }
    
    // Update the provider record with the Stripe account ID
    await prisma.provider.update({
      where: { id: user.provider.id },
      data: { stripeAccountId: matchingAccount.id },
    });
    
    return NextResponse.json({
      success: true,
      accountId: matchingAccount.id
    });
  } catch (error) {
    console.error('Error checking Stripe account:', error);
    return NextResponse.json(
      { error: `Failed to check Stripe account: ${error.message}` },
      { status: 500 }
    );
  }
} 
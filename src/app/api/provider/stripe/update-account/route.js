import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import Stripe from 'stripe';

/**
 * Manually update a provider's Stripe account ID
 * This is an admin-only operation to help recover accounts that aren't properly linked
 * 
 * @returns {Promise<NextResponse>} JSON response with the update result
 */
export async function POST(request) {
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
        { error: 'Only providers can update their Stripe account' },
        { status: 403 }
      );
    }

    // Get the account ID from the request body
    const data = await request.json();
    const { accountId } = data;

    if (!accountId) {
      return NextResponse.json(
        { error: 'No account ID provided' },
        { status: 400 }
      );
    }

    // Verify the account ID exists in Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      // Update or create the provider record with the new account ID
      await prisma.provider.upsert({
        where: { userId: user.id },
        update: { stripeAccountId: accountId },
        create: {
          userId: user.id,
          stripeAccountId: accountId,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Stripe account ID updated successfully',
        accountId,
        accountDetails: {
          email: account.email,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
        }
      });
    } catch (error) {
      return NextResponse.json(
        { 
          error: `Invalid Stripe account ID: ${error.message}`,
          success: false
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating Stripe account ID:', error);
    return NextResponse.json(
      { error: `Failed to update Stripe account ID: ${error.message}` },
      { status: 500 }
    );
  }
} 
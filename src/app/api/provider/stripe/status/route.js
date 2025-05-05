import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Retrieves the status of a provider's Stripe account
 * 
 * @returns {Promise<NextResponse>} JSON response with the provider's Stripe status
 */
export async function GET() {
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
        { error: 'Only providers can check Stripe status' },
        { status: 403 }
      );
    }

    // Verify Stripe configuration
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Missing STRIPE_SECRET_KEY in environment variables");
      return NextResponse.json(
        { error: 'Stripe configuration is missing' },
        { status: 500 }
      );
    }

    // Initialize Stripe with secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Check if the provider has a Stripe account connected
    if (!user.provider?.stripeAccountId) {
      console.log("No Stripe account ID found for provider");
      
      // Try to find if the provider has an account by email
      try {
        const accounts = await stripe.accounts.list({
          limit: 10,
        });
        
        // Find an account with matching email
        const matchingAccount = accounts.data.find(account => 
          account.email === user.email
        );
        
        if (matchingAccount) {
          // Update the provider with the found account ID
          await prisma.provider.upsert({
            where: { userId: user.id },
            update: { stripeAccountId: matchingAccount.id },
            create: {
              userId: user.id,
              stripeAccountId: matchingAccount.id
            }
          });
          
          console.log(`Found and linked Stripe account ${matchingAccount.id} for provider`);
          
          // Return the updated status with the account we just found
          return NextResponse.json({
            isConnected: true,
            details: {
              accountId: matchingAccount.id,
              payoutsEnabled: matchingAccount.payouts_enabled,
              chargesEnabled: matchingAccount.charges_enabled,
              detailsSubmitted: matchingAccount.details_submitted,
              requiresAction: !matchingAccount.details_submitted || !matchingAccount.payouts_enabled
            }
          });
        }
      } catch (error) {
        console.error("Error looking up Stripe accounts:", error);
      }
      
      // If we didn't find or couldn't look up accounts, return not connected
      return NextResponse.json({ 
        isConnected: false,
        details: null
      });
    }

    // Provider has a stripeAccountId, retrieve account details from Stripe
    try {
      const account = await stripe.accounts.retrieve(user.provider.stripeAccountId);
      
      return NextResponse.json({
        isConnected: true,
        details: {
          accountId: account.id,
          payoutsEnabled: account.payouts_enabled,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
          requiresAction: !account.details_submitted || !account.payouts_enabled
        }
      });
    } catch (error) {
      console.error(`Error retrieving Stripe account ${user.provider.stripeAccountId}:`, error);
      
      // If the account retrieval fails (e.g. account was deleted), clear the ID from the database
      if (error.code === 'account_invalid' || error.code === 'resource_missing') {
        await prisma.provider.update({
          where: { userId: user.id },
          data: { stripeAccountId: null }
        });
      }
      
      return NextResponse.json({ 
        isConnected: false,
        error: `Failed to retrieve Stripe account: ${error.message}`,
        details: null
      });
    }
  } catch (error) {
    console.error('Error checking Stripe status:', error);
    return NextResponse.json(
      { 
        isConnected: false,
        error: `Failed to check Stripe status: ${error.message}`
      },
      { status: 500 }
    );
  }
} 
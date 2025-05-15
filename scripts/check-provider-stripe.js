const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const prisma = new PrismaClient();

async function main() {
  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // 1. Check all providers with their Stripe accounts
    console.log('====== CHECKING PROVIDER STRIPE ACCOUNTS ======');
    const providers = await prisma.provider.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Found ${providers.length} providers`);
    
    for (const provider of providers) {
      console.log(`\nProvider: ${provider.user.name || provider.user.email}`);
      console.log(`- ID: ${provider.id}`);
      console.log(`- User ID: ${provider.userId}`);
      console.log(`- Stripe Account ID: ${provider.stripeAccountId || 'NOT CONNECTED'}`);
      
      if (provider.stripeAccountId) {
        try {
          // Check if the Stripe account exists and is valid
          const stripeAccount = await stripe.accounts.retrieve(provider.stripeAccountId);
          console.log(`- Stripe Account Status: VALID`);
          console.log(`- Charges Enabled: ${stripeAccount.charges_enabled}`);
          console.log(`- Payouts Enabled: ${stripeAccount.payouts_enabled}`);
          console.log(`- Details Submitted: ${stripeAccount.details_submitted}`);
        } catch (error) {
          console.log(`- Stripe Account Status: INVALID (${error.message})`);
        }
      }
    }
    
    // 2. Check recent transactions with payment intents
    console.log('\n\n====== CHECKING RECENT TRANSACTIONS ======');
    const transactions = await prisma.transaction.findMany({
      where: {
        paymentIntentId: {
          not: null
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        offer: {
          include: {
            provider: true,
            client: true,
            service: true
          }
        }
      }
    });
    
    console.log(`Found ${transactions.length} recent transactions with payment intents`);
    
    for (const tx of transactions) {
      console.log(`\nTransaction: ${tx.id}`);
      console.log(`- Amount: ${tx.amount}`);
      console.log(`- Status: ${tx.status}`);
      console.log(`- Payment Intent ID: ${tx.paymentIntentId}`);
      console.log(`- Transfer ID: ${tx.transferId || 'NONE'}`);
      console.log(`- Client: ${tx.offer?.client?.name || tx.offer?.client?.email || 'Unknown'}`);
      console.log(`- Provider: ${tx.offer?.provider?.name || tx.offer?.provider?.email || 'Unknown'}`);
      console.log(`- Provider User ID: ${tx.offer?.provider?.id || 'Unknown'}`);
      
      // Check the provider's Stripe connection
      const provider = await prisma.provider.findFirst({
        where: { userId: tx.offer?.providerId }
      });
      
      console.log(`- Provider Stripe Account: ${provider?.stripeAccountId || 'NOT CONNECTED'}`);
      
      if (tx.paymentIntentId) {
        try {
          // Check the payment intent status
          const paymentIntent = await stripe.paymentIntents.retrieve(tx.paymentIntentId);
          console.log(`- Payment Intent Status: ${paymentIntent.status}`);
          console.log(`- Payment Intent Amount: ${paymentIntent.amount} (${paymentIntent.currency})`);
          console.log(`- Payment Latest Charge: ${paymentIntent.latest_charge || 'None'}`);
          
          // Check if any transfers were made for this payment
          if (paymentIntent.latest_charge) {
            const transfers = await stripe.transfers.list({
              limit: 10,
              destination: provider?.stripeAccountId,
            });
            
            const matchingTransfer = transfers.data.find(t => 
              t.source_transaction === paymentIntent.latest_charge ||
              t.metadata?.paymentIntentId === tx.paymentIntentId
            );
            
            if (matchingTransfer) {
              console.log(`- Transfer Found: ${matchingTransfer.id}`);
              console.log(`- Transfer Amount: ${matchingTransfer.amount} (${matchingTransfer.currency})`);
              console.log(`- Transfer Fee: ${(paymentIntent.amount - matchingTransfer.amount)} (Platform fee)`);
            } else {
              console.log(`- No matching transfer found`);
            }
          }
        } catch (error) {
          console.log(`- Payment Intent Error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking provider Stripe accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
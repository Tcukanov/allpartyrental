const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix script for provider requests
 * This script will check and fix any provider request issues
 */
async function fixProviderRequests() {
  console.log('Starting provider requests fix...');
  
  try {
    // Find all completed transactions
    console.log('Finding completed transactions...');
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        offer: {
          include: {
            provider: true,
            service: true,
            partyService: true
          }
        },
        party: true
      }
    });
    
    console.log(`Found ${transactions.length} completed transactions`);
    
    let fixCount = 0;
    
    // Process each transaction
    for (const transaction of transactions) {
      console.log(`\nProcessing transaction: ${transaction.id}`);
      
      // 1. Check if offer exists
      if (!transaction.offer) {
        console.log('WARNING: Transaction has no associated offer, skipping');
        continue;
      }
      
      console.log(`Associated offer: ${transaction.offer.id}, status: ${transaction.offer.status}`);
      
      // 2. Check if offer status is aligned with transaction
      if (transaction.status === 'COMPLETED' && transaction.offer.status !== 'APPROVED') {
        console.log(`Fixing offer status from ${transaction.offer.status} to APPROVED`);
        await prisma.offer.update({
          where: { id: transaction.offer.id },
          data: { status: 'APPROVED' }
        });
        fixCount++;
      }
      
      // 3. Check if provider ID exists on the offer
      if (!transaction.offer.providerId) {
        if (transaction.offer.service && transaction.offer.service.providerId) {
          console.log(`Fixing missing providerId on offer ${transaction.offer.id}`);
          await prisma.offer.update({
            where: { id: transaction.offer.id },
            data: { providerId: transaction.offer.service.providerId }
          });
          fixCount++;
        } else {
          console.log('WARNING: Cannot fix providerId - no service provider found');
        }
      }
      
      // 4. Check if the service exists on the offer
      if (!transaction.offer.serviceId) {
        console.log('WARNING: Offer has no associated service, cannot fix');
      }
    }
    
    console.log(`\nFix complete. Fixed ${fixCount} issues.`);
    
    // Check for offers with no transactions
    console.log('\nChecking for offers with payment but no transaction...');
    const offersWithoutTransactions = await prisma.offer.findMany({
      where: {
        transaction: null,
        status: 'APPROVED'
      },
      include: {
        service: true,
        partyService: {
          include: {
            party: true
          }
        }
      }
    });
    
    console.log(`Found ${offersWithoutTransactions.length} approved offers with no transaction`);
    
    for (const offer of offersWithoutTransactions) {
      if (offer.partyService && offer.partyService.party) {
        console.log(`Creating missing transaction for offer ${offer.id}`);
        await prisma.transaction.create({
          data: {
            amount: offer.price,
            status: 'COMPLETED',
            paymentIntentId: `fix_payment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            paymentMethodId: 'FIXED',
            party: {
              connect: { id: offer.partyService.party.id }
            },
            offer: {
              connect: { id: offer.id }
            }
          }
        });
        fixCount++;
      } else {
        console.log(`WARNING: Cannot create transaction for offer ${offer.id} - no party found`);
      }
    }
    
    // Finally, check for offers that should be visible in provider requests
    console.log('\nVerifying visibility of provider requests...');
    const providerOffers = await prisma.offer.findMany({
      where: {
        status: {
          in: ['PENDING', 'APPROVED']
        }
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: true
      }
    });
    
    console.log(`Found ${providerOffers.length} offers that should be visible in provider requests`);
    
    // Create a summary of providers and their offers
    const providerSummary = {};
    for (const offer of providerOffers) {
      const providerId = offer.providerId;
      if (!providerSummary[providerId]) {
        providerSummary[providerId] = {
          count: 0,
          provider: offer.provider,
          offers: []
        };
      }
      
      providerSummary[providerId].count++;
      providerSummary[providerId].offers.push({
        id: offer.id,
        status: offer.status,
        serviceName: offer.service?.name || 'Unknown Service'
      });
    }
    
    console.log('\nProvider Requests Summary:');
    for (const providerId in providerSummary) {
      const summary = providerSummary[providerId];
      console.log(`Provider: ${summary.provider?.name || 'Unknown'} (${providerId})`);
      console.log(`Total Requests: ${summary.count}`);
      console.log('Offers:');
      summary.offers.forEach(o => {
        console.log(`- ${o.id} (${o.status}): ${o.serviceName}`);
      });
      console.log('---');
    }
    
    console.log(`\nAll fixes complete. Total fixed: ${fixCount}`);
    return { success: true, fixCount };
    
  } catch (error) {
    console.error('Fix process failed with error:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProviderRequests()
  .then(result => {
    if (result.success) {
      console.log(`\nFix process completed successfully ✅ (${result.fixCount} issues fixed)`);
    } else {
      console.log('\nFix process failed ❌');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during fix process:', error);
    process.exit(1);
  }); 
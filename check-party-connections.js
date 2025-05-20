const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to check and fix party relationships
 */
async function checkPartyConnections() {
  console.log('Starting party connection check...');
  
  try {
    // Find recent transactions to check their corresponding parties
    console.log('Finding recent transactions...');
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        party: {
          include: {
            client: true,
            city: true,
            partyServices: true
          }
        },
        offer: true
      }
    });
    
    console.log(`Found ${transactions.length} recent transactions`);
    
    // Check each transaction's party
    for (const transaction of transactions) {
      if (!transaction.party) {
        console.log(`Transaction ${transaction.id} has no party - skipping`);
        continue;
      }
      
      // Print party details
      const party = transaction.party;
      console.log(`\nParty: ${party.id}`);
      console.log(`  Name: ${party.name}`);
      console.log(`  Created: ${party.createdAt}`);
      console.log(`  Client: ${party.client?.name || 'MISSING!'}`);
      console.log(`  City: ${party.city?.name || 'MISSING!'}`);
      console.log(`  Services: ${party.partyServices?.length || 0}`);
      
      // Summary of party service connections
      if (party.partyServices && party.partyServices.length > 0) {
        console.log('  Party Services:');
        for (const ps of party.partyServices) {
          console.log(`    - ${ps.id}`);
        }
      }
    }
    
    // Find all incomplete parties (missing client or city)
    console.log('\nChecking for incomplete parties...');
    const incompleteParties = await prisma.party.findMany({
      where: {
        OR: [
          { clientId: null },
          { cityId: null }
        ]
      }
    });
    
    console.log(`Found ${incompleteParties.length} incomplete parties`);
    
    // Summary of findings and recommendations
    console.log('\nSUMMARY:');
    console.log('===========');
    console.log(`Total recent transactions checked: ${transactions.length}`);
    console.log(`Incomplete parties found: ${incompleteParties.length}`);
    
    if (incompleteParties.length > 0) {
      console.log('\nTo fix incomplete parties, run:');
      console.log('node fix-party-connections.js');
    } else {
      console.log('\nAll parties appear to have proper connections.');
    }
    
    return { 
      success: true,
      transactionsChecked: transactions.length,
      incompleteParties: incompleteParties.length
    };
    
  } catch (error) {
    console.error('Check failed with error:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkPartyConnections()
  .then(result => {
    if (result.success) {
      console.log(`\nCheck completed successfully ✅`);
    } else {
      console.log('\nCheck failed ❌');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during check:', error);
    process.exit(1);
  }); 
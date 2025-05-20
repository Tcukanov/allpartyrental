const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to fix party relationships
 */
async function fixPartyConnections() {
  console.log('Starting party connection fixes...');
  
  try {
    // Find all incomplete parties (missing client or city)
    console.log('Finding incomplete parties...');
    const incompleteParties = await prisma.party.findMany({
      where: {
        OR: [
          { clientId: null },
          { cityId: null }
        ]
      }
    });
    
    console.log(`Found ${incompleteParties.length} incomplete parties`);
    
    let fixCount = 0;
    
    // Find a default city to use for fixes
    const defaultCity = await prisma.city.findFirst({
      where: { isDefault: true }
    });
    
    if (!defaultCity) {
      console.log('WARNING: No default city found. Creating one...');
      const newCity = await prisma.city.create({
        data: {
          name: 'Default City',
          slug: 'default-city',
          state: 'Default State',
          isDefault: true
        }
      });
      console.log(`Created default city: ${newCity.id}`);
    }
    
    // Process each incomplete party
    for (const party of incompleteParties) {
      console.log(`\nProcessing party: ${party.id}`);
      
      // For each party, find related transactions to get client info
      const transaction = await prisma.transaction.findFirst({
        where: { partyId: party.id },
        include: {
          offer: {
            include: {
              client: true
            }
          }
        }
      });
      
      let clientId = null;
      let cityId = defaultCity ? defaultCity.id : null;
      
      // Try to find client from transaction
      if (transaction && transaction.offer && transaction.offer.clientId) {
        clientId = transaction.offer.clientId;
        console.log(`Found client ID from offer: ${clientId}`);
      }
      
      // If no client found, try to find a valid client user
      if (!clientId) {
        const anyClient = await prisma.user.findFirst({
          where: { role: 'CLIENT' }
        });
        
        if (anyClient) {
          clientId = anyClient.id;
          console.log(`Using default client: ${clientId}`);
        } else {
          console.log('WARNING: No client users found. Creating one...');
          const newClient = await prisma.user.create({
            data: {
              email: 'default-client@example.com',
              name: 'Default Client',
              role: 'CLIENT'
            }
          });
          clientId = newClient.id;
          console.log(`Created default client: ${clientId}`);
        }
      }
      
      // Update the party with correct connections
      if (clientId || cityId) {
        const updateData = {};
        
        if (!party.clientId && clientId) {
          updateData.client = { connect: { id: clientId } };
        }
        
        if (!party.cityId && cityId) {
          updateData.city = { connect: { id: cityId } };
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log(`Updating party ${party.id} with fixed connections:`, updateData);
          await prisma.party.update({
            where: { id: party.id },
            data: updateData
          });
          fixCount++;
        }
      }
    }
    
    console.log(`\nFixed ${fixCount} out of ${incompleteParties.length} parties`);
    
    return { 
      success: true,
      totalFixed: fixCount,
      totalIncomplete: incompleteParties.length
    };
    
  } catch (error) {
    console.error('Fix process failed with error:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPartyConnections()
  .then(result => {
    if (result.success) {
      console.log(`\nFix completed successfully ✅ (${result.totalFixed}/${result.totalIncomplete} fixed)`);
    } else {
      console.log('\nFix failed ❌');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during fix process:', error);
    process.exit(1);
  }); 
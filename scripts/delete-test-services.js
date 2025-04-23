const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const TEST_SERVICE_PREFIX = 'Test Service'; // This should match the prefix used in create-test-services.js
const PROMPT_FOR_CONFIRMATION = true; // Set to false to skip confirmation

async function main() {
  try {
    console.log(`Looking for services with name starting with "${TEST_SERVICE_PREFIX}"...`);
    
    // Get all services with the test prefix
    const testServices = await prisma.service.findMany({
      where: {
        name: {
          startsWith: TEST_SERVICE_PREFIX
        }
      },
      select: {
        id: true,
        name: true,
        providerId: true,
        provider: {
          select: {
            name: true,
            email: true
          }
        },
        offers: {
          select: { id: true }
        },
        partyServices: {
          select: { id: true }
        }
      }
    });
    
    if (testServices.length === 0) {
      console.log('No test services found.');
      return;
    }
    
    console.log(`Found ${testServices.length} test services:`);
    
    // Group services by provider
    const servicesByProvider = {};
    testServices.forEach(service => {
      const providerEmail = service.provider.email;
      if (!servicesByProvider[providerEmail]) {
        servicesByProvider[providerEmail] = {
          providerId: service.providerId,
          providerName: service.provider.name,
          providerEmail,
          services: []
        };
      }
      
      servicesByProvider[providerEmail].services.push({
        id: service.id,
        name: service.name,
        hasOffers: service.offers.length > 0,
        hasPartyServices: service.partyServices.length > 0
      });
    });
    
    // Display grouped services
    Object.values(servicesByProvider).forEach(provider => {
      console.log(`\nProvider: ${provider.providerName} (${provider.providerEmail})`);
      console.log('-'.repeat(80));
      
      provider.services.forEach((service, index) => {
        console.log(`[${index + 1}] ${service.name} (${service.id})`);
        if (service.hasOffers) console.log('    * Has offers associated');
        if (service.hasPartyServices) console.log('    * Has party services associated');
      });
    });
    
    // Prompt for confirmation if enabled
    if (PROMPT_FOR_CONFIRMATION) {
      console.log(`\nAbout to delete all ${testServices.length} services shown above.`);
      
      // Use readline to get user confirmation
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const confirmed = await new Promise(resolve => {
        readline.question('Are you sure you want to proceed? (yes/no): ', answer => {
          readline.close();
          resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
      });
      
      if (!confirmed) {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    console.log(`\nDeleting ${testServices.length} test services with dependencies...`);
    
    // Use a transaction to safely delete services and dependencies
    const result = await prisma.$transaction(async (prisma) => {
      let deletedCount = 0;
      
      for (const service of testServices) {
        try {
          // Delete related offers and their dependencies
          for (const offer of service.offers) {
            // Delete any related chat and messages
            const chat = await prisma.chat.findUnique({
              where: { offerId: offer.id }
            });
            
            if (chat) {
              // Delete messages first
              await prisma.message.deleteMany({
                where: { chatId: chat.id }
              });
              
              // Delete chat
              await prisma.chat.delete({
                where: { id: chat.id }
              });
            }
            
            // Check for transaction
            const transaction = await prisma.transaction.findUnique({
              where: { offerId: offer.id }
            });
            
            if (transaction) {
              // Check for dispute
              const dispute = await prisma.dispute.findUnique({
                where: { transactionId: transaction.id }
              });
              
              if (dispute) {
                await prisma.dispute.delete({
                  where: { id: dispute.id }
                });
              }
              
              // Delete transaction
              await prisma.transaction.delete({
                where: { id: transaction.id }
              });
            }
          }
          
          // Delete all offers
          if (service.offers.length > 0) {
            await prisma.offer.deleteMany({
              where: { serviceId: service.id }
            });
          }
          
          // Delete party services
          if (service.partyServices.length > 0) {
            await prisma.partyService.deleteMany({
              where: { serviceId: service.id }
            });
          }
          
          // Finally delete the service
          await prisma.service.delete({
            where: { id: service.id }
          });
          
          deletedCount++;
          console.log(`Deleted service: ${service.name} (${service.id})`);
        } catch (error) {
          console.error(`Error deleting service ${service.id}: ${error.message}`);
        }
      }
      
      return { deletedCount };
    });
    
    console.log(`\nSuccessfully deleted ${result.deletedCount} out of ${testServices.length} test services.`);
    
    if (result.deletedCount < testServices.length) {
      console.log(`Some services could not be deleted. They might have additional dependencies not handled by this script.`);
    }
    
  } catch (error) {
    console.error('Error deleting test services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
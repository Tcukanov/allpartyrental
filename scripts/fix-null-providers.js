const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNullProviders() {
  try {
    console.log('Checking for services with null provider IDs...');
    
    // Since providerId is required in schema, let's check the raw database
    const servicesWithNullProvider = await prisma.$queryRaw`
      SELECT id, name, "providerId", "categoryId" 
      FROM "Service" 
      WHERE "providerId" IS NULL
    `;
    
    console.log(`Found ${servicesWithNullProvider.length} services with null provider IDs`);
    
    if (servicesWithNullProvider.length > 0) {
      console.log('Services with null provider IDs:');
      servicesWithNullProvider.forEach(service => {
        console.log(`- Service ID: ${service.id}, Name: ${service.name}, Provider ID: ${service.providerId}`);
      });
      
      // Option 1: Delete services with null provider IDs using raw query
      console.log('\nDeleting services with null provider IDs...');
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM "Service" WHERE "providerId" IS NULL
      `;
      
      console.log(`Deleted ${deleteResult} services with null provider IDs`);
    } else {
      console.log('No services with null provider IDs found.');
    }
    
    // Check for orphaned services (provider doesn't exist)
    console.log('\nChecking for services with invalid provider IDs...');
    const allServices = await prisma.service.findMany({
      include: {
        provider: true
      }
    });
    
    const orphanedServices = allServices.filter(service => service.providerId && !service.provider);
    console.log(`Found ${orphanedServices.length} services with invalid provider IDs`);
    
    if (orphanedServices.length > 0) {
      console.log('Services with invalid provider IDs:');
      orphanedServices.forEach(service => {
        console.log(`- Service ID: ${service.id}, Name: ${service.name}, Provider ID: ${service.providerId}`);
      });
      
      // Delete these orphaned services
      const orphanedIds = orphanedServices.map(s => s.id);
      const deleteOrphanedResult = await prisma.service.deleteMany({
        where: {
          id: { in: orphanedIds }
        }
      });
      
      console.log(`Deleted ${deleteOrphanedResult.count} orphaned services`);
    }
    
    console.log('Data integrity check completed successfully!');
    
  } catch (error) {
    console.error('Error fixing null providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullProviders();

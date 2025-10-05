const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Listing all provider users in the database...');
    
    // Get all users with PROVIDER role
    const providers = await prisma.user.findMany({
      where: {
        role: 'PROVIDER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profile: {
          select: {
            contactPerson: true,
            phone: true
          }
        },
        provider: {
          select: {
            id: true,
            Service: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (providers.length === 0) {
      console.log('No providers found in the database.');
      return;
    }
    
    console.log(`Found ${providers.length} providers:`);
    console.log('-'.repeat(80));
    
    providers.forEach((provider, index) => {
      const serviceCount = provider.provider?.Service?.length || 0;
      
      console.log(`[${index + 1}] ID: ${provider.id}`);
      console.log(`    Name: ${provider.name}`);
      console.log(`    Email: ${provider.email} (use this in the test script)`);
      console.log(`    Contact: ${provider.profile?.contactPerson || 'N/A'}`);
      console.log(`    Phone: ${provider.profile?.phone || 'N/A'}`);
      console.log(`    Created: ${provider.createdAt.toLocaleString()}`);
      console.log(`    Services: ${serviceCount}`);
      console.log('-'.repeat(80));
    });
    
    console.log('\nTo use the create-test-services.js script:');
    console.log('1. Copy a provider email from above');
    console.log('2. Open scripts/create-test-services.js');
    console.log('3. Set PROVIDER_EMAIL to the copied email');
    console.log('4. Run: node scripts/create-test-services.js');
    
  } catch (error) {
    console.error('Error listing providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProviderService() {
  try {
    console.log('Testing provider-service relationship...');
    
    // Check existing providers
    const providers = await prisma.provider.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Found ${providers.length} providers:`);
    providers.forEach(p => {
      console.log(`- ID: ${p.id}, Business: ${p.businessName}, User: ${p.user?.name}`);
    });
    
    if (providers.length === 0) {
      console.log('No providers found. Creating a test provider...');
      
      // Create a test user first
      const testUser = await prisma.user.create({
        data: {
          name: 'Test Provider',
          email: 'test-provider@example.com',
          role: 'PROVIDER'
        }
      });
      
      // Create a test provider
      const testProvider = await prisma.provider.create({
        data: {
          userId: testUser.id,
          businessName: 'Test Business',
          bio: 'Test provider for debugging',
          isVerified: false,
          paypalCanReceivePayments: false,
          paypalOnboardingStatus: 'NOT_STARTED',
          paypalEnvironment: 'sandbox'
        }
      });
      
      console.log(`Created test provider: ${testProvider.id}`);
      providers.push(testProvider);
    }
    
    // Check existing categories
    const categories = await prisma.serviceCategory.findMany();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(c => {
      console.log(`- ID: ${c.id}, Name: ${c.name}`);
    });
    
    if (categories.length === 0) {
      console.log('No categories found. Creating a test category...');
      const testCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          description: 'Test category for debugging'
        }
      });
      console.log(`Created test category: ${testCategory.id}`);
      categories.push(testCategory);
    }
    
    // Try to create a simple service
    const testServiceData = {
      providerId: providers[0].id,
      categoryId: categories[0].id,
      name: 'Test Service',
      description: 'A test service to check provider relationship',
      price: 100.00,
      photos: [],
      status: 'ACTIVE',
      colors: []
    };
    
    console.log('Attempting to create test service with data:', testServiceData);
    
    const testService = await prisma.service.create({
      data: testServiceData
    });
    
    console.log(`✓ Successfully created test service: ${testService.id}`);
    
    // Clean up the test service
    await prisma.service.delete({
      where: { id: testService.id }
    });
    
    console.log('✓ Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProviderService();


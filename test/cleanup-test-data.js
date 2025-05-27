const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cleanup script to remove test data
 * Use this to reset the database after running tests
 */
async function cleanupTestData() {
  console.log('Starting cleanup of test data...');
  
  try {
    // Delete test transactions first (foreign key constraints)
    console.log('Deleting test transactions...');
    await prisma.transaction.deleteMany({
      where: {
        paymentIntentId: {
          startsWith: 'test_payment_'
        }
      }
    });
    
    // Delete test offers
    console.log('Deleting test offers...');
    await prisma.offer.deleteMany({
      where: {
        description: 'Test offer'
      }
    });
    
    // Delete test party services
    console.log('Deleting test party services...');
    await prisma.partyService.deleteMany({
      where: {
        specificOptions: {
          path: ['address'],
          equals: 'Test Address'
        }
      }
    });
    
    // Delete test parties
    console.log('Deleting test parties...');
    await prisma.party.deleteMany({
      where: {
        name: 'Test Booking'
      }
    });
    
    // Delete test notifications
    console.log('Deleting test notifications...');
    await prisma.notification.deleteMany({
      where: {
        title: 'New Test Booking'
      }
    });
    
    console.log('Cleanup completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Cleanup failed with error:', error);
    return { success: false, error: error };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData()
  .then(result => {
    if (result.success) {
      console.log('\nCleanup completed successfully ✅');
    } else {
      console.log('\nCleanup failed ❌');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during cleanup:', error);
    process.exit(1);
  }); 
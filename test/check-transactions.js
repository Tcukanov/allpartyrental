const { PrismaClient } = require('@prisma/client');

async function checkTransactions() {
  const prisma = new PrismaClient();
  
  try {
    // Count total transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`Total transactions in database: ${transactionCount}`);
    
    // Get sample transactions with details
    const transactions = await prisma.transaction.findMany({
      take: 5,
      include: {
        offer: {
          include: {
            client: {
              select: {
                name: true,
                email: true
              }
            },
            provider: {
              select: {
                name: true,
                email: true
              }
            },
            service: {
              select: {
                name: true
              }
            }
          }
        },
        party: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\nRecent transactions:');
    if (transactions.length === 0) {
      console.log('No transactions found in the database.');
    } else {
      transactions.forEach((tx, index) => {
        console.log(`${index + 1}. ID: ${tx.id}`);
        console.log(`   Status: ${tx.status}`);
        console.log(`   Amount: $${tx.amount}`);
        console.log(`   Client: ${tx.offer?.client?.name || 'N/A'} (${tx.offer?.client?.email || 'N/A'})`);
        console.log(`   Provider: ${tx.offer?.provider?.name || 'N/A'} (${tx.offer?.provider?.email || 'N/A'})`);
        console.log(`   Service: ${tx.offer?.service?.name || 'N/A'}`);
        console.log(`   Party: ${tx.party?.name || 'N/A'}`);
        console.log(`   Created: ${tx.createdAt}`);
        console.log('   ---');
      });
    }
    
    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log(`\nTotal users in database: ${userCount}`);
    
    // Check if there are any offers
    const offerCount = await prisma.offer.count();
    console.log(`Total offers in database: ${offerCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions(); 
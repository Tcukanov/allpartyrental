import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanPendingOffers() {
  console.log('🧹 Cleaning up pending offers...');

  try {
    // Find all pending offers older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const pendingOffers = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: oneHourAgo
        }
      },
      include: {
        service: { select: { name: true } },
        client: { select: { email: true } }
      }
    });

    console.log(`Found ${pendingOffers.length} pending offers older than 1 hour`);

    if (pendingOffers.length > 0) {
      console.log('\nPending offers to clean:');
      pendingOffers.forEach(offer => {
        console.log(`- Offer ${offer.id}: ${offer.service.name} for ${offer.client.email} (created: ${offer.createdAt})`);
      });

      const { deleted } = await prisma.offer.deleteMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lt: oneHourAgo
          }
        }
      });

      console.log(`\n✅ Deleted ${deleted} pending offers`);
    } else {
      console.log('✅ No old pending offers to clean');
    }

    // Also show recent pending offers (last hour)
    const recentPending = await prisma.offer.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: oneHourAgo
        }
      },
      include: {
        service: { select: { name: true } },
        client: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentPending.length > 0) {
      console.log(`\n⚠️  ${recentPending.length} recent pending offers (last hour):`);
      recentPending.forEach(offer => {
        console.log(`- Offer ${offer.id}: ${offer.service.name} for ${offer.client.email} (created: ${offer.createdAt})`);
      });
    }

  } catch (error) {
    console.error('❌ Error cleaning pending offers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPendingOffers();



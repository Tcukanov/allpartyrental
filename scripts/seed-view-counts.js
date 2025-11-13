const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedViewCounts() {
  try {
    console.log('🌱 Seeding view counts for services...');

    // Get all active services
    const services = await prisma.service.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        viewCount: true,
      },
    });

    if (services.length === 0) {
      console.log('❌ No active services found to seed view counts');
      return;
    }

    console.log(`✅ Found ${services.length} active services`);

    // Update each service with a random view count (between 10 and 500 for variety)
    for (const service of services) {
      const randomViews = Math.floor(Math.random() * 491) + 10; // 10 to 500
      
      await prisma.service.update({
        where: { id: service.id },
        data: { viewCount: randomViews },
      });

      console.log(`   ✓ ${service.name}: ${randomViews} views`);
    }

    console.log('\n🎉 Successfully seeded view counts!');
  } catch (error) {
    console.error('❌ Error seeding view counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedViewCounts();


// Import PrismaClient
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Starting city update process...');

    // 1. Check if "NYC" city exists, if not create it
    console.log('👉 Looking for "NYC" city...');
    let nycCity = await prisma.city.findFirst({
      where: {
        name: 'NYC',
      },
    });

    if (!nycCity) {
      console.log('❌ "NYC" city not found, creating it...');
      nycCity = await prisma.city.create({
        data: {
          name: 'NYC',
          slug: 'nyc',
          state: 'NY'
        },
      });
      console.log('✅ Created "NYC" city with ID:', nycCity.id);
    } else {
      console.log('✅ Found existing "NYC" city with ID:', nycCity.id);
    }

    // 2. Get all other city IDs
    console.log('👉 Finding all cities except "NYC"...');
    const otherCities = await prisma.city.findMany({
      where: {
        id: {
          not: nycCity.id,
        },
      },
    });

    console.log(`ℹ️ Found ${otherCities.length} other cities to be removed`);

    // 3. Update all services to use the "NYC" city
    console.log('👉 Updating all services to use the "NYC" city...');
    const affectedServices = await prisma.service.updateMany({
      where: {
        cityId: {
          in: otherCities.map(c => c.id),
        },
      },
      data: {
        cityId: nycCity.id,
      },
    });

    console.log(`✅ Updated ${affectedServices.count} services to use the "NYC" city`);

    // 3.5 Update all parties to use the "NYC" city
    console.log('👉 Updating all parties to use the "NYC" city...');
    const affectedParties = await prisma.party.updateMany({
      where: {
        cityId: {
          in: otherCities.map(c => c.id),
        },
      },
      data: {
        cityId: nycCity.id,
      },
    });

    console.log(`✅ Updated ${affectedParties.count} parties to use the "NYC" city`);

    // 4. Delete all other cities
    console.log('👉 Deleting all other cities...');
    const deletedCities = await prisma.city.deleteMany({
      where: {
        id: {
          not: nycCity.id,
        },
      },
    });

    console.log(`✅ Deleted ${deletedCities.count} cities`);

    console.log('🎉 City update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating cities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
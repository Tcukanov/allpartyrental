import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Starting category update process...');

    // 1. Check if "Soft play" category exists, if not create it
    console.log('👉 Looking for "Soft play" category...');
    let softPlayCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: 'Soft play',
      },
    });

    if (!softPlayCategory) {
      console.log('❌ "Soft play" category not found, creating it...');
      softPlayCategory = await prisma.serviceCategory.create({
        data: {
          name: 'Soft play',
          description: 'Soft play equipment and services for parties',
          slug: 'soft-play',
        },
      });
      console.log('✅ Created "Soft play" category with ID:', softPlayCategory.id);
    } else {
      console.log('✅ Found existing "Soft play" category with ID:', softPlayCategory.id);
    }

    // 2. Get all other category IDs
    console.log('👉 Finding all categories except "Soft play"...');
    const otherCategories = await prisma.serviceCategory.findMany({
      where: {
        id: {
          not: softPlayCategory.id,
        },
      },
    });

    console.log(`ℹ️ Found ${otherCategories.length} other categories to be removed`);

    // 3. Update all services to use the "Soft play" category
    console.log('👉 Updating all services to use the "Soft play" category...');
    const affectedServices = await prisma.service.updateMany({
      where: {
        categoryId: {
          in: otherCategories.map(c => c.id),
        },
      },
      data: {
        categoryId: softPlayCategory.id,
      },
    });

    console.log(`✅ Updated ${affectedServices.count} services to use the "Soft play" category`);

    // 4. Delete all other categories
    console.log('👉 Deleting all other categories...');
    const deletedCategories = await prisma.serviceCategory.deleteMany({
      where: {
        id: {
          not: softPlayCategory.id,
        },
      },
    });

    console.log(`✅ Deleted ${deletedCategories.count} categories`);

    console.log('🎉 Category update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 
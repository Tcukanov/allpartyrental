const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting to create initial category filters...');

  try {
    // First, find the Soft play category
    const softPlayCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: 'Soft play'
      }
    });

    if (!softPlayCategory) {
      console.error('Error: Could not find "Soft play" category. Make sure it exists in the database.');
      return;
    }

    console.log(`Found Soft play category with ID: ${softPlayCategory.id}`);

    // Define filters to create
    const filtersToCreate = [
      {
        name: 'Age Range',
        type: 'size',
        options: ['0-3 years', '3-6 years', '6-12 years', 'All ages'],
        isRequired: true,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209994.png'
      },
      {
        name: 'Features',
        type: 'feature',
        options: ['Ball Pit', 'Slide', 'Bouncy Floor', 'Climbing Wall', 'Obstacle Course', 'Interactive Elements'],
        isRequired: false,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3210/3210101.png'
      },
      {
        name: 'Space Required',
        type: 'size',
        options: ['Small (under 100 sq ft)', 'Medium (100-300 sq ft)', 'Large (300+ sq ft)'],
        isRequired: true,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2247/2247735.png'
      },
      {
        name: 'Material',
        type: 'material',
        options: ['PVC', 'Foam', 'Nylon', 'Polyester', 'Rubber', 'Mixed Materials'],
        isRequired: false,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3014/3014264.png'
      },
      {
        name: 'Setup Time',
        type: 'size',
        options: ['Quick (under 30 min)', 'Medium (30-60 min)', 'Long (60+ min)'],
        isRequired: false,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png'
      },
      {
        name: 'Max Capacity',
        type: 'size',
        options: ['1-5 children', '5-10 children', '10-20 children', '20+ children'],
        isRequired: true,
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209007.png'
      }
    ];

    console.log(`Creating ${filtersToCreate.length} filters for Soft play category...`);

    // Check if filters already exist
    const existingFilters = await prisma.categoryFilter.findMany({
      where: {
        categoryId: softPlayCategory.id
      }
    });

    if (existingFilters.length > 0) {
      console.log(`Found ${existingFilters.length} existing filters. Skipping creation of duplicates.`);
    }

    // Create filters that don't already exist
    for (const filterData of filtersToCreate) {
      const exists = existingFilters.some(filter => 
        filter.name === filterData.name && filter.type === filterData.type
      );

      if (exists) {
        console.log(`Filter "${filterData.name}" already exists. Skipping.`);
        continue;
      }

      const filter = await prisma.categoryFilter.create({
        data: {
          categoryId: softPlayCategory.id,
          name: filterData.name,
          type: filterData.type,
          options: filterData.options,
          isRequired: filterData.isRequired,
          // Remove iconUrl if not supported in schema
          // iconUrl: filterData.iconUrl
        }
      });

      console.log(`Created filter: ${filter.name} (ID: ${filter.id})`);
    }

    console.log('Successfully created initial category filters.');

  } catch (error) {
    console.error('Error creating category filters:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting test filter creation script...');
  
  // List all categories to help identify the ID
  const categories = await prisma.serviceCategory.findMany({
    select: { id: true, name: true }
  });
  
  console.log('Available categories:');
  categories.forEach(category => {
    console.log(`- ${category.name} (${category.id})`);
  });
  
  if (categories.length === 0) {
    console.log('No categories found. Please create a category first.');
    return;
  }
  
  // Choose the first category or specify a specific ID
  const targetCategoryId = categories[0].id;
  console.log(`Using category: ${categories[0].name} (${targetCategoryId})`);
  
  // Create test filters
  const filters = [
    {
      name: 'Color',
      type: 'color',
      options: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'],
      isRequired: true
    },
    {
      name: 'Size',
      type: 'size',
      options: ['Small', 'Medium', 'Large', 'X-Large'],
      isRequired: true
    },
    {
      name: 'Material',
      type: 'material',
      options: ['Plastic', 'Wood', 'Metal', 'Fabric', 'Paper'],
      isRequired: false
    }
  ];
  
  console.log('Creating test filters...');
  
  for (const filter of filters) {
    try {
      // Check if filter with this name already exists using raw query
      const existingFilters = await prisma.$queryRaw`
        SELECT * FROM "CategoryFilter"
        WHERE "categoryId" = ${targetCategoryId}
        AND name = ${filter.name}
      `;
      
      const existingFilter = existingFilters.length > 0 ? existingFilters[0] : null;
      
      if (existingFilter) {
        console.log(`Filter "${filter.name}" already exists for this category. Skipping.`);
        continue;
      }
      
      // Create the filter using raw query
      const result = await prisma.$executeRaw`
        INSERT INTO "CategoryFilter" (
          id,
          "categoryId",
          name,
          type,
          options,
          "isRequired",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${targetCategoryId},
          ${filter.name},
          ${filter.type},
          ${JSON.stringify(filter.options)}::jsonb,
          ${filter.isRequired},
          NOW(),
          NOW()
        )
      `;
      
      // Get the created filter to log it
      const createdFilter = await prisma.$queryRaw`
        SELECT * FROM "CategoryFilter"
        WHERE "categoryId" = ${targetCategoryId}
        AND name = ${filter.name}
        ORDER BY "createdAt" DESC
        LIMIT 1
      `;
      
      console.log(`Created filter: ${filter.name} (${createdFilter[0]?.id || 'unknown'})`);
    } catch (error) {
      console.error(`Error creating filter "${filter.name}":`, error);
    }
  }
  
  // Verify filters were created using raw query
  const createdFilters = await prisma.$queryRaw`
    SELECT * FROM "CategoryFilter"
    WHERE "categoryId" = ${targetCategoryId}
  `;
  
  console.log(`\nFilters for category ${categories[0].name}:`);
  createdFilters.forEach(filter => {
    console.log(`- ${filter.name} (${filter.id}): ${filter.options.join(', ')}`);
  });
  
  console.log('\nScript completed successfully.');
}

main()
  .catch(e => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
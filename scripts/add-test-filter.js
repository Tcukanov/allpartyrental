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
      // Check if filter with this name already exists
      const existingFilter = await prisma.categoryFilter.findFirst({
        where: {
          categoryId: targetCategoryId,
          name: filter.name
        }
      });
      
      if (existingFilter) {
        console.log(`Filter "${filter.name}" already exists for this category. Skipping.`);
        continue;
      }
      
      // Create the filter
      const result = await prisma.categoryFilter.create({
        data: {
          categoryId: targetCategoryId,
          name: filter.name,
          type: filter.type,
          options: filter.options,
          isRequired: filter.isRequired
        }
      });
      
      console.log(`Created filter: ${result.name} (${result.id})`);
    } catch (error) {
      console.error(`Error creating filter "${filter.name}":`, error);
    }
  }
  
  // Verify filters were created
  const createdFilters = await prisma.categoryFilter.findMany({
    where: { categoryId: targetCategoryId }
  });
  
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
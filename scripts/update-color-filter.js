const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting Color filter update script...');
  
  try {
    // List all categories to find the right one
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
    
    // Find the Soft play category or use the first one
    const softPlayCategory = categories.find(cat => cat.name === 'Soft play') || categories[0];
    const categoryId = softPlayCategory.id;
    console.log(`Using category: ${softPlayCategory.name} (${categoryId})`);
    
    // Find the Color filter for this category
    const colorFilter = await prisma.categoryFilter.findFirst({
      where: {
        categoryId: categoryId,
        name: 'Color'
      }
    });
    
    if (!colorFilter) {
      console.log('Color filter not found for this category.');
      return;
    }
    
    console.log(`Found Color filter: ${colorFilter.id}, isRequired currently: ${colorFilter.isRequired}`);
    
    // Update the Color filter to be required
    const updatedFilter = await prisma.categoryFilter.update({
      where: {
        id: colorFilter.id
      },
      data: {
        isRequired: true
      }
    });
    
    console.log(`Updated Color filter: isRequired is now ${updatedFilter.isRequired}`);
    
    // Verify all filters
    const allFilters = await prisma.categoryFilter.findMany({
      where: { categoryId: categoryId }
    });
    
    console.log('\nAll filters for this category:');
    allFilters.forEach(filter => {
      console.log(`- ${filter.name} (${filter.id}): isRequired=${filter.isRequired}, options=[${filter.options.join(', ')}]`);
    });
    
  } catch (error) {
    console.error('Error updating Color filter:', error);
  }
}

main()
  .catch(e => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
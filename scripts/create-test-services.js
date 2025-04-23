const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration - change these values as needed
const NUMBER_OF_SERVICES = 10;
const PROVIDER_EMAIL = 'photography@example.com'; // Change to your test provider email
const SERVICE_NAME_PREFIX = 'Test Service';
const DESCRIPTION = 'This is a test service created for testing purposes. It includes various features and specifications that can be used to test the application functionality.';

// Service property arrays for randomization
const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Multi-colored'];
const MIN_HOURS = [1, 2, 3, 4];
const MAX_HOURS = [6, 8, 12, 24];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STATUSES = ['ACTIVE', 'INACTIVE'];
const PRICES = [50, 75, 100, 125, 150, 175, 200, 250, 300, 350];

// Sample filter values for "Soft play" category
const FILTER_VALUES = [
  {
    "age-range": "3-6 years",
    "features": ["Ball Pit", "Slide", "Interactive Elements"],
    "space-required": "Medium (100-300 sq ft)",
    "material": "Foam",
    "setup-time": "Quick (under 30 min)",
    "max-capacity": "5-10 children"
  },
  {
    "age-range": "0-3 years",
    "features": ["Bouncy Floor", "Ball Pit"],
    "space-required": "Small (under 100 sq ft)",
    "material": "PVC",
    "setup-time": "Quick (under 30 min)",
    "max-capacity": "1-5 children"
  },
  {
    "age-range": "6-12 years",
    "features": ["Climbing Wall", "Obstacle Course"],
    "space-required": "Large (300+ sq ft)",
    "material": "Nylon",
    "setup-time": "Medium (30-60 min)",
    "max-capacity": "10-20 children"
  },
  {
    "age-range": "All ages",
    "features": ["Slide", "Bouncy Floor", "Ball Pit", "Interactive Elements"],
    "space-required": "Large (300+ sq ft)",
    "material": "Mixed Materials",
    "setup-time": "Long (60+ min)",
    "max-capacity": "20+ children"
  }
];

// Helper function to get random item from array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random items from array
const getRandomItems = (array, min = 1, max = array.length) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function main() {
  try {
    console.log(`Starting test service creation script...`);
    
    // Get provider user
    const provider = await prisma.user.findUnique({
      where: { email: PROVIDER_EMAIL },
    });
    
    if (!provider) {
      console.error(`Provider with email ${PROVIDER_EMAIL} not found. Please create this user first.`);
      console.log('You can update PROVIDER_EMAIL in the script to match an existing provider user.');
      return;
    }
    console.log(`Found provider: ${provider.name} (${provider.id})`);
    
    // Get Soft play category
    const category = await prisma.serviceCategory.findFirst({
      where: { name: 'Soft play' },
    });
    
    if (!category) {
      console.error(`Category "Soft play" not found. Please create this category first.`);
      return;
    }
    console.log(`Found category: ${category.name} (${category.id})`);
    
    // Get all cities
    const cities = await prisma.city.findMany({
      take: 10, // Limit to 10 cities
    });
    
    if (cities.length === 0) {
      console.error(`No cities found. Please add cities to the database first.`);
      return;
    }
    console.log(`Found ${cities.length} cities`);
    
    // Create services
    console.log(`Creating ${NUMBER_OF_SERVICES} test services...`);
    
    for (let i = 0; i < NUMBER_OF_SERVICES; i++) {
      const cityIndex = i % cities.length; // Rotate through available cities
      const city = cities[cityIndex];
      
      const filterValuesIndex = i % FILTER_VALUES.length; // Rotate through filter values
      const filterValues = FILTER_VALUES[filterValuesIndex];
      
      // Generate random service properties
      const serviceName = `${SERVICE_NAME_PREFIX} #${i + 1} - ${filterValues["age-range"]} ${filterValues["features"][0]}`;
      const price = getRandomItem(PRICES);
      const daysAvailable = getRandomItems(DAYS, 3, 7);
      const serviceColors = getRandomItems(COLORS, 1, 3);
      const minHours = getRandomItem(MIN_HOURS);
      const maxHours = getRandomItem(MAX_HOURS.filter(h => h > minHours));
      const status = getRandomItem(STATUSES);
      
      // Create service photos - dummy URLs
      const photos = [
        `https://source.unsplash.com/random/800x600?soft+play+${i}`,
        `https://source.unsplash.com/random/800x600?bounce+${i}`,
        `https://source.unsplash.com/random/800x600?children+play+${i}`
      ];
      
      // Create service with metadata for filters
      const service = await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: category.id,
          cityId: city.id,
          name: serviceName,
          description: DESCRIPTION,
          price: price,
          photos: photos,
          status: status,
          availableDays: daysAvailable,
          availableHoursStart: '09:00',
          availableHoursEnd: '18:00',
          minRentalHours: minHours,
          maxRentalHours: maxHours,
          colors: serviceColors,
          metadata: JSON.stringify({ filterValues: filterValues }),
        },
      });
      
      console.log(`Created service: ${service.name} (${service.id}) - Price: $${service.price} - Status: ${service.status}`);
    }
    
    console.log(`Successfully created ${NUMBER_OF_SERVICES} test services.`);
    
  } catch (error) {
    console.error('Error creating test services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 
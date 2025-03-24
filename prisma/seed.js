// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Delete all existing data
  console.log('Cleaning existing data...');
  await cleanDatabase();

  // Create service categories
  console.log('Creating service categories...');
  const categories = await createServiceCategories();

  // Create cities
  console.log('Creating cities...');
  const cities = await createCities();

  // Create users (admins, clients, providers)
  console.log('Creating users...');
  const users = await createUsers();

  // Create services offered by providers
  console.log('Creating services...');
  await createServices(users.providers, categories, cities);

  // Create parties for clients
  console.log('Creating parties...');
  const parties = await createParties(users.clients, cities);

  // Link services to parties and create offers
  console.log('Creating party services and offers...');
  await createPartyServicesAndOffers(parties, users.providers);

  // Create some completed parties with transactions
  console.log('Creating completed parties with transactions...');
  await createCompletedParties(users.clients, users.providers, categories, cities);

  console.log('Seed completed successfully!');
}

async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.message.deleteMany();
  await prisma.chat.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.partyService.deleteMany();
  await prisma.party.deleteMany();
  await prisma.service.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.city.deleteMany();
  await prisma.systemSettings.deleteMany();
}

async function createServiceCategories() {
  const categories = [
    { name: 'Decoration', description: 'Decorations for all types of parties' },
    { name: 'Catering', description: 'Food and beverage services' },
    { name: 'Entertainment', description: 'DJs, bands, and other entertainment services' },
    { name: 'Venue', description: 'Locations to host your event' },
    { name: 'Photography', description: 'Professional photography services' },
    { name: 'Videography', description: 'Professional video services' },
    { name: 'Bounce Houses', description: 'Inflatable play structures for kids' },
    { name: 'Party Supplies', description: 'Plates, cups, napkins, and other supplies' },
    { name: 'Furniture Rental', description: 'Tables, chairs, and other furniture' },
    { name: 'Cakes & Desserts', description: 'Custom cakes and dessert tables' },
  ];

  return Promise.all(
    categories.map(category => 
      prisma.serviceCategory.create({
        data: category
      })
    )
  );
}

async function createCities() {
  const cities = [
    { name: 'New York', slug: 'new-york', state: 'NY' },
    { name: 'Los Angeles', slug: 'los-angeles', state: 'CA' },
    { name: 'Chicago', slug: 'chicago', state: 'IL' },
    { name: 'Houston', slug: 'houston', state: 'TX' },
    { name: 'Miami', slug: 'miami', state: 'FL' },
    { name: 'San Francisco', slug: 'san-francisco', state: 'CA' },
    { name: 'Seattle', slug: 'seattle', state: 'WA' },
    { name: 'Boston', slug: 'boston', state: 'MA' },
    { name: 'Denver', slug: 'denver', state: 'CO' },
    { name: 'Atlanta', slug: 'atlanta', state: 'GA' },
  ];

  return Promise.all(
    cities.map(city => 
      prisma.city.create({
        data: city
      })
    )
  );
}

async function createUsers() {
  // Create admin users
  const adminPassword = await hash('admin123', 10);
  const admins = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          },
        },
      },
    }),
  ]);

  // Create client users
  const clientPassword = await hash('client123', 10);
  const clients = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: clientPassword,
        role: 'CLIENT',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
          },
        },
        calendar: {
          create: [
            {
              childName: 'Emily',
              birthDate: new Date('2024-05-15'),
              sendReminders: true,
            },
            {
              childName: 'Jacob',
              birthDate: new Date('2024-07-22'),
              sendReminders: true,
            },
          ],
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Michael Brown',
        email: 'michael@example.com',
        password: clientPassword,
        role: 'CLIENT',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jennifer Davis',
        email: 'jennifer@example.com',
        password: clientPassword,
        role: 'CLIENT',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
          },
        },
      },
    }),
  ]);

  // Create provider users
  const providerPassword = await hash('provider123', 10);
  const providers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Party Decorations Pro',
        email: 'decorations@example.com',
        password: providerPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
            isProStatus: true,
            website: 'https://partydecorationspro.example.com',
            phone: '(212) 555-1234',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Gourmet Catering',
        email: 'catering@example.com',
        password: providerPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
            website: 'https://gourmetcatering.example.com',
            phone: '(212) 555-5678',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Entertainment Kings',
        email: 'entertainment@example.com',
        password: providerPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/men/6.jpg',
            website: 'https://entertainmentkings.example.com',
            phone: '(212) 555-9012',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bounce House Fun',
        email: 'bouncehouse@example.com',
        password: providerPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/women/7.jpg',
            phone: '(212) 555-3456',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Capture Moments Photography',
        email: 'photography@example.com',
        password: providerPassword,
        role: 'PROVIDER',
        profile: {
          create: {
            avatar: 'https://randomuser.me/api/portraits/men/8.jpg',
            website: 'https://capturemoments.example.com',
            phone: '(212) 555-7890',
          },
        },
      },
    }),
  ]);

  return {
    admins,
    clients,
    providers,
  };
}

async function createServices(providers, categories, cities) {
  // Map category names to IDs for easier lookup
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {});

  // Map city names to IDs for easier lookup
  const cityMap = cities.reduce((map, city) => {
    map[city.name] = city.id;
    return map;
  }, {});

  // Create services for each provider based on their specialty
  const services = [
    // Decoration services
    {
      providerId: providers[0].id,
      categoryId: categoryMap['Decoration'],
      cityId: cityMap['New York'],
      name: 'Premium Decoration Package',
      description: 'Complete decoration setup with balloons, banners, table settings, and themed decorations.',
      price: 299.99,
      photos: ['https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[0].id,
      categoryId: categoryMap['Decoration'],
      cityId: cityMap['New York'],
      name: 'Balloon Arch',
      description: 'Custom balloon arch in colors of your choice. Perfect for photo opportunities.',
      price: 149.99,
      photos: ['https://images.unsplash.com/photo-1533294455009-a77b7557d2d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[0].id,
      categoryId: categoryMap['Decoration'],
      cityId: cityMap['Los Angeles'],
      name: 'Theme Party Decorations',
      description: 'Complete theme-based decoration package including backdrops, table settings, and props.',
      price: 349.99,
      photos: ['https://images.unsplash.com/photo-1564145291089-9542d5685637?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },

    // Catering services
    {
      providerId: providers[1].id,
      categoryId: categoryMap['Catering'],
      cityId: cityMap['New York'],
      name: 'Full-Service Catering',
      description: 'Complete catering service including appetizers, main course, desserts, and service staff.',
      price: 35.99,
      photos: ['https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[1].id,
      categoryId: categoryMap['Catering'],
      cityId: cityMap['New York'],
      name: 'Dessert Table',
      description: 'Custom dessert table with a variety of sweets, cakes, and cookies.',
      price: 12.99,
      photos: ['https://images.unsplash.com/photo-1619558041248-f8e0ee31edb6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80'],
      status: 'ACTIVE',
    },

    // Entertainment services
    {
      providerId: providers[2].id,
      categoryId: categoryMap['Entertainment'],
      cityId: cityMap['New York'],
      name: 'Professional DJ Services',
      description: 'Professional DJ with sound equipment. Will play requested songs and keep the party going.',
      price: 399.99,
      photos: ['https://images.unsplash.com/photo-1571266028243-5c6d8c2a0d6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[2].id,
      categoryId: categoryMap['Entertainment'],
      cityId: cityMap['New York'],
      name: 'Magician Performance',
      description: 'Professional magician for children\'s parties. 1-hour show with audience participation.',
      price: 249.99,
      photos: ['https://images.unsplash.com/photo-1543157186-e6d61a133455?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80'],
      status: 'ACTIVE',
    },

    // Bounce house services
    {
      providerId: providers[3].id,
      categoryId: categoryMap['Bounce Houses'],
      cityId: cityMap['New York'],
      name: 'Standard Bounce House',
      description: 'Colorful bounce house for up to 6 children. Includes setup and takedown.',
      price: 199.99,
      photos: ['https://images.unsplash.com/photo-1573982680571-f6e9a8a5850b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[3].id,
      categoryId: categoryMap['Bounce Houses'],
      cityId: cityMap['New York'],
      name: 'Water Slide',
      description: 'Inflatable water slide with splash pool. Perfect for hot summer days.',
      price: 249.99,
      photos: ['https://images.unsplash.com/photo-1558181409-4fa124ccbda4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },

    // Photography services
    {
      providerId: providers[4].id,
      categoryId: categoryMap['Photography'],
      cityId: cityMap['New York'],
      name: 'Party Photography Package',
      description: 'Professional photography for your event. Includes editing and digital delivery.',
      price: 349.99,
      photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
    {
      providerId: providers[4].id,
      categoryId: categoryMap['Photography'],
      cityId: cityMap['New York'],
      name: 'Photo Booth Rental',
      description: 'Fun photo booth with props and instant prints. Includes attendant.',
      price: 299.99,
      photos: ['https://images.unsplash.com/photo-1583329550487-0fa8dd6f8870?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
    },
  ];

  return Promise.all(
    services.map(service => 
      prisma.service.create({
        data: service
      })
    )
  );
}

async function createParties(clients, cities) {
  // Map city names to IDs for easier lookup
  const cityMap = cities.reduce((map, city) => {
    map[city.name] = city.id;
    return map;
  }, {});

  const parties = [
    // Active parties for Sarah
    {
      clientId: clients[0].id,
      cityId: cityMap['New York'],
      name: 'Emily\'s 7th Birthday',
      date: new Date('2024-05-15'),
      startTime: '14:00',
      duration: 3,
      guestCount: 15,
      status: 'PUBLISHED',
    },
    {
      clientId: clients[0].id,
      cityId: cityMap['New York'],
      name: 'Summer Graduation Party',
      date: new Date('2024-06-10'),
      startTime: '17:00',
      duration: 4,
      guestCount: 30,
      status: 'DRAFT',
    },

    // Active party for Michael
    {
      clientId: clients[1].id,
      cityId: cityMap['Los Angeles'],
      name: 'Anniversary Celebration',
      date: new Date('2024-08-05'),
      startTime: '18:00',
      duration: 5,
      guestCount: 50,
      status: 'IN_PROGRESS',
    },

    // Active party for Jennifer
    {
      clientId: clients[2].id,
      cityId: cityMap['Miami'],
      name: 'Graduation Party',
      date: new Date('2024-05-10'),
      startTime: '16:00',
      duration: 4,
      guestCount: 40,
      status: 'PUBLISHED',
    },
  ];

  return Promise.all(
    parties.map(party => 
      prisma.party.create({
        data: party
      })
    )
  );
}

async function createPartyServicesAndOffers(parties, providers) {
  // Get all services
  const services = await prisma.service.findMany();

  // Create party services and offers for each party
  for (const party of parties) {
    // Skip draft parties
    if (party.status === 'DRAFT') {
      continue;
    }

    // Filter services by city
    const cityServices = services.filter(service => service.cityId === party.cityId);
    
    // Create 3-5 party services for each party
    const serviceCount = Math.floor(Math.random() * 3) + 3;
    const selectedServices = cityServices.slice(0, serviceCount);
    
    for (const service of selectedServices) {
      // Create party service
      const partyService = await prisma.partyService.create({
        data: {
          partyId: party.id,
          serviceId: service.id,
          specificOptions: {
            notes: 'Sample specific requirements for this service',
          },
        },
      });
      
      // Create 1-3 offers for each party service
      const offerCount = Math.floor(Math.random() * 3) + 1;
      
      // First, create an offer from the service owner
      await prisma.offer.create({
        data: {
          providerId: service.providerId,
          clientId: party.clientId,
          serviceId: service.id,
          partyServiceId: partyService.id,
          price: service.price,
          description: `Standard package for ${service.name}. Includes all basic services as described in the listing.`,
          photos: service.photos,
          status: party.status === 'IN_PROGRESS' ? 'APPROVED' : 'PENDING',
        },
      });
      
      // Then create additional offers from other providers (if needed)
      for (let i = 1; i < offerCount; i++) {
        // Select a random provider different from the service owner
        const availableProviders = providers.filter(p => p.id !== service.providerId);
        if (availableProviders.length === 0) continue;
        
        const providerIndex = Math.floor(Math.random() * availableProviders.length);
        const provider = availableProviders[providerIndex];
        
        // Create competing offer with slightly different price
        const priceAdjustment = (Math.random() * 0.2) - 0.1; // -10% to +10%
        const offerPrice = service.price * (1 + priceAdjustment);
        
        await prisma.offer.create({
          data: {
            providerId: provider.id,
            clientId: party.clientId,
            serviceId: service.id,
            partyServiceId: partyService.id,
            price: offerPrice,
            description: `Custom package for ${service.name}. We offer competitive pricing with premium service quality.`,
            photos: [service.photos[0]], // Use first photo from original service
            status: 'PENDING',
          },
        });
      }
    }
  }
}

async function createCompletedParties(clients, providers, categories, cities) {
  // Map category names to IDs for easier lookup
  const categoryMap = categories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {});

  // Map city names to IDs for easier lookup
  const cityMap = cities.reduce((map, city) => {
    map[city.name] = city.id;
    return map;
  }, {});

  // Create two completed parties for the first client
  const pastParties = [
    {
      clientId: clients[0].id,
      cityId: cityMap['New York'],
      name: 'New Year\'s Eve Party',
      date: new Date('2023-12-31T19:00:00Z'),
      startTime: '19:00',
      duration: 5,
      guestCount: 25,
      status: 'COMPLETED',
    },
    {
      clientId: clients[0].id,
      cityId: cityMap['New York'],
      name: 'Valentine\'s Day Dinner',
      date: new Date('2024-02-14T18:00:00Z'),
      startTime: '18:00',
      duration: 3,
      guestCount: 10,
      status: 'COMPLETED',
    },
  ];

  // Create the completed parties
  for (const partyData of pastParties) {
    const party = await prisma.party.create({
      data: partyData,
    });

    // Create 3-4 services for each party
    const serviceCount = Math.floor(Math.random() * 2) + 3;
    
    // Create different types of services
    const serviceTypes = ['Decoration', 'Catering', 'Entertainment', 'Photography'];
    
    for (let i = 0; i < serviceCount; i++) {
      const serviceType = serviceTypes[i % serviceTypes.length];
      const categoryId = categoryMap[serviceType];
      
      // Find a provider that offers this type of service
      const provider = providers[i % providers.length];
      
      // Create a service
      const service = await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId,
          cityId: party.cityId,
          name: `${serviceType} for ${party.name}`,
          description: `Special ${serviceType.toLowerCase()} service provided for ${party.name}`,
          price: 100 + Math.floor(Math.random() * 200),
          photos: ['https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
          status: 'ACTIVE',
        },
      });
      
      // Create party service
      const partyService = await prisma.partyService.create({
        data: {
          partyId: party.id,
          serviceId: service.id,
          specificOptions: {
            notes: `Specific requirements for ${serviceType}`,
          },
        },
      });
      
      // Create approved offer
      const offer = await prisma.offer.create({
        data: {
          providerId: provider.id,
          clientId: party.clientId,
          serviceId: service.id,
          partyServiceId: partyService.id,
          price: service.price,
          description: `Standard package for ${service.name}`,
          photos: service.photos,
          status: 'APPROVED',
        },
      });
      
      // Create completed transaction
      const transaction = await prisma.transaction.create({
        data: {
          partyId: party.id,
          offerId: offer.id,
          amount: service.price,
          status: 'COMPLETED',
          paymentIntentId: `pi_${Math.random().toString(36).substring(2, 15)}`,
          paymentMethodId: `pm_${Math.random().toString(36).substring(2, 15)}`,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
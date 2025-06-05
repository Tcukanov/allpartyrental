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

  // Create provider records for provider users
  console.log('Creating provider records...');
  const providers = await createProviders(users.providers);

  // Create services offered by providers
  console.log('Creating services...');
  await createServices(providers, categories, cities);

  // Create parties for clients
  console.log('Creating parties...');
  const parties = await createParties(users.clients, cities);

  // Link services to parties and create offers
  console.log('Creating party services and offers...');
  await createPartyServicesAndOffers(parties, providers);

  // Create some completed parties with transactions
  console.log('Creating completed parties with transactions...');
  await createCompletedParties(users.clients, providers, categories, cities);

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
  await prisma.$executeRaw`DELETE FROM "ProviderCity"`; // Delete ProviderCity before Provider and City
  await prisma.provider.deleteMany();
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
    { name: 'Soft play', slug: 'soft-play', description: 'Soft play equipment and services for children' },
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
    { name: 'Manhattan', state: 'NY', slug: 'manhattan' },
    { name: 'Brooklyn', state: 'NY', slug: 'brooklyn' },
    { name: 'Queens', state: 'NY', slug: 'queens' },
    { name: 'The Bronx', state: 'NY', slug: 'the-bronx' },
    { name: 'Staten Island', state: 'NY', slug: 'staten-island' },
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

async function createProviders(providerUsers) {
  return Promise.all(
    providerUsers.map(user => 
      prisma.provider.create({
        data: {
          userId: user.id,
          businessName: user.name,
          bio: `Professional ${user.name} providing high-quality party services`,
          isVerified: true,
          paypalCanReceivePayments: false,
          paypalOnboardingStatus: 'NOT_STARTED',
          paypalEnvironment: 'sandbox'
        }
      })
    )
  );
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
  const services = [];

  // Create services for each city
  cities.forEach(city => {
    // Soft play services
    services.push({
      providerId: providers[0].id,
      categoryId: categoryMap['Soft play'],
      cityId: city.id,
      name: `Kids Soft Play Set in ${city.name}`,
      description: `Safe and colorful soft play equipment for young children. Perfect for parties and events in ${city.name}.`,
      price: 249.99,
      photos: ['https://images.unsplash.com/photo-1566140967404-b8b3932483f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
      colors: ['blue', 'red', 'yellow'],
    });

    services.push({
      providerId: providers[1].id,
      categoryId: categoryMap['Soft play'],
      cityId: city.id,
      name: `Toddler Play Area in ${city.name}`,
      description: `Complete soft play setup for toddlers including ball pit, soft blocks, and climbing structures in ${city.name}.`,
      price: 299.99,
      photos: ['https://images.unsplash.com/photo-1596461639144-dea8e88c9dab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
      colors: ['green', 'purple', 'orange'],
    });

    services.push({
      providerId: providers[2].id,
      categoryId: categoryMap['Soft play'],
      cityId: city.id,
      name: `Deluxe Soft Play Package in ${city.name}`,
      description: `Premium soft play equipment including slides, tunnels, ball pits and more. Professional setup in ${city.name}.`,
      price: 399.99,
      photos: ['https://images.unsplash.com/photo-1607453998774-d533f65dac99?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'],
      status: 'ACTIVE',
      colors: ['pink', 'blue', 'white'],
    });
  });

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
    {
      name: 'Graduation Party',
      date: new Date('2024-05-10'),
      startTime: '16:00',
      duration: 4,
      guestCount: 40,
      status: 'PUBLISHED',
      client: {
        connect: { id: clients[0].id }
      },
      city: {
        connect: { id: cityMap['Manhattan'] }
      }
    },
    {
      name: 'Birthday Party',
      date: new Date('2024-06-15'),
      startTime: '14:00',
      duration: 3,
      guestCount: 25,
      status: 'PUBLISHED',
      client: {
        connect: { id: clients[0].id }
      },
      city: {
        connect: { id: cityMap['Brooklyn'] }
      }
    },
    {
      name: 'Wedding Anniversary',
      date: new Date('2024-07-20'),
      startTime: '18:00',
      duration: 5,
      guestCount: 60,
      status: 'DRAFT',
      client: {
        connect: { id: clients[0].id }
      },
      city: {
        connect: { id: cityMap['Manhattan'] }
      }
    }
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
      cityId: cityMap['Manhattan'],
      name: 'New Year\'s Eve Party',
      date: new Date('2023-12-31T19:00:00Z'),
      startTime: '19:00',
      duration: 5,
      guestCount: 25,
      status: 'COMPLETED',
    },
    {
      clientId: clients[0].id,
      cityId: cityMap['Brooklyn'],
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

    // Create 2-3 services for each party
    const serviceCount = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < serviceCount; i++) {
      const softPlayCategoryId = categoryMap['Soft play'];
      
      // Find a provider that offers this type of service
      const provider = providers[i % providers.length];
      
      // Create a service
      const service = await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: softPlayCategoryId,
          cityId: party.cityId,
          name: `Soft Play Setup for ${party.name}`,
          description: `Special soft play equipment provided for ${party.name}`,
          price: 150 + Math.floor(Math.random() * 200),
          photos: ['https://images.unsplash.com/photo-1596461639144-dea8e88c9dab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'],
          status: 'ACTIVE',
          colors: ['blue', 'red', 'yellow', 'green'][i % 4] ? [['blue', 'red', 'yellow', 'green'][i % 4]] : [],
        },
      });
      
      // Create party service
      const partyService = await prisma.partyService.create({
        data: {
          partyId: party.id,
          serviceId: service.id,
          specificOptions: {
            notes: `Specific requirements for soft play equipment`,
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
          paypalOrderId: `ORDER_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          paypalCaptureId: `CAPTURE_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          paypalTransactionId: `TXN_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          paypalPayerId: `PAYER_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          paypalStatus: 'COMPLETED',
          clientFeePercent: 5.0,
          providerFeePercent: 95.0,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          termsType: 'STANDARD'
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
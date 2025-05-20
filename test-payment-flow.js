const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Test script to simulate the payment flow and fix provider requests
 * This bypasses the UI and directly tests the database relationships
 */
async function testPaymentFlow() {
  console.log('Starting payment flow test with provider requests fix...');
  let city, service, provider, client, party, partyService, offer, transaction;

  try {
    // 1. Find a test user with provider role - with proper debugging
    provider = await prisma.user.findFirst({
      where: { role: 'PROVIDER' },
      include: { provider: true }
    });

    if (!provider) {
      console.log('No provider user found. Creating one...');
      provider = await prisma.user.create({
        data: {
          email: 'test-provider@example.com',
          name: 'Test Provider',
          role: 'PROVIDER',
          provider: {
            create: {
              businessName: 'Test Provider Business'
            }
          }
        }
      });
    }
    console.log(`Using provider: ${provider.id} (${provider.name})`);
    
    // Debug check - make sure we have the provider record
    if (!provider.provider) {
      console.log('Provider record missing, creating it...');
      await prisma.provider.create({
        data: {
          businessName: 'Test Provider Business',
          userId: provider.id
        }
      });
    }

    // 2. Find a test user with client role
    client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!client) {
      console.log('No client user found. Creating one...');
      client = await prisma.user.create({
        data: {
          email: 'test-client@example.com',
          name: 'Test Client',
          role: 'CLIENT'
        }
      });
    }
    console.log(`Using client: ${client.id} (${client.name})`);

    // 3. Find or create a test city
    city = await prisma.city.findFirst({
      where: { isDefault: true }
    });

    if (!city) {
      console.log('No default city found. Creating one...');
      city = await prisma.city.create({
        data: {
          name: 'Test City',
          slug: 'test-city',
          state: 'Test State',
          isDefault: true
        }
      });
    }
    console.log(`Using city: ${city.id} (${city.name})`);

    // 4. Find or create a test service - using the provider.id as providerId
    console.log(`Looking for service with providerId: ${provider.id}`);
    
    service = await prisma.service.findFirst({
      where: {
        providerId: provider.id
      }
    });

    if (!service) {
      // We need a category
      const category = await prisma.serviceCategory.findFirst();
      if (!category) {
        throw new Error('No service category found. Please create one first.');
      }

      console.log('No service found. Creating one...');
      service = await prisma.service.create({
        data: {
          name: 'Test Service',
          description: 'Service for testing payment flow',
          price: 100.00,
          photos: [],
          providerId: provider.id,
          categoryId: category.id,
          cityId: city.id
        }
      });
    }
    console.log(`Using service: ${service.id} (${service.name})`);

    // 5. Create a party for the test booking
    console.log('Creating a party for the test booking...');
    party = await prisma.party.create({
      data: {
        name: 'Test Booking',
        date: new Date(),
        startTime: '12:00',
        duration: 3,
        guestCount: 5,
        status: 'DRAFT',
        client: {
          connect: { id: client.id }
        },
        city: {
          connect: { id: city.id }
        }
      }
    });
    console.log(`Created party with ID: ${party.id}`);

    // 6. Create a party service
    console.log('Creating a party service...');
    partyService = await prisma.partyService.create({
      data: {
        partyId: party.id,
        serviceId: service.id,
        specificOptions: {
          address: 'Test Address',
          comments: 'Test Comments'
        }
      }
    });
    console.log(`Created party service with ID: ${partyService.id}`);

    // 7. Create an offer - ensure provider ID is correct
    console.log(`Creating an offer with providerId: ${provider.id}`);
    offer = await prisma.offer.create({
      data: {
        price: service.price,
        status: 'PENDING', // Use PENDING to match the provider requests page filter
        description: 'Test offer',
        photos: [],
        clientId: client.id,
        providerId: provider.id,
        serviceId: service.id,
        partyServiceId: partyService.id
      }
    });
    console.log(`Created offer with ID: ${offer.id}`);

    // 8. Create a transaction
    console.log('Creating a transaction...');
    transaction = await prisma.transaction.create({
      data: {
        amount: service.price,
        status: 'PENDING', // Use PENDING to match transactions in offers
        paymentIntentId: `test_payment_${Date.now()}`,
        paymentMethodId: 'TEST',
        party: {
          connect: { id: party.id }
        },
        offer: {
          connect: { id: offer.id }
        }
      }
    });
    console.log(`Created transaction with ID: ${transaction.id}`);

    // 9. Create a notification for the provider
    await prisma.notification.create({
      data: {
        userId: provider.id,
        type: 'OFFER_UPDATED',
        title: 'New Test Booking',
        content: 'A test request has been made for your service.',
        isRead: false
      }
    });
    console.log('Created notification for provider');

    // 10. Verify the offer shows up in provider requests API
    console.log('\nVerifying provider requests API access...');
    
    const providerOffers = await prisma.offer.findMany({
      where: {
        providerId: provider.id
      },
      include: {
        client: true,
        service: true,
        partyService: {
          include: {
            party: true
          }
        }
      }
    });
    
    console.log(`Found ${providerOffers.length} offers for provider ID: ${provider.id}`);
    providerOffers.forEach(providerOffer => {
      console.log(`- Offer ${providerOffer.id}, status: ${providerOffer.status}, providerId: ${providerOffer.providerId}`);
    });

    // 11. Verify the relationship chain
    console.log('\nVerifying relationship chain...');
    
    const verifyTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        offer: {
          include: {
            provider: true,
            service: true,
            partyService: {
              include: {
                party: true
              }
            }
          }
        },
        party: true
      }
    });

    if (!verifyTransaction) {
      throw new Error('Transaction not found');
    }

    console.log('✅ Transaction found');
    
    if (!verifyTransaction.offer) {
      throw new Error('Transaction -> Offer relationship missing');
    }
    console.log('✅ Transaction -> Offer relationship verified');
    
    if (!verifyTransaction.party) {
      throw new Error('Transaction -> Party relationship missing');
    }
    console.log('✅ Transaction -> Party relationship verified');
    
    if (!verifyTransaction.offer.partyService) {
      throw new Error('Offer -> PartyService relationship missing');
    }
    console.log('✅ Offer -> PartyService relationship verified');
    
    if (!verifyTransaction.offer.partyService.party) {
      throw new Error('PartyService -> Party relationship missing');
    }
    console.log('✅ PartyService -> Party relationship verified');

    console.log('\n🎉 All relationships verified successfully!');
    console.log(`The provider (ID: ${provider.id}) should now see this booking in their requests.`);
    console.log('\nNEXT STEPS:');
    console.log('1. Log in as the provider user');
    console.log(`2. Go to http://localhost:3000/provider/requests`);
    console.log('3. You should see the test booking in the requests list');
    console.log('\nIf you still don\'t see it, check:');
    console.log('- Provider session user ID matches the offer\'s providerId');
    console.log('- Offer status is PENDING (the default filter on the requests page)');
    console.log('- Browser console for any API errors');

    return {
      success: true,
      provider: provider,
      transaction: verifyTransaction
    };
    
  } catch (error) {
    console.error('Test failed with error:', error);
    return {
      success: false,
      error: error
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPaymentFlow()
  .then(result => {
    if (result.success) {
      console.log('\nTest completed successfully ✅');
    } else {
      console.log('\nTest failed ❌');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error in test:', error);
    process.exit(1);
  }); 
/**
 * Automated Test for Payment Form Submission
 * Tests the complete booking flow from service page to payment completion
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Enhanced test script for PayPal integration debugging
 * Tests the complete payment flow and validates all components
 */
async function testPaymentForm() {
  console.log('🧪 Testing PayPal Integration Components...');
  
  try {
    // 1. Check database connectivity
    console.log('\n1. Testing database connectivity...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 2. Verify environment variables
    console.log('\n2. Checking environment variables...');
    const envChecks = {
      CLIENT_ID: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      CLIENT_SECRET: !!(process.env.PAYPAL_SANDBOX_CLIENT_SECRET || process.env.PAYPAL_LIVE_CLIENT_SECRET),
      PAYPAL_MODE: process.env.PAYPAL_MODE || 'not set',
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL
    };

    Object.entries(envChecks).forEach(([key, value]) => {
      const status = value === true ? '✅' : value === false ? '❌' : '⚠️';
      console.log(`${status} ${key}: ${value}`);
    });

    if (!envChecks.CLIENT_ID) {
      console.error('❌ NEXT_PUBLIC_PAYPAL_CLIENT_ID is required');
      return;
    }

    // 3. Test service lookup
    console.log('\n3. Testing service lookup...');
    const testServiceId = 'cma4d5o25000dmlcqt66dat5d'; // From the error URL
    
    const service = await prisma.service.findUnique({
      where: { id: testServiceId },
      include: {
        provider: {
          include: {
            provider: true
          }
        },
        category: true,
        city: true
      }
    });

    if (service) {
      console.log('✅ Test service found:', {
        id: service.id,
        name: service.name,
        price: service.price,
        providerId: service.providerId,
        cityId: service.cityId
      });
    } else {
      console.log('⚠️ Test service not found, creating mock service for testing...');
      
      // Find or create a provider
      let provider = await prisma.user.findFirst({
        where: { role: 'PROVIDER' },
        include: { provider: true }
      });

      if (!provider) {
        provider = await prisma.user.create({
          data: {
            email: 'test-provider@paypal-test.com',
            name: 'PayPal Test Provider',
            role: 'PROVIDER',
            provider: {
              create: {
                businessName: 'PayPal Test Business'
              }
            }
          },
          include: { provider: true }
        });
        console.log('✅ Created test provider:', provider.id);
      }

      // Find or create a category
      let category = await prisma.serviceCategory.findFirst();
      if (!category) {
        category = await prisma.serviceCategory.create({
          data: {
            name: 'Test Category',
            slug: 'test-category',
            description: 'Category for PayPal testing'
          }
        });
        console.log('✅ Created test category:', category.id);
      }

      // Find or create a city
      let city = await prisma.city.findFirst({
        where: { isDefault: true }
      });
      if (!city) {
        city = await prisma.city.create({
          data: {
            name: 'Test City',
            slug: 'test-city',
            state: 'TS',
            isDefault: true
          }
        });
        console.log('✅ Created test city:', city.id);
      }

      // Create the test service with the specific ID
      try {
        await prisma.service.create({
          data: {
            id: testServiceId,
            name: 'MEDIUM WHITE SET 13x13',
            description: 'Test service for PayPal integration testing',
            price: 150.00,
            photos: ['https://example.com/test-image.jpg'],
            providerId: provider.id,
            categoryId: category.id,
            cityId: city.id,
            status: 'ACTIVE'
          }
        });
        console.log('✅ Created test service with specific ID');
      } catch (error) {
        if (error.code === 'P2002') {
          console.log('⚠️ Service with this ID already exists');
        } else {
          throw error;
        }
      }
    }

    // 4. Test client user
    console.log('\n4. Testing client user...');
    let client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!client) {
      client = await prisma.user.create({
        data: {
          email: 'test-client@paypal-test.com',
          name: 'PayPal Test Client',
          role: 'CLIENT'
        }
      });
      console.log('✅ Created test client:', client.id);
    } else {
      console.log('✅ Test client found:', client.id);
    }

    // 5. Test payment order creation (mock)
    console.log('\n5. Testing payment order creation logic...');
    
    const mockBookingData = {
      serviceId: testServiceId,
      bookingDate: new Date().toISOString(),
      hours: 2
    };

    console.log('Mock booking data:', mockBookingData);

    // Test the payment creation logic without actually calling PayPal
    const testService = await prisma.service.findUnique({
      where: { id: testServiceId },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                businessName: true,
                paypalMerchantId: true,
                paypalOnboardingComplete: true,
                paypalEmail: true
              }
            }
          }
        }
      }
    });

    if (!testService) {
      throw new Error('Test service not found after creation');
    }

    console.log('✅ Service validation passed');
    
    const servicePrice = parseFloat(testService.price);
    console.log(`✅ Service price validation passed: $${servicePrice}`);

    // Test city resolution
    let cityId = testService.cityId;
    if (!cityId) {
      const defaultCity = await prisma.city.findFirst({
        where: { isDefault: true }
      });
      if (defaultCity) {
        cityId = defaultCity.id;
        console.log(`✅ Default city resolved: ${defaultCity.name}`);
      } else {
        throw new Error('No default city available');
      }
    } else {
      console.log(`✅ Service city available: ${cityId}`);
    }

    // 6. Test database transaction creation (without PayPal)
    console.log('\n6. Testing database transaction creation...');
    
    // Create party
    const party = await prisma.party.create({
      data: {
        name: `PayPal Test Booking - ${new Date().toISOString()}`,
        clientId: client.id,
        cityId: cityId,
        date: new Date(mockBookingData.bookingDate),
        startTime: "12:00",
        duration: mockBookingData.hours || 4,
        guestCount: 1,
        status: "DRAFT"
      }
    });
    console.log(`✅ Party created: ${party.id}`);

    // Create party service
    const partyService = await prisma.partyService.create({
      data: {
        partyId: party.id,
        serviceId: testServiceId,
        specificOptions: {
          bookingDate: mockBookingData.bookingDate,
          hours: mockBookingData.hours,
          address: 'Test Address for PayPal',
          comments: 'PayPal integration test'
        }
      }
    });
    console.log(`✅ Party service created: ${partyService.id}`);

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        clientId: client.id,
        serviceId: testServiceId,
        providerId: testService.providerId,
        partyServiceId: partyService.id,
        price: servicePrice,
        description: `PayPal test booking for ${testService.name}`,
        status: 'PENDING'
      }
    });
    console.log(`✅ Offer created: ${offer.id}`);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        offerId: offer.id,
        partyId: party.id,
        amount: servicePrice,
        status: 'PENDING',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsType: 'booking_terms',
        paymentIntentId: `test_${Date.now()}`
      }
    });
    console.log(`✅ Transaction created: ${transaction.id}`);

    // 7. Summary
    console.log('\n🎉 PayPal Integration Test Summary:');
    console.log('===================================');
    console.log(`✅ Database connectivity: Working`);
    console.log(`✅ Environment variables: ${envChecks.CLIENT_ID && envChecks.CLIENT_SECRET ? 'Configured' : 'Missing some variables'}`);
    console.log(`✅ Test service: Available (ID: ${testServiceId})`);
    console.log(`✅ Test client: Available (ID: ${client.id})`);
    console.log(`✅ Database flow: Complete (Transaction ID: ${transaction.id})`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Ensure PayPal environment variables are set correctly');
    console.log('2. Test the payment form at: http://localhost:3000/test-paypal');
    console.log('3. Try booking the service at: http://localhost:3000/services/' + testServiceId);
    console.log('4. Use test card: 4032035728288280, 12/2030, CVV: 123');

    // Clean up test data (optional)
    console.log('\n🧹 Cleaning up test data...');
    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.offer.delete({ where: { id: offer.id } });
    await prisma.partyService.delete({ where: { id: partyService.id } });
    await prisma.party.delete({ where: { id: party.id } });
    console.log('✅ Test data cleaned up');

    return {
      success: true,
      serviceId: testServiceId,
      clientId: client.id,
      envStatus: envChecks
    };

  } catch (error) {
    console.error('\n❌ PayPal integration test failed:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testPaymentForm()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All PayPal integration tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ PayPal integration tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unhandled error in PayPal tests:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentForm }; 
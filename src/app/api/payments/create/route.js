import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { PaymentService } from '@/lib/payment/payment-service.js';
import { getDefaultCity } from '@/lib/cities/default-city';

const paymentService = new PaymentService();

/**
 * Create payment order for a booking
 * POST /api/payments/create
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, bookingDate, hours } = body;

    if (!serviceId || !bookingDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating payment order for:', { serviceId, bookingDate, hours, userId: session.user.id });

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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
                paypalStatus: true
              }
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Service is not available' }, { status: 400 });
    }

    // Parse the service price
    const servicePrice = parseFloat(service.price);
    if (isNaN(servicePrice) || servicePrice <= 0) {
      return NextResponse.json({ error: 'Invalid service price' }, { status: 400 });
    }

    console.log(`Service price: $${servicePrice} for service: ${service.name}`);

    // Handle missing cityId
    let cityId = service.cityId;
    if (!cityId) {
      console.log('Service missing city ID, fetching a default city');
      const defaultCity = await getDefaultCity();
      if (defaultCity) {
        cityId = defaultCity.id;
        console.log(`Using default city: ${defaultCity.name} (${cityId})`);
      } else {
        console.error('No default city found in database');
        return NextResponse.json({ 
          error: 'Cannot process booking without city information. Please contact support.' 
        }, { status: 400 });
      }
    }

    // Create the party for this booking
    const party = await prisma.party.create({
      data: {
        name: `Booking for ${service.name}`,
        clientId: session.user.id,
        cityId: cityId,
        date: new Date(bookingDate),
        startTime: "12:00",
        duration: hours || 4,
        guestCount: 1,
        status: "DRAFT"
      }
    });

    console.log(`Created party: ${party.id}`);

    // Create the party service
    const partyService = await prisma.partyService.create({
      data: {
        partyId: party.id,
        serviceId: serviceId,
        specificOptions: {
          bookingDate: bookingDate,
          hours: hours,
          address: '',
          comments: `Booking for ${service.name}`
        }
      }
    });

    console.log(`Created party service: ${partyService.id}`);

    // Check if provider has a Provider record
    if (!service.provider.provider) {
      console.log(`Creating missing Provider record for user ${service.providerId}`);
      await prisma.provider.create({
        data: {
          userId: service.providerId,
          businessName: service.provider.name || 'Service Provider',
          isVerified: false,
          verificationLevel: 0
        }
      });
    }

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        clientId: session.user.id,
        serviceId: serviceId,
        providerId: service.providerId,
        partyServiceId: partyService.id,
        price: servicePrice,
        description: `Booking for ${service.name} on ${bookingDate}`,
        status: 'PENDING'
      }
    });

    console.log(`Created offer: ${offer.id}`);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        offerId: offer.id,
        partyId: party.id,
        amount: servicePrice,
        status: 'PENDING_PAYMENT',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsType: 'booking_terms'
      }
    });

    console.log(`Created transaction: ${transaction.id}`);

    // Try marketplace payment first (if provider has PayPal connected)
    let paymentResult;
    
    try {
      paymentResult = await paymentService.createMarketplacePaymentOrder(
        transaction.id,
        servicePrice,
        service.providerId,
        { paymentMethod: 'card_fields' }
      );
      
      console.log('Marketplace payment created:', paymentResult);
      
    } catch (marketplaceError) {
      console.log('Marketplace payment failed, falling back to regular payment:', marketplaceError.message);
      
      // Fallback to regular payment
      paymentResult = await paymentService.createPaymentOrder(
        transaction.id,
        servicePrice,
        { paymentMethod: 'card_fields' }
      );
      
      console.log('Regular payment created:', paymentResult);
    }

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: service.provider.id,
        type: 'NEW_OFFER',
        title: 'New Booking Request',
        content: `You have a new booking request for "${service.name}" from ${session.user.name}. Please review the details.`,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      orderId: paymentResult.orderId,
      transactionId: transaction.id,
      offerId: offer.id,
      amount: paymentResult.clientPays,
      isMarketplacePayment: paymentResult.isMarketplacePayment || false,
      breakdown: {
        servicePrice: servicePrice,
        clientPays: paymentResult.clientPays,
        ...(paymentResult.isMarketplacePayment && {
          providerReceives: paymentResult.providerReceives,
          platformCommission: paymentResult.platformCommission
        })
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order', details: error.message },
      { status: 500 }
    );
  }
} 
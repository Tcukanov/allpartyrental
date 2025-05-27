import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create payment order for a booking
 * POST /api/payments/create
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      serviceId, 
      bookingDate, 
      hours, 
      address, 
      comments, 
      contactPhone, 
      guestCount 
    } = body;

    if (!serviceId || !bookingDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    console.log('Creating payment order for:', { 
      serviceId, 
      bookingDate, 
      hours, 
      userId: session.user.id 
    });

    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        providerId: true
      }
    });

    if (!service) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service not found' 
      }, { status: 404 });
    }

    // Parse the service price
    const servicePrice = parseFloat(service.price);
    if (isNaN(servicePrice) || servicePrice <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid service price' 
      }, { status: 400 });
    }

    console.log(`Service price: $${servicePrice} for service: ${service.name}`);

    // Get default city for the party
    const defaultCity = await prisma.city.findFirst({
      where: { isDefault: true }
    });

    if (!defaultCity) {
      return NextResponse.json({ 
        success: false, 
        error: 'System configuration error' 
      }, { status: 500 });
    }

    // Create minimal party for this booking
    const party = await prisma.party.create({
      data: {
        name: `Direct booking for ${service.name}`,
        clientId: session.user.id,
        cityId: defaultCity.id,
        date: new Date(bookingDate),
        startTime: "12:00",
        duration: hours || 4,
        guestCount: guestCount || 1,
        status: "DRAFT"
      }
    });

    // Create party service
    const partyService = await prisma.partyService.create({
      data: {
        partyId: party.id,
        serviceId: serviceId,
        specificOptions: {
          bookingDate: bookingDate,
          hours: hours,
          address: address || '',
          comments: comments || '',
          contactPhone: contactPhone || ''
        }
      }
    });

    // Create offer
    const offer = await prisma.offer.create({
      data: {
        clientId: session.user.id,
        serviceId: serviceId,
        providerId: service.providerId,
        partyServiceId: partyService.id,
        price: servicePrice,
        description: `Direct booking for ${service.name}`,
        status: 'PENDING'
      }
    });

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        partyId: party.id,
        offerId: offer.id,
        amount: servicePrice,
        status: 'PENDING',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsType: 'direct_booking'
      }
    });

    console.log(`Created transaction: ${transaction.id}`);

    // Create PayPal order using environment variables
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ 
        success: false, 
        error: 'PayPal configuration missing' 
      }, { status: 500 });
    }

    // Get PayPal access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get PayPal token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: servicePrice.toFixed(2)
        },
        description: `Booking for ${service.name}`,
        custom_id: transaction.id
      }]
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('PayPal order creation failed:', errorText);
      throw new Error(`Failed to create PayPal order: ${orderResponse.status}`);
    }

    const orderResult = await orderResponse.json();
    console.log('PayPal order created:', orderResult.id);

    // Update transaction with PayPal order ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { paymentIntentId: orderResult.id }
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.id,
      transactionId: transaction.id,
      amount: servicePrice
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment order',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 
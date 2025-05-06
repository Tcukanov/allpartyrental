import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the service ID from the request
    const data = await request.json();
    const { serviceId, bookingDate, duration = 2, comments = '' } = data;
    
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: { message: 'serviceId is required' } },
        { status: 400 }
      );
    }
    
    console.log(`Creating debug transaction for user ${userId}, service ${serviceId}`);
    
    // 1. Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      );
    }
    
    // 2. Verify the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: true
      }
    });
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }
    
    // If the service doesn't have a provider, we can't proceed
    if (!service.providerId) {
      return NextResponse.json(
        { success: false, error: { message: 'Service does not have a provider' } },
        { status: 400 }
      );
    }
    
    // Create the debug transaction and related entities step by step
    
    // 1. Create the Party first
    const party = await prisma.party.create({
      data: {
        name: "Test booking",
        date: bookingDate ? new Date(bookingDate) : new Date(),
        startTime: "12:00",
        duration: duration,
        guestCount: 2,
        status: "DRAFT", // Valid PartyStatus enum value
        clientId: userId,
        cityId: service.cityId || "default-city-id", // Provide a fallback
      }
    });
    
    console.log(`Created party: ${party.id}`);
    
    // 2. Create the PartyService
    const partyService = await prisma.partyService.create({
      data: {
        partyId: party.id,
        serviceId: service.id,
        specificOptions: {}
      }
    });
    
    console.log(`Created party service: ${partyService.id}`);
    
    // 3. Create the Offer
    const offer = await prisma.offer.create({
      data: {
        clientId: userId,
        providerId: service.providerId,
        serviceId: service.id,
        partyServiceId: partyService.id,
        price: new Prisma.Decimal(service.price),
        description: comments || "Debug booking request",
        photos: [],
        status: "PENDING" // Valid OfferStatus enum value
      }
    });
    
    console.log(`Created offer: ${offer.id}`);
    
    // 4. Finally create the Transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: new Prisma.Decimal(service.price),
        status: "PENDING", // Valid TransactionStatus enum value
        clientFeePercent: 5.0,
        providerFeePercent: 10.0,
        partyId: party.id,
        offerId: offer.id
      }
    });
    
    console.log(`Created debug transaction: ${transaction.id}`);
    
    // Return all the created entities
    return NextResponse.json({
      success: true,
      message: "Debug transaction created successfully",
      data: {
        transaction,
        offer,
        party,
        partyService
      }
    });
  } catch (error) {
    console.error("Error creating debug transaction:", error);
    
    let errorMessage = "Failed to create debug transaction";
    let details = null;
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Prisma error (${error.code}): ${error.message}`;
      details = {
        code: error.code,
        meta: error.meta,
        message: error.message
      };
    } else if (error instanceof Error) {
      errorMessage = error.message;
      details = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: errorMessage,
          details
        } 
      },
      { status: 500 }
    );
  }
} 
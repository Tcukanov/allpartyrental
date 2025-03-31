import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    const { serviceId } = data;
    
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: { message: 'serviceId is required' } },
        { status: 400 }
      );
    }
    
    console.log(`Attempting to create test transaction for user ${userId}, service ${serviceId}`);
    
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
      where: { id: serviceId }
    });
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }
    
    // Use a Prisma transaction to create all required objects atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create test party
      const party = await tx.party.create({
        data: {
          name: "Test Party",
          date: new Date(),
          startTime: "12:00",
          duration: 2,
          guestCount: 10,
          status: "DRAFT",
          clientId: userId,
          cityId: service.cityId
        }
      });
      
      console.log(`Created test party: ${party.id}`);
      
      // Create test party service
      const partyService = await tx.partyService.create({
        data: {
          partyId: party.id,
          serviceId: service.id
        }
      });
      
      console.log(`Created test party service: ${partyService.id}`);
      
      // Create test offer
      const offer = await tx.offer.create({
        data: {
          clientId: userId,
          providerId: service.providerId,
          serviceId: service.id,
          partyServiceId: partyService.id,
          price: new Prisma.Decimal(service.price),
          description: "Test offer",
          photos: [],
          status: "PENDING"
        }
      });
      
      console.log(`Created test offer: ${offer.id}`);
      
      // Create test transaction
      const transaction = await tx.transaction.create({
        data: {
          offerId: offer.id,
          partyId: party.id,
          amount: new Prisma.Decimal(service.price),
          status: "PENDING",
          clientFeePercent: 5.0,
          providerFeePercent: 10.0
        }
      });
      
      console.log(`Created test transaction: ${transaction.id}`);
      
      return {
        party,
        partyService,
        offer,
        transaction
      };
    });
    
    return NextResponse.json({
      success: true,
      message: "Test transaction created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating test transaction:", error);
    
    let errorMessage = "Failed to create test transaction";
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
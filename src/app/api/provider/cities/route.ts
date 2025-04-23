import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET endpoint to fetch all cities for a provider
export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    console.log('GET /api/provider/cities: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Verify the user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log(`GET /api/provider/cities: User ${session.user.id} is not a provider, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }
    
    // Get the provider record
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!provider) {
      console.log(`GET /api/provider/cities: Provider record not found for user ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Provider record not found' } },
        { status: 404 }
      );
    }
    
    console.log(`GET /api/provider/cities: Found provider with ID: ${provider.id}`);
    
    // Get all cities this provider serves using the ProviderCity model
    const providerCities = await prisma.$queryRaw`
      SELECT pc.id as "providerCityId", c.*
      FROM "ProviderCity" pc
      JOIN "City" c ON pc."cityId" = c.id
      WHERE pc."providerId" = ${provider.id}
    `;
    
    console.log(`GET /api/provider/cities: Found ${Array.isArray(providerCities) ? providerCities.length : 0} cities for provider`);
    
    // Return the cities
    return NextResponse.json({
      success: true,
      data: providerCities,
    });
  } catch (error) {
    console.error('GET /api/provider/cities Error fetching provider cities:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch service locations' } },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new service location for a provider
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    console.log('POST /api/provider/cities: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id) {
      console.log("POST /api/provider/cities: No user session found");
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Verify the user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log(`POST /api/provider/cities: User ${session.user.id} is not a provider, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }
    
    // Get the provider record
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!provider) {
      console.log(`POST /api/provider/cities: Provider record not found for user ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Provider record not found' } },
        { status: 404 }
      );
    }
    
    console.log(`POST /api/provider/cities: Using provider with ID: ${provider.id}`);
    
    // Parse the request body
    const body = await request.json();
    const { cityId } = body;
    
    if (!cityId) {
      console.log("POST /api/provider/cities: No cityId provided in request body");
      return NextResponse.json(
        { success: false, error: { message: 'City ID is required' } },
        { status: 400 }
      );
    }
    
    console.log(`POST /api/provider/cities: Request to add city ID: ${cityId}`);
    
    // Verify the city exists
    const city = await prisma.city.findUnique({
      where: { id: cityId },
    });
    
    if (!city) {
      console.log(`POST /api/provider/cities: City with ID ${cityId} not found`);
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }
    
    console.log(`POST /api/provider/cities: Found city: ${city.name}, ${city.state}`);
    
    // Check if the provider already has this city in their service areas using raw SQL
    const existingProviderCity = await prisma.$queryRaw`
      SELECT * FROM "ProviderCity" 
      WHERE "providerId" = ${provider.id} AND "cityId" = ${cityId}
      LIMIT 1
    `;
    
    if (Array.isArray(existingProviderCity) && existingProviderCity.length > 0) {
      console.log(`POST /api/provider/cities: Provider already has service area for ${city.name}`);
      return NextResponse.json({
        success: true,
        message: 'This location is already in your service areas',
        data: {
          city,
          alreadyExists: true
        }
      });
    }
    
    try {
      // Create the provider-city relationship using raw SQL
      const result = await prisma.$executeRaw`
        INSERT INTO "ProviderCity" ("id", "providerId", "cityId", "createdAt", "updatedAt")
        VALUES (${Prisma.raw(`'${crypto.randomUUID()}'`)}, ${provider.id}, ${cityId}, NOW(), NOW())
        RETURNING id
      `;
      
      console.log(`POST /api/provider/cities: Added city ${city.name} to provider's service areas`);
      
      // Also create a notification to confirm the action
      const notification = await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'SYSTEM',
          title: 'Service Location Added',
          content: `${city.name}, ${city.state} has been added to your service locations.`,
          isRead: false
        }
      });
      
      console.log(`POST /api/provider/cities: Created notification: ${notification.id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Service location added successfully',
        data: {
          city,
          result
        }
      });
    } catch (createError) {
      console.error('POST /api/provider/cities: Error adding service location:', createError);
      if (createError instanceof Error) {
        console.error(`POST /api/provider/cities: Error details: ${createError.message}`);
        if (createError.stack) {
          console.error(`POST /api/provider/cities: Stack trace: ${createError.stack}`);
        }
      }
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Failed to add service location due to database error',
            details: createError instanceof Error ? createError.message : String(createError)
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/provider/cities: Error adding provider city:', error);
    if (error instanceof Error) {
      console.error(`POST /api/provider/cities: Error details: ${error.message}`);
      if (error.stack) {
        console.error(`POST /api/provider/cities: Stack trace: ${error.stack}`);
      }
    }
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to add service location',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 
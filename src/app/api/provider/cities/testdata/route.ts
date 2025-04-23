import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST endpoint to create test data
export async function POST(request: NextRequest) {
  try {
    console.log('Creating test data for provider cities...');
    
    // Step 1: Get first city
    const city = await prisma.city.findFirst({
      orderBy: { name: 'asc' }
    });
    
    if (!city) {
      return NextResponse.json(
        { success: false, error: { message: 'No cities found in the database' } },
        { status: 404 }
      );
    }
    
    console.log(`Found city: ${city.name}, ${city.state}, ID: ${city.id}`);
    
    // Step 2: Get first provider
    const provider = await prisma.provider.findFirst({
      orderBy: { createdAt: 'asc' },
      include: { user: true }
    });
    
    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'No providers found in the database' } },
        { status: 404 }
      );
    }
    
    console.log(`Found provider: ${provider.businessName}, ID: ${provider.id}, User ID: ${provider.userId}`);
    
    // Step 3: Delete any existing provider city relationships
    await prisma.$executeRaw`
      DELETE FROM "ProviderCity" 
      WHERE "providerId" = ${provider.id}
    `;
    console.log(`Deleted existing provider city relationships for provider ${provider.id}`);
    
    // Step 4: Create a new provider city relationship
    await prisma.$executeRaw`
      INSERT INTO "ProviderCity" ("id", "providerId", "cityId", "createdAt", "updatedAt")
      VALUES (${Prisma.raw(`'${crypto.randomUUID()}'`)}, ${provider.id}, ${city.id}, NOW(), NOW())
    `;
    console.log(`Created ProviderCity relationship for provider ${provider.id} and city ${city.id}`);
    
    // Step 5: Verify the relationship exists
    const providerCityRelationship = await prisma.$queryRaw`
      SELECT * FROM "ProviderCity" 
      WHERE "providerId" = ${provider.id} AND "cityId" = ${city.id}
      LIMIT 1
    `;
    
    const exists = Array.isArray(providerCityRelationship) && providerCityRelationship.length > 0;
    console.log(`Verified provider city relationship exists: ${exists}`);
    
    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      data: {
        provider: {
          id: provider.id,
          name: provider.businessName,
          userId: provider.userId,
          userName: provider.user.name
        },
        city: {
          id: city.id,
          name: city.name,
          state: city.state
        },
        relationshipExists: exists
      }
    });
  } catch (error) {
    console.error('Error creating test data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to create test data',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check test data
export async function GET() {
  try {
    // Get first provider
    const provider = await prisma.provider.findFirst({
      orderBy: { createdAt: 'asc' }
    });
    
    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'No providers found in the database' } },
        { status: 404 }
      );
    }
    
    // Get provider cities
    const providerCityResults = await prisma.$queryRaw`
      SELECT pc.id as "providerCityId", c.*
      FROM "ProviderCity" pc
      JOIN "City" c ON pc."cityId" = c.id
      WHERE pc."providerId" = ${provider.id}
    `;
    
    const cities = Array.isArray(providerCityResults) ? providerCityResults : [];
    
    return NextResponse.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          businessName: provider.businessName
        },
        serviceCities: cities.map(city => ({
          id: city.id,
          name: city.name,
          state: city.state,
          providerCityId: city.providerCityId
        })),
        count: cities.length
      }
    });
  } catch (error) {
    console.error('Error checking test data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to check test data',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 
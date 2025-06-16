import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST endpoint to migrate existing placeholder services to the new ProviderCity model
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    console.log('POST /api/provider/cities/migrate: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id) {
      console.log("POST /api/provider/cities/migrate: No user session found");
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Verify the user is an admin
    if (session.user.role !== 'ADMIN') {
      console.log(`POST /api/provider/cities/migrate: User ${session.user.id} is not an admin, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only admins can access this endpoint' } },
        { status: 403 }
      );
    }
    
    console.log('POST /api/provider/cities/migrate: Starting migration of placeholder services to ProviderCity...');
    
    // Find all providers
    const providers = await prisma.provider.findMany({
      select: { id: true, userId: true },
    });
    
    const results = {
      totalProviders: providers.length,
      processedProviders: 0,
      totalPlaceholderServices: 0,
      migratedRelationships: 0,
      errors: []
    };
    
    // Process each provider
    for (const provider of providers) {
      try {
        // Since services no longer have cityId, this migration is no longer applicable
        // Skip placeholder service migration as the architecture has changed
        const placeholderServices = [];
        
        console.log(`POST /api/provider/cities/migrate: Found ${placeholderServices.length} placeholder services for provider ${provider.id}`);
        results.totalPlaceholderServices += placeholderServices.length;
        
        // Process each placeholder service
        for (const service of placeholderServices) {
          try {
            if (!service.cityId) continue;
            
            // Check if relationship already exists
            const existingRelation = await prisma.$queryRaw`
              SELECT COUNT(*) FROM "ProviderCity"
              WHERE "providerId" = ${provider.id} AND "cityId" = ${service.cityId}
            `;
            
            // If relation doesn't exist, create it
            if (existingRelation[0].count === '0') {
              await prisma.$executeRaw`
                INSERT INTO "ProviderCity" ("id", "providerId", "cityId", "createdAt", "updatedAt")
                VALUES (${Prisma.raw(`'${crypto.randomUUID()}'`)}, ${provider.id}, ${service.cityId}, NOW(), NOW())
              `;
              results.migratedRelationships++;
              console.log(`POST /api/provider/cities/migrate: Created ProviderCity relationship for provider ${provider.id} and city ${service.cityId}`);
            } else {
              console.log(`POST /api/provider/cities/migrate: ProviderCity relationship already exists for provider ${provider.id} and city ${service.cityId}`);
            }
          } catch (serviceError) {
            console.error(`POST /api/provider/cities/migrate: Error processing service ${service.id}:`, serviceError);
            results.errors.push(`Error processing service ${service.id}: ${serviceError instanceof Error ? serviceError.message : String(serviceError)}`);
          }
        }
      } catch (providerError) {
        console.error(`POST /api/provider/cities/migrate: Error processing provider ${provider.id}:`, providerError);
        results.errors.push(`Error processing provider ${provider.id}: ${providerError instanceof Error ? providerError.message : String(providerError)}`);
      }
      
      results.processedProviders++;
    }
    
    console.log('POST /api/provider/cities/migrate: Migration completed', results);
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      data: results
    });
  } catch (error) {
    console.error('POST /api/provider/cities/migrate: Error during migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to complete migration',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    console.log('GET /api/provider/cities/migrate: Session check', { 
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
    
    // Verify the user is an admin
    if (session.user.role !== 'ADMIN') {
      console.log(`GET /api/provider/cities/migrate: User ${session.user.id} is not an admin, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only admins can access this endpoint' } },
        { status: 403 }
      );
    }
    
    // Since services no longer have cityId, placeholder service count is 0
    const placeholderServiceCount = 0;
    
    // Count provider city relationships
    const providerCityCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) AS count FROM "ProviderCity"
    `;
    
    // Convert BigInt to Number if needed
    let providerCityCount = 0;
    if (Array.isArray(providerCityCountResult) && providerCityCountResult.length > 0) {
      const countValue = providerCityCountResult[0].count;
      // Convert BigInt to string then to number to avoid serialization issues
      providerCityCount = typeof countValue === 'bigint' 
        ? Number(countValue.toString()) 
        : (typeof countValue === 'string' ? parseInt(countValue, 10) : Number(countValue));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        placeholderServiceCount,
        providerCityCount,
      }
    });
  } catch (error) {
    console.error('GET /api/provider/cities/migrate: Error checking migration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to check migration status',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const cityId = searchParams.get('cityId');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const color = searchParams.get('color');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    console.log('Search parameters:', { 
      categoryId, 
      cityId, 
      search, 
      minPrice, 
      maxPrice, 
      color, 
      sort, 
      limit, 
      page 
    });

    // Build query conditions
    const where: any = {
      status: 'ACTIVE', // Only return active services
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Handle city filtering in a different way
    if (cityId) {
      try {
        console.log(`Processing city filtering for cityId: ${cityId}`);
        
        // Get providers who serve this city from ProviderCity table
        const providersWithCity = await prisma.$queryRaw`
          SELECT p."userId" as "providerId"
          FROM "ProviderCity" pc
          JOIN "Provider" p ON pc."providerId" = p.id
          WHERE pc."cityId" = ${cityId}
        `;
        
        // Extract provider IDs
        const providerIds: string[] = [];
        if (Array.isArray(providersWithCity) && providersWithCity.length > 0) {
          providersWithCity.forEach(p => {
            if (p.providerId) providerIds.push(p.providerId);
          });
          console.log(`Found ${providerIds.length} providers with service locations in city ${cityId}`);
        } else {
          console.log(`No providers found with service locations in city ${cityId}`);
        }
        
        // Fixed approach: Either services in this exact city OR services from providers who serve this city
        // This ensures we only include relevant services
        if (providerIds.length > 0) {
          where.OR = [
            { cityId }, // Services directly in this city
            { 
              AND: [
                { providerId: { in: providerIds } }, // From providers who serve this city
                { 
                  OR: [
                    { cityId }, // Either exact match on city
                    { cityId: null } // Or no city specified (provider-wide services)
                  ]
                }
              ]
            }
          ];
          console.log(`Using improved city filtering with ${providerIds.length} provider IDs`);
        } else {
          // If no providers found, just filter by cityId
          where.cityId = cityId;
          console.log(`No providers serve this city, filtering only by exact cityId match: ${cityId}`);
        }
      } catch (error) {
        console.error('Error finding providers with city:', error);
        // Fallback to simple cityId filtering
        where.cityId = cityId;
        console.log(`Error occurred, falling back to simple cityId filtering: ${cityId}`);
      }
    }

    if (search) {
      where.OR = where.OR || [];
      where.OR.push(
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      );
    }

    // Filter by color if provided
    if (color) {
      where.colors = {
        has: color
      };
    }

    // Process dynamic filter parameters
    // Look for params that start with "filter_" and extract the filter id
    const filterParams = Array.from(searchParams.entries())
      .filter(([key]) => key.startsWith('filter_'))
      .map(([key, value]) => ({
        filterId: key.replace('filter_', ''),
        value
      }));
    
    // If we have filter parameters, we need to fetch services with matching metadata
    if (filterParams.length > 0) {
      console.log('Processing filter params:', filterParams);
      
      try {
        // Get all services that match the basic criteria
        const baseMatchingServices = await prisma.service.findMany({
          where,
          select: { id: true, metadata: true }
        });
        
        // Post-filter to check metadata values
        const filteredServiceIds = baseMatchingServices
          .filter(service => {
            // Skip services without metadata
            if (!service.metadata) return false;
            
            try {
              // Parse metadata (stored as JSON string)
              const metadata = typeof service.metadata === 'string' 
                ? JSON.parse(service.metadata) 
                : service.metadata;
              
              // Get filter values from metadata
              const filterValues = metadata?.filterValues || {};
              
              // Check if service matches all filter criteria
              return filterParams.every(({ filterId, value }) => {
                // The value from the query params
                const requestedValues = value.split(',');
                
                // The value in the service metadata
                const serviceValue = filterValues[filterId];
                
                // Skip if the service doesn't have this filter
                if (serviceValue === undefined) return false;
                
                // For array values (multi-select filters)
                if (Array.isArray(serviceValue)) {
                  // If any requested value is in the service values
                  return requestedValues.some(rv => serviceValue.includes(rv));
                }
                
                // For string values (single-select filters)
                return requestedValues.includes(serviceValue);
              });
            } catch (error) {
              console.error('Error parsing service metadata:', error);
              return false;
            }
          })
          .map(service => service.id);
        
        // Add the filtered IDs to the where clause
        if (filteredServiceIds.length > 0) {
          where.id = { in: filteredServiceIds };
        } else {
          // If no services match the filters, return empty results
          return NextResponse.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page,
              limit,
              pages: 0,
            },
          });
        }
      } catch (error) {
        console.error('Error processing filter parameters:', error);
        // Continue with basic query without filters
      }
    }

    // Initialize price filter if needed
    if (minPrice || maxPrice) {
      where.price = {};
      
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Determine sorting order
    let orderBy: any = { createdAt: 'desc' };
    
    if (sort) {
      if (sort === 'price_asc') {
        orderBy = { price: 'asc' };
      } else if (sort === 'price_desc') {
        orderBy = { price: 'desc' };
      }
    }

    console.log('Final query where clause:', JSON.stringify(where, null, 2));

    // Get services with pagination
    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        city: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: true,
            // Include provider business location details
            provider: {
              select: {
                businessName: true,
                businessCity: true,
                businessState: true
              }
            }
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    console.log(`Found ${services.length} services matching criteria`);

    // Get total count for pagination
    const total = await prisma.service.count({ where });

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch services',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
} 
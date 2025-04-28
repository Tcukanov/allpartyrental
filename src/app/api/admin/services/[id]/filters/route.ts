import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Use raw query to fetch the service with all its properties
    const serviceResults = await prisma.$queryRaw`
      SELECT s.*, 
             c.id as "categoryId", c.name as "categoryName", 
             c.slug as "categorySlug", c.description as "categoryDescription"
      FROM "Service" s
      LEFT JOIN "ServiceCategory" c ON s."categoryId" = c.id
      WHERE s.id = ${id}
      LIMIT 1
    `;
    
    // Check if service exists
    if (!Array.isArray(serviceResults) || serviceResults.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }
    
    const service = serviceResults[0];

    // Fetch the category filters with a separate raw query
    const categoryFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter"
      WHERE "categoryId" = ${service.categoryId}
      ORDER BY "createdAt" ASC
    `;

    let filterValues = {};
    if (service.metadata) {
      try {
        const parsedData = typeof service.metadata === 'string' 
          ? JSON.parse(service.metadata) 
          : service.metadata;
        
        filterValues = parsedData.filterValues || parsedData;
      } catch (error) {
        console.error('Error parsing metadata:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        serviceId: service.id,
        filterValues,
        categoryFilters: Array.isArray(categoryFilters) ? categoryFilters : [],
        rawMetadata: service.metadata
      }
    });
  } catch (error) {
    console.error('Error fetching filter values:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { filterValues } = data;

    if (!filterValues) {
      return NextResponse.json(
        { success: false, error: { message: 'Filter values are required' } },
        { status: 400 }
      );
    }

    // Check if service exists with raw query
    const serviceResults = await prisma.$queryRaw`
      SELECT id, "providerId", "categoryId", name
      FROM "Service"
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!Array.isArray(serviceResults) || serviceResults.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    const metadata = JSON.stringify({ filterValues });

    // Update service with raw query
    await prisma.$executeRaw`
      UPDATE "Service"
      SET metadata = ${metadata}::jsonb,
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // Fetch updated service with its relations
    const updatedServiceResults = await prisma.$queryRaw`
      SELECT s.*, 
             c.id as "categoryId", c.name as "categoryName", 
             c.slug as "categorySlug", c.description as "categoryDescription",
             ct.id as "cityId", ct.name as "cityName", 
             ct.slug as "citySlug", ct.state as "cityState"
      FROM "Service" s
      LEFT JOIN "ServiceCategory" c ON s."categoryId" = c.id
      LEFT JOIN "City" ct ON s."cityId" = ct.id
      WHERE s.id = ${id}
      LIMIT 1
    `;

    const updatedService = updatedServiceResults[0];

    return NextResponse.json({
      success: true,
      message: 'Filter values updated successfully',
      data: {
        service: updatedService,
        filterValues
      }
    });
  } catch (error) {
    console.error('Error updating filter values:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update filter values' } },
      { status: 500 }
    );
  }
} 
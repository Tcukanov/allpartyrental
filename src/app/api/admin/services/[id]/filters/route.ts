export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

// GET endpoint to fetch filter values for a service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get the service with metadata
    const service: any = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            filters: true // Include category filters
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Parse metadata if it exists
    let filterValues = {};
    if (service.metadata) {
      try {
        let parsedData;
        if (typeof service.metadata === 'string') {
          parsedData = JSON.parse(service.metadata);
        } else {
          parsedData = service.metadata;
        }

        // Extract filter values
        if (parsedData.filterValues) {
          filterValues = parsedData.filterValues;
        } else if (typeof parsedData === 'object') {
          // If metadata itself is the filter values
          filterValues = parsedData;
        }
      } catch (error) {
        console.error('Error parsing metadata:', error);
        console.log('Raw metadata:', service.metadata);
      }
    }

    // Get available filters for this category
    const categoryFilters = service.category?.filters || [];

    return NextResponse.json({
      success: true,
      data: {
        serviceId: service.id,
        filterValues,
        categoryFilters,
        rawMetadata: service.metadata // Include raw metadata for debugging
      }
    });
  } catch (error) {
    console.error('Error fetching filter values:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update filter values
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await request.json();
    const { filterValues } = data;

    if (!filterValues) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Filter values are required' } },
        { status: 400 }
      );
    }

    // Get the service first
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Create metadata JSON with updated filter values
    const metadata = JSON.stringify({ filterValues });

    // Update the service with new metadata
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        metadata
      } as any,
      include: {
        category: true,
        city: true
      }
    });

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
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update filter values',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 
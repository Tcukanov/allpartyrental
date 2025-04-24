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

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            filters: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

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

    const categoryFilters = service.category?.filters || [];

    return NextResponse.json({
      success: true,
      data: {
        serviceId: service.id,
        filterValues,
        categoryFilters,
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

    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    const metadata = JSON.stringify({ filterValues });

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        metadata
      },
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
      { success: false, error: { message: 'Failed to update filter values' } },
      { status: 500 }
    );
  }
} 
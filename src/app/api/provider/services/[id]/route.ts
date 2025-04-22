import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

// Define an extended service type that includes metadata
interface ServiceWithMetadata {
  id: string;
  name: string;
  description: string;
  price: number | string;
  categoryId: string;
  cityId: string;
  providerId: string;
  photos: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  availableDays: string[];
  availableHoursStart?: string | null;
  availableHoursEnd?: string | null;
  minRentalHours?: number | null;
  maxRentalHours?: number | null;
  colors: string[];
  metadata?: string | null;
  filterValues?: Record<string, any>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get the service
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Check if user is a provider and owns this service
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'PROVIDER' || service.providerId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Process metadata if it exists
    const serviceWithMeta = service as unknown as ServiceWithMetadata;
    let responseService = { ...serviceWithMeta };
    
    try {
      if (serviceWithMeta.metadata) {
        const metadata = JSON.parse(serviceWithMeta.metadata);
        responseService = {
          ...responseService,
          filterValues: metadata.filterValues || {}
        };
      }
    } catch (e) {
      console.error('Error parsing metadata:', e);
      // Continue with the original service
    }

    return NextResponse.json({
      success: true,
      data: responseService
    }, { status: 200 });
  } catch (error) {
    console.error('Get service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    
    // Extract filterValues if present
    const { filterValues, ...data } = requestData;
    
    // Prepare metadata if filterValues are provided
    let metadata = null;
    if (filterValues) {
      metadata = JSON.stringify({ filterValues });
    }
    
    // Add metadata to the update data
    const updateData = {
      ...data,
      metadata
    };
    
    const service = await prisma.service.update({
      where: {
        id: id,
        providerId: session.user.id
      },
      data: updateData,
      include: {
        category: true,
        city: true
      }
    });

    // Add filterValues to the response if they were provided
    const responseService = filterValues ? {
      ...service,
      filterValues
    } : service;

    return NextResponse.json({
      success: true,
      data: responseService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.service.delete({
      where: {
        id: id,
        providerId: session.user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
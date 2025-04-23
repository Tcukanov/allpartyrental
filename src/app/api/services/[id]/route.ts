import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

interface ServiceWithMetadata {
  id: string;
  name: string;
  description: string;
  price: number | string;
  categoryId: string;
  cityId?: string | null;
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
  provider?: any;
  category?: any;
  city?: any;
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    // Get service by ID
    const service = await prisma.service.findUnique({
      where: {
        id,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatar: true,
                phone: true,
                website: true,
                isProStatus: true,
                googleBusinessUrl: true,
                googleBusinessRating: true,
              },
            },
          },
        },
        category: true,
        city: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: service
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
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get service by ID 
    const existingService = await prisma.service.findUnique({
      where: { id },
      select: {
        providerId: true,
        cityId: true,
        categoryId: true, 
        name: true,
        description: true,
        price: true,
        photos: true,
        status: true,
        availableDays: true,
        availableHoursStart: true,
        availableHoursEnd: true,
        minRentalHours: true,
        maxRentalHours: true,
      }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }
    
    // Check if user owns the service or is an admin
    if (existingService.providerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to update this service' } },
        { status: 403 }
      );
    }
    
    // Extract fields from body
    const body = await request.json();
    const {
      name,
      description,
      price,
      categoryId,
      cityId,
      photos,
      status,
      availableDays,
      availableHoursStart,
      availableHoursEnd,
      minRentalHours,
      maxRentalHours
    } = body;
    
    // Build update object with only valid fields to avoid schema mismatches
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (cityId !== undefined) updateData.cityId = cityId || null;
    if (photos !== undefined) updateData.photos = photos;
    if (status !== undefined) updateData.status = status;
    
    // Handle availability and rental fields if provided
    if (availableDays !== undefined) {
      updateData.availableDays = Array.isArray(availableDays) ? availableDays : existingService.availableDays;
    }
    
    if (availableHoursStart !== undefined) {
      updateData.availableHoursStart = availableHoursStart;
    }
    
    if (availableHoursEnd !== undefined) {
      updateData.availableHoursEnd = availableHoursEnd;
    }
    
    if (minRentalHours !== undefined) {
      updateData.minRentalHours = typeof minRentalHours === 'number' ? minRentalHours : 
        (minRentalHours ? parseInt(String(minRentalHours)) : existingService.minRentalHours);
    }
    
    if (maxRentalHours !== undefined) {
      updateData.maxRentalHours = typeof maxRentalHours === 'number' ? maxRentalHours : 
        (maxRentalHours ? parseInt(String(maxRentalHours)) : existingService.maxRentalHours);
    }
    
    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({ success: true, data: service }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
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
        { error: 'Unauthorized' },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
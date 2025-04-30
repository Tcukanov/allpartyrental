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
    
    // Handle the case when blockedDates field might not exist
    let existingBlockedDates: Date[] = [];
    try {
      // Try to get the full service to check if blockedDates exists
      const fullService = await prisma.service.findUnique({
        where: { id }
      });
      // @ts-ignore - Ignore TypeScript errors as the field might not exist
      if (fullService && Array.isArray(fullService.blockedDates)) {
        // @ts-ignore
        existingBlockedDates = fullService.blockedDates;
      }
    } catch (error) {
      console.warn("Could not fetch existing blockedDates, might not exist in the schema:", error);
    }
    
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
      maxRentalHours,
      blockedDates,
      colors,
      filterValues
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
    if (colors !== undefined) updateData.colors = colors;
    
    // Handle metadata for filterValues if provided
    if (filterValues !== undefined) {
      try {
        const metadata = JSON.stringify({ filterValues });
        updateData.metadata = metadata;
      } catch (error) {
        console.error("Error stringifying filter values:", error);
      }
    }
    
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
    
    // Handle blocked dates if provided
    if (blockedDates !== undefined) {
      try {
        console.log("Processing blockedDates:", blockedDates);
        
        // Ensure blockedDates is an array
        if (!Array.isArray(blockedDates)) {
          console.warn("blockedDates is not an array, setting to empty array");
          updateData.blockedDates = [];
        } else {
          // Convert blockedDates to Date objects
          const parsedDates = blockedDates
            .filter(dateStr => dateStr && typeof dateStr === 'string')
            .map(dateStr => {
              try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                  return null;
                }
                return date;
              } catch (e) {
                return null;
              }
            })
            .filter(Boolean);
          
          console.log("Parsed dates:", parsedDates);
          // Add to update data
          updateData.blockedDates = parsedDates;
        }
      } catch (error) {
        console.error("Error processing blockedDates:", error);
        // Don't add to update data if there's an error
        delete updateData.blockedDates;
      }
    }
    
    // Update service
    try {
      console.log("Updating service with data:", updateData);
      const service = await prisma.service.update({
        where: { id },
        data: updateData,
      });
      
      return NextResponse.json({ success: true, data: service }, { status: 200 });
    } catch (error) {
      console.error('Prisma error updating service:', error);
      
      // Extract detailed error info
      let errorMessage = 'Database error while updating service';
      let errorDetails = 'Unknown error';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || 'No stack trace';
        
        // Check for Prisma-specific error properties
        // @ts-ignore - Access potential Prisma error properties
        if (error.code) {
          // @ts-ignore
          console.error(`Prisma error code: ${error.code}`);
        }
        
        // @ts-ignore
        if (error.meta) {
          // @ts-ignore
          console.error(`Prisma error meta: ${JSON.stringify(error.meta)}`);
        }
      }
      
      // Try a fallback approach with just basics
      try {
        console.log("Attempting fallback update without blockedDates");
        const { blockedDates, ...basicUpdateData } = updateData;
        
        const service = await prisma.service.update({
          where: { id },
          data: basicUpdateData,
        });
        
        return NextResponse.json({ 
          success: true, 
          data: service,
          warning: "Updated without blockedDates due to error"
        }, { status: 200 });
      } catch (fallbackError) {
        console.error("Even fallback approach failed:", fallbackError);
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: errorMessage,
            details: errorDetails
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
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
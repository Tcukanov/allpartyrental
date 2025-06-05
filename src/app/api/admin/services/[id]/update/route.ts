export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

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

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Extract the data we want to update
    const {
      name,
      description,
      price,
      cityId,
      availableDays,
      availableHoursStart,
      availableHoursEnd,
      minRentalHours,
      maxRentalHours,
      colors,
      metadata
    } = data;

    // Verify the service exists and is pending approval
    const serviceExists = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        city: true,
        provider: true
      }
    });

    if (!serviceExists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Update the service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        price: typeof price === 'string' ? parseFloat(price) : price,
        cityId,
        availableDays: availableDays || [],
        availableHoursStart,
        availableHoursEnd,
        minRentalHours: minRentalHours ? parseInt(String(minRentalHours)) : null,
        maxRentalHours: maxRentalHours ? parseInt(String(maxRentalHours)) : null,
        colors: colors || [],
        metadata
      } as any,
      include: {
        category: true,
        city: true,
        provider: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Service updated successfully',
      service: updatedService
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update service',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 
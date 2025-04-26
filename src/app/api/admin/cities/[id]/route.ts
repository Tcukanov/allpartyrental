import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { DEFAULT_CITY_SETTING_KEY } from '@/lib/cities/default-city';
import { setDefaultCity } from '@/lib/cities/default-city';

/**
 * PUT: Update a city by ID (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id }
    });

    if (!existingCity) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    // Get update data
    const { name, slug, isActive, isDefault } = await request.json();

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Missing required fields: name, slug' }
        },
        { status: 400 }
      );
    }

    // If slug changed, check if new slug already exists
    if (slug !== existingCity.slug) {
      const slugExists = await prisma.city.findFirst({
        where: { slug: slug, id: { not: id } }
      });

      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            error: { message: 'A city with this slug already exists' }
          },
          { status: 409 }
        );
      }
    }

    // Update the city
    const updatedCity = await prisma.city.update({
      where: { id },
      data: { 
        name, 
        slug
      }
    });

    // Handle default city setting if provided
    if (isDefault === true) {
      await setDefaultCity(id);
    }

    // Check if this is now the default city
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });
    
    const isDefaultCity = defaultCitySetting?.value === id;

    // Return the updated city with the default flag
    return NextResponse.json(
      { 
        success: true, 
        data: {
          ...updatedCity,
          isDefault: isDefaultCity
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating city:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to update city',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a city by ID (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Check if city exists
    const existingCity = await prisma.city.findUnique({
      where: { id }
    });

    if (!existingCity) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    // Check if this is the default city
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });
    
    if (defaultCitySetting?.value === id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Cannot delete the default city',
            details: 'Please set another city as default before deleting this one'
          } 
        },
        { status: 409 } // Conflict
      );
    }

    // Check for related services - prevent deletion if services exist
    const servicesCount = await prisma.service.count({
      where: { cityId: id }
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Cannot delete city - it has ${servicesCount} service(s) associated with it`,
            details: 'Remove or reassign all services in this city before deleting'
          } 
        },
        { status: 409 } // Conflict
      );
    }

    // Check for related parties - prevent deletion if parties exist
    const partiesCount = await prisma.party.count({
      where: { cityId: id }
    });

    if (partiesCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Cannot delete city - it has ${partiesCount} party/parties associated with it`,
            details: 'Remove or reassign all parties in this city before deleting'
          } 
        },
        { status: 409 } // Conflict
      );
    }

    // Delete city
    await prisma.city.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      data: { message: 'City deleted successfully' } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error deleting city:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to delete city',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 
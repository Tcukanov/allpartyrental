import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { DEFAULT_CITY_SETTING_KEY } from '@/lib/cities/default-city';

/**
 * POST: Create a new city (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    const { name, slug, state } = data;

    // Validate required fields
    if (!name || !slug || !state) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Check if city with the same slug already exists
    const existingCity = await prisma.city.findFirst({
      where: { slug }
    });

    if (existingCity) {
      return NextResponse.json(
        { success: false, error: { message: 'A city with this slug already exists' } },
        { status: 409 } // Conflict
      );
    }

    // Create new city
    const city = await prisma.city.create({
      data: {
        name,
        slug,
        state: state.toUpperCase()
      }
    });

    return NextResponse.json({ success: true, data: city }, { status: 201 });
  } catch (error) {
    console.error('Error creating city:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to create city',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * GET: List all cities (admin only)
 */
export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get default city setting
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });
    
    const defaultCityId = defaultCitySetting?.value || null;

    // Get all cities
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' }
    });

    // Add isDefault flag to each city
    const citiesWithDefault = cities.map(city => ({
      ...city,
      isDefault: city.id === defaultCityId
    }));

    return NextResponse.json({ success: true, data: citiesWithDefault }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch cities',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 
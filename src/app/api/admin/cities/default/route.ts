import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { getDefaultCity, setDefaultCity } from '@/lib/cities/default-city';

/**
 * GET: Get the default city
 */
export async function GET() {
  try {
    const defaultCity = await getDefaultCity();

    return NextResponse.json({ 
      success: true, 
      data: defaultCity 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching default city:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch default city',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Set a city as the default (admin only)
 */
export async function PUT(request: NextRequest) {
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
    const { cityId } = data;

    if (!cityId) {
      return NextResponse.json(
        { success: false, error: { message: 'City ID is required' } },
        { status: 400 }
      );
    }

    const city = await setDefaultCity(cityId);

    if (!city) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        message: `${city.name} is now the default city`,
        city
      } 
    }, { status: 200 });
  } catch (error) {
    console.error('Error setting default city:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to set default city',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 
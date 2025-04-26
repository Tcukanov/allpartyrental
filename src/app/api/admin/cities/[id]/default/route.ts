import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { setDefaultCity } from '@/lib/cities/default-city';

/**
 * POST: Set a city as the default city (admin only)
 */
export async function POST(
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

    // Set as default city
    const updatedCity = await setDefaultCity(id);

    if (!updatedCity) {
      return NextResponse.json(
        { success: false, error: { message: 'Failed to set default city' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        ...updatedCity,
        isDefault: true,
        message: `${updatedCity.name} is now the default city`
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
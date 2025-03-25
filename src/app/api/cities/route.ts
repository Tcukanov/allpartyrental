import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get all cities
    const cities = await prisma.city.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: cities,
    }, { status: 200 });
  } catch (error) {
    console.error('Get cities error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
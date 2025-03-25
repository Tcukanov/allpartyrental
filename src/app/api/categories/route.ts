import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get all categories
    const categories = await prisma.serviceCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    }, { status: 200 });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
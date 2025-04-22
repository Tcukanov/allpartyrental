import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true }
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }

    // Get filters for this category
    const filters = await prisma.categoryFilter.findMany({
      where: { categoryId },
    });

    return NextResponse.json({
      success: true,
      category,
      filtersCount: filters.length,
      filters
    });
  } catch (error) {
    console.error('Error checking filters:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
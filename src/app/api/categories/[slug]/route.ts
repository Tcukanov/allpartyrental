import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { slug } = unwrappedParams;
    
    console.log(`Fetching category with slug: ${slug}`);
    
    // Try to find by id first
    let category = null;
    if (slug.match(/^[0-9a-fA-F]{24}$/) || slug.match(/^[0-9a-fA-F]{12}$/)) {
      category = await prisma.serviceCategory.findUnique({
        where: { id: slug },
        include: {
          filters: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }
    
    // If not found by id, try to find by slug
    if (!category) {
      category = await prisma.serviceCategory.findFirst({
        where: { slug: slug.toLowerCase() },
        include: {
          filters: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }

    if (!category) {
      console.error(`Category not found for slug: ${slug}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    console.log(`Category found: ${category.name} (${category.id})`);
    return NextResponse.json({
      success: true,
      data: category
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch category',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
} 
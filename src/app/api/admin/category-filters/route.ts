import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    // If categoryId is provided, get filters for that category
    let filters;
    if (categoryId) {
      filters = await prisma.$queryRaw`
        SELECT * FROM "CategoryFilter"
        WHERE "categoryId" = ${categoryId}
        ORDER BY "createdAt" ASC
      `;
    } else {
      // Otherwise, get all filters with category information
      filters = await prisma.$queryRaw`
        SELECT cf.*, 
          json_build_object(
            'id', sc.id,
            'name', sc.name,
            'slug', sc.slug
          ) as category
        FROM "CategoryFilter" cf
        JOIN "ServiceCategory" sc ON cf."categoryId" = sc.id
        ORDER BY cf."createdAt" ASC
      `;
    }

    return NextResponse.json({ success: true, data: filters });
  } catch (error: any) {
    console.error('Error fetching category filters:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch category filters' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, name, type, options, isRequired = false, isTextOnly = false, iconUrl = null } = body;

    // Validate request
    if (!categoryId || !name || !type) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Ensure options is an array
    const sanitizedOptions = Array.isArray(options) ? options : [];

    // Check if category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { message: 'Category not found' } },
        { status: 404 }
      );
    }

    // Check for duplicate filter name for this category
    const existingFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter"
      WHERE "categoryId" = ${categoryId}
      AND LOWER(name) = LOWER(${name})
    `;
    
    const existingFilter = Array.isArray(existingFilters) && existingFilters.length > 0 
      ? existingFilters[0] 
      : null;

    if (existingFilter) {
      return NextResponse.json(
        { success: false, error: { message: 'A filter with this name already exists for this category' } },
        { status: 400 }
      );
    }

    // Create the filter using Prisma ORM instead of raw query
    const filter = await prisma.categoryFilter.create({
      data: {
        categoryId,
        name,
        type,
        options: sanitizedOptions,
        isRequired,
        iconUrl
      }
    });

    return NextResponse.json({ success: true, data: filter }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category filter:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create category filter' } },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const cityId = searchParams.get('cityId');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') as string) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') as string) : undefined;
    const sort = searchParams.get('sort') || 'price_asc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const exclude = searchParams.get('exclude');
    const skip = (page - 1) * limit;

    // Build the where clause
    const where: any = {
      status: 'ACTIVE'
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (minPrice !== undefined) {
      where.price = {
        ...where.price,
        gte: minPrice,
      };
    }

    if (maxPrice !== undefined) {
      where.price = {
        ...where.price,
        lte: maxPrice,
      };
    }

    // Exclude a specific service (for similar services queries)
    if (exclude) {
      where.id = { not: exclude };
    }

    // Define ordering based on sort parameter
    let orderBy: any = {};
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { price: 'asc' };
    }

    // Fetch services
    const services = await prisma.service.findMany({
      where,
      include: {
        city: true,
        category: true,
        provider: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit,
    });

    // Count total matching services
    const total = await prisma.service.count({ where });

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Failed to fetch services',
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
} 
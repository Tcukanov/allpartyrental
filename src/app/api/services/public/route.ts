import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const cityId = searchParams.get('cityId');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const color = searchParams.get('color');
    const sort = searchParams.get('sort');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {
      status: 'ACTIVE', // Only return active services
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (cityId) {
      where.cityId = cityId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by color if provided
    if (color) {
      where.colors = {
        has: color
      };
    }

    // Initialize price filter if needed
    if (minPrice || maxPrice) {
      where.price = {};
      
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Determine sorting order
    let orderBy: any = { createdAt: 'desc' };
    
    if (sort) {
      if (sort === 'price_asc') {
        orderBy = { price: 'asc' };
      } else if (sort === 'price_desc') {
        orderBy = { price: 'desc' };
      }
    }

    // Get services with pagination
    const services = await prisma.service.findMany({
      where,
      include: {
        category: true,
        city: true,
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profile: true
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Get total count for pagination
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
  } catch (error: any) {
    console.error('Error fetching public services:', error);
    console.error('Query parameters:', request.url);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch services',
        },
      },
      { status: 500 }
    );
  }
} 
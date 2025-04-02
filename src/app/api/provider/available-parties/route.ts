export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const cityId = searchParams.get('cityId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Find provider services to get categories and cities they serve
    const providerServices = await prisma.service.findMany({
      where: {
        providerId: session.user.id,
        status: 'ACTIVE',
      },
      select: {
        categoryId: true,
        cityId: true,
      },
    });

    if (providerServices.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        }
      });
    }

    // Extract unique categories and cities the provider serves
    const providerCategoryIds = Array.from(new Set(providerServices.map(s => s.categoryId)));
    const providerCityIds = Array.from(new Set(providerServices.map(s => s.cityId)));

    // Build the query
    const whereClause: any = {
      status: 'PUBLISHED',
      cityId: cityId ? cityId : { in: providerCityIds },
      partyServices: {
        some: {
          service: {
            category: {
              id: categoryId ? categoryId : { in: providerCategoryIds },
            },
          },
          // No offers from this provider yet
          offers: {
            none: {
              providerId: session.user.id,
            },
          },
        },
      },
      // Future parties only
      date: {
        gte: new Date(),
      },
    };

    // Get the parties
    const parties = await prisma.party.findMany({
      where: whereClause,
      include: {
        city: true,
        client: {
          select: {
            name: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
        partyServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
            offers: {
              where: {
                NOT: {
                  providerId: session.user.id,
                },
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      skip,
      take: limit,
    });

    // Count total matching parties
    const total = await prisma.party.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      data: parties,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get available parties error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
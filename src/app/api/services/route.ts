import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      providerId: session.user.id
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

    // Only include active services
    where.status = 'ACTIVE';

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
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
        city: true,
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
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Extract filterValues and addons from the data
    const { filterValues, addons, ...serviceData } = data;
    
    // Convert empty cityId to null to match existing data pattern
    if (serviceData.cityId === '' || !serviceData.cityId) {
      serviceData.cityId = null;
    }
    
    // Prepare metadata if filterValues exist
    let metadata = null;
    if (filterValues && Object.keys(filterValues).length > 0) {
      metadata = JSON.stringify({ filterValues });
    }
    
    // Prepare addons for nested creation
    const addonData = addons && addons.length > 0 ? {
      addons: {
        create: addons.map((addon: any) => ({
          title: addon.title,
          description: addon.description || null,
          price: parseFloat(addon.price),
          thumbnail: addon.thumbnail || null,
        }))
      }
    } : {};
    
    const service = await prisma.service.create({
      data: {
        ...serviceData,
        metadata, // Store filterValues in metadata as JSON
        providerId: session.user.id,
        ...addonData // Include addons if any
      },
      include: {
        provider: true,
        category: true,
        city: true,
        addons: true,
      }
    });

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}
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

    // Get or create the provider record for this user
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create Provider record for users with PROVIDER role who don't have one
      console.log(`Auto-creating Provider record for user: ${session.user.name} (${session.user.id})`);
      
      provider = await prisma.provider.create({
        data: {
          userId: session.user.id,
          businessName: session.user.name || 'Business Name',
          bio: `Professional services provider`,
          isVerified: false,
          paypalCanReceivePayments: true,  // Enable payments for auto-created providers
          paypalMerchantId: `auto-merchant-${session.user.id}`,  // Temporary merchant ID
          paypalEmail: session.user.email || 'temp@example.com',
          paypalOnboardingStatus: 'COMPLETED',  // Set as completed for development
          paypalEnvironment: 'sandbox'
        }
      });
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
      providerId: provider.id  // Use Provider ID, not User ID
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
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

    // Get or create provider record for this user with explicit transaction handling
    let provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      // Auto-create Provider record for users with PROVIDER role who don't have one
      console.log(`Auto-creating Provider record for user: ${session.user.name} (${session.user.id})`);
      
      try {
        provider = await prisma.provider.create({
          data: {
            userId: session.user.id,
            businessName: session.user.name || 'Business Name',
            bio: `Professional services provider`,
            isVerified: false,
            paypalCanReceivePayments: true,  // Enable payments for auto-created providers
            paypalMerchantId: `auto-merchant-${session.user.id}`,  // Temporary merchant ID
            paypalEmail: session.user.email || 'temp@example.com',
            paypalOnboardingStatus: 'COMPLETED',  // Set as completed for development
            paypalEnvironment: 'sandbox'
          }
        });
        console.log(`Successfully created Provider record: ${provider.id} for user: ${session.user.id}`);
      } catch (providerError) {
        console.error('Failed to create Provider record:', providerError);
        return NextResponse.json(
          { error: 'Failed to create provider account' },
          { status: 500 }
        );
      }
    } else {
      console.log(`Using existing Provider record: ${provider.id} for user: ${session.user.id}`);
    }

    // Verify provider was created/exists
    if (!provider || !provider.id) {
      console.error('Provider record is null or missing ID after creation attempt');
      return NextResponse.json(
        { error: 'Provider account creation failed' },
        { status: 500 }
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
    
    console.log(`Creating service with providerId: ${provider.id} for user: ${session.user.id}`);
    
    const service = await prisma.service.create({
      data: {
        ...serviceData,
        metadata, // Store filterValues in metadata as JSON
        providerId: provider.id,  // Use Provider ID, not User ID
        ...addonData // Include addons if any
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        category: true,
        city: true,
        addons: true,
      }
    });

    console.log(`Successfully created service: ${service.id} for provider: ${provider.id}`);

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    
    // Log more detailed error information
    if (error.code === 'P2003') {
      console.error('Foreign key constraint violation details:', error.meta);
      
      if (error.meta?.field_name === 'Service_providerId_fkey (index)') {
        return NextResponse.json({
          error: 'Provider account setup incomplete. Unable to create service because provider record is missing or invalid.',
          code: 'PROVIDER_SETUP_INCOMPLETE',
          details: {
            field: error.meta.field_name,
            suggestion: 'Please ensure you have completed your provider profile setup and try again.'
          }
        }, { status: 400 });
      }
      
      return NextResponse.json({
        error: 'Invalid reference data. One or more required fields reference data that doesn\'t exist.',
        code: 'FOREIGN_KEY_CONSTRAINT',
        details: {
          field: error.meta?.field_name,
          model: error.meta?.modelName
        }
      }, { status: 400 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'Duplicate service data detected. A service with similar information already exists.',
        code: 'DUPLICATE_SERVICE',
        details: {
          field: error.meta?.target,
          suggestion: 'Please check if a similar service already exists or modify the service details.'
        }
      }, { status: 409 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({
        error: 'Required data not found. Category, city, or provider information may be missing.',
        code: 'REQUIRED_DATA_NOT_FOUND',
        details: error.message
      }, { status: 404 });
    }
    
    return NextResponse.json({
      error: error.message || 'Failed to create service',
      code: 'SERVICE_CREATION_FAILED',
      details: {
        errorType: error.constructor.name,
        prismaErrorCode: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}
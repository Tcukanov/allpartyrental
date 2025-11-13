import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Get popular services sorted by view count
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // Fetch only ACTIVE (approved) services from providers who:
    // 1. Have ACTIVE service status (admin approved)
    // 2. Are connected to PayPal (have merchantId)
    // 3. Can receive payments (paypalCanReceivePayments = true)
    const services = await prisma.service.findMany({
      where: {
        status: 'ACTIVE', // Only show approved, active listings
        provider: {
          paypalMerchantId: {
            not: null, // Provider must be connected to PayPal
          },
          paypalCanReceivePayments: true, // Provider must be able to receive payments
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            paypalMerchantId: true,
            paypalCanReceivePayments: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        {
          viewCount: 'desc',
        },
        {
          createdAt: 'desc', // Secondary sort by newest if view counts are equal
        },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching popular services:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch popular services',
        },
      },
      { status: 500 }
    );
  }
}


export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { ServiceStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Get all services that need approval
    const pendingServices = await prisma.service.findMany({
      where: {
        status: 'PENDING_APPROVAL' as ServiceStatus,
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            isVerified: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
        },
        category: true,
        city: true,
      },
      orderBy: {
        createdAt: 'asc', // Oldest first
      },
    });

    return NextResponse.json({ success: true, data: pendingServices }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending services:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
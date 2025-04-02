import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ServiceStatus, NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if service exists and is pending approval
    const service = await prisma.service.findUnique({
      where: {
        id,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    if (service.status !== 'PENDING_APPROVAL' as ServiceStatus) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Service is not pending approval' } },
        { status: 400 }
      );
    }

    // Approve service
    const updatedService = await prisma.service.update({
      where: {
        id,
      },
      data: {
        status: ServiceStatus.ACTIVE,
      },
    });

    // Create notification for the provider
    await prisma.notification.create({
      data: {
        userId: service.providerId,
        type: NotificationType.SYSTEM,
        title: 'Service Approved',
        content: `Your service "${service.name}" has been approved and is now visible to clients.`,
      },
    });

    return NextResponse.json({ success: true, data: updatedService }, { status: 200 });
  } catch (error) {
    console.error('Error approving service:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
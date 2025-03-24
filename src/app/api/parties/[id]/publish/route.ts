import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
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

    const { id } = params;

    // Get party by ID
    const party = await prisma.party.findUnique({
      where: {
        id,
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to publish this party
    if (session.user.id !== party.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if party has services
    const partyServices = await prisma.partyService.count({
      where: {
        partyId: id,
      },
    });

    if (partyServices === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Party must have at least one service to publish' } },
        { status: 400 }
      );
    }

    // Update party status to PUBLISHED
    const updatedParty = await prisma.party.update({
      where: {
        id,
      },
      data: {
        status: 'PUBLISHED',
      },
    });

    // Find providers in the same city for each service type
    const services = await prisma.partyService.findMany({
      where: {
        partyId: id,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
      },
    });

    // Create notifications for providers
    // This would typically be done with a background job or queue
    // For simplicity, we're doing it synchronously here
    for (const partyService of services) {
      const providers = await prisma.user.findMany({
        where: {
          role: 'PROVIDER',
          services: {
            some: {
              categoryId: partyService.service.categoryId,
              cityId: party.cityId,
            },
          },
        },
      });

      for (const provider of providers) {
        await prisma.notification.create({
          data: {
            userId: provider.id,
            type: 'NEW_OFFER',
            title: 'New Party Request',
            content: `A new party request has been published that matches your services: ${party.name}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedParty }, { status: 200 });
  } catch (error) {
    console.error('Publish party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

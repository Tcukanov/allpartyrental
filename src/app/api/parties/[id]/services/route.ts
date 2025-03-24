import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function POST(
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

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Client access required' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { serviceId, specificOptions } = body;

    // Validate input
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

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

    // Check if user is authorized to update this party
    if (session.user.id !== party.clientId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Create party service
    const partyService = await prisma.partyService.create({
      data: {
        partyId: id,
        serviceId,
        specificOptions,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: partyService }, { status: 201 });
  } catch (error) {
    console.error('Add service to party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

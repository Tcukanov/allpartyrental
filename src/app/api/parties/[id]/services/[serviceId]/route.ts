import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, serviceId: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id, serviceId } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get party service
    const partyService = await prisma.partyService.findFirst({
      where: {
        partyId: id,
        serviceId,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        offers: {
          include: {
            provider: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile: {
                      select: {
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!partyService) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party service not found' } },
        { status: 404 }
      );
    }

    // Get party to check authorization
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

    // Check if user is authorized to view this party service
    const isClient = session.user.id === party.clientId;
    const isProvider = session.user.role === 'PROVIDER' && party.status === 'PUBLISHED';
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: partyService }, { status: 200 });
  } catch (error) {
    console.error('Get party service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, serviceId: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id, serviceId } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { specificOptions } = body;

    // Get party service
    const partyService = await prisma.partyService.findFirst({
      where: {
        partyId: id,
        serviceId,
      },
    });

    if (!partyService) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party service not found' } },
        { status: 404 }
      );
    }

    // Get party to check authorization
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

    // Check if user is authorized to update this party service
    if (session.user.id !== party.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Update party service
    const updatedPartyService = await prisma.partyService.update({
      where: {
        id: partyService.id,
      },
      data: {
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

    return NextResponse.json({ success: true, data: updatedPartyService }, { status: 200 });
  } catch (error) {
    console.error('Update party service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, serviceId: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id, serviceId } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get party service
    const partyService = await prisma.partyService.findFirst({
      where: {
        partyId: id,
        serviceId,
      },
    });

    if (!partyService) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party service not found' } },
        { status: 404 }
      );
    }

    // Get party to check authorization
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

    // Check if user is authorized to delete this party service
    if (session.user.id !== party.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Delete party service
    await prisma.partyService.delete({
      where: {
        id: partyService.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Party service deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete party service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

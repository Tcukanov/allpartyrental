import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

// GET a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
        category: true,
        city: true,
        addons: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch service',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// PATCH to update a service
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Update the service
    const updatedService = await prisma.service.update({
      where: { id },
      data: body,
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
    });

    return NextResponse.json({ success: true, data: updatedService });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to update service',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// DELETE a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        partyServices: {
          select: { id: true },
        },
        offers: {
          select: { id: true },
        },
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Get counts for associated records
    const partyServiceCount = existingService.partyServices.length;
    const offersCount = existingService.offers.length;

    // Check if service has associated party services or offers
    if (partyServiceCount > 0 || offersCount > 0) {
      const detailsMessage = [
        "This service cannot be deleted because it has associated data:",
        partyServiceCount > 0 ? `- ${partyServiceCount} party service(s)` : null,
        offersCount > 0 ? `- ${offersCount} offer(s)` : null,
        "These associations must be removed first. You can contact database administrator for assistance."
      ].filter(Boolean).join("\n");

      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Cannot delete service with associated party services or offers',
            details: detailsMessage,
            partyServiceCount,
            offersCount
          } 
        },
        { status: 409 }
      );
    }

    // Delete service addons first (cascade is set in schema but doing it explicitly for safety)
    await prisma.serviceAddon.deleteMany({
      where: { serviceId: id },
    });

    // Delete the service
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      data: { message: 'Service deleted successfully' } 
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to delete service',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
} 
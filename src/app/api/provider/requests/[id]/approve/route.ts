import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }

    // Get the request with service data
    const serviceRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            providerId: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } },
        { status: 404 }
      );
    }

    // Check if the provider owns the service
    if (serviceRequest.service.providerId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only manage requests for your own services' } },
        { status: 403 }
      );
    }

    // Check if the request is in PENDING status
    if (serviceRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Only pending requests can be approved' } },
        { status: 400 }
      );
    }

    // Update the request status to APPROVED
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status: 'APPROVED',
      }
    });

    // Create a notification for the client
    await prisma.notification.create({
      data: {
        userId: serviceRequest.clientId,
        title: 'Service Request Approved',
        content: `Your request for the service "${serviceRequest.service.name}" has been approved.`,
        type: 'REQUEST_APPROVED',
        isRead: false,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRequest
    }, { status: 200 });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
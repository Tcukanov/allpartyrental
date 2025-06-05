import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { NotificationType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { providerId, serviceId, message } = data;
    
    if (!providerId || !serviceId) {
      return NextResponse.json(
        { success: false, error: { message: 'Provider ID and Service ID are required' } },
        { status: 400 }
      );
    }

    // Check if the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true, providerId: true }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: { message: 'Service not found' } },
        { status: 404 }
      );
    }

    // Verify the service belongs to the provider
    if (service.providerId !== providerId) {
      return NextResponse.json(
        { success: false, error: { message: 'This service does not belong to the specified provider' } },
        { status: 400 }
      );
    }

    // Check if the provider exists and has a valid Provider record
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      include: { provider: true }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: { message: 'Provider not found' } },
        { status: 404 }
      );
    }

    if (!provider.provider) {
      console.log(`Provider ${providerId} does not have a provider record, creating one`);
      
      // Create a new provider record
      await prisma.provider.create({
        data: {
          userId: providerId,
          businessName: provider.name || 'Business Name',
          isVerified: false
        }
      });
    }

    // Create a notification for the provider
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: NotificationType.SYSTEM,
        title: 'New Service Inquiry',
        content: `Client ${session.user.name || 'A client'} is interested in your service: ${service.name}`,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Service request sent to provider'
    });
  } catch (error) {
    console.error('Error sending service request:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to send service request' } },
      { status: 500 }
    );
  }
} 
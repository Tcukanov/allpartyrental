import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { NotificationType } from '@prisma/client';
import { getSocketServer } from '@/lib/socket/socket';

// Create a new service request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Authentication required' } 
      }, { status: 401 });
    }
    
    const { serviceId, message, requestDate, bookingAddress } = await req.json();
    console.log('Service request received:', { serviceId, message, requestDate });
    
    if (!serviceId) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Service ID is required' } 
      }, { status: 400 });
    }
    
    // Get the service to find the provider
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { 
        id: true,
        name: true,
        providerId: true,
        cityId: true,
        price: true
      }
    });
    
    if (!service) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Service not found' } 
      }, { status: 404 });
    }
    
    console.log('Service found:', service);
    
    // Create the service request in the party table
    const party = await prisma.party.create({
      data: {
        name: `Request for ${service.name}`,
        clientId: session.user.id,
        cityId: service.cityId, // Use the service's city
        date: requestDate ? new Date(requestDate) : new Date(),
        startTime: '12:00',
        duration: 4,
        guestCount: 1,
        status: 'DRAFT',
        partyServices: {
          create: {
            serviceId: service.id,
            specificOptions: {
              address: bookingAddress || '', // Store the address from the request
              comments: message || `Request for ${service.name}`
            }
          }
        }
      },
      include: {
        partyServices: true
      }
    });
    
    // We need the partyServiceId for the offer
    const partyServiceId = party.partyServices[0].id;
    
    // Create an offer first, since Chat requires an offer
    const offer = await prisma.offer.create({
      data: {
        providerId: service.providerId,
        clientId: session.user.id,
        serviceId: service.id,
        partyServiceId: partyServiceId,
        price: service.price,
        description: `Initial offer for ${service.name}`,
        photos: [],
        status: 'PENDING'
      }
    });
    
    // Now create a chat linked to the offer
    const chat = await prisma.chat.create({
      data: {
        offerId: offer.id
      },
      include: {
        offer: {
          include: {
            client: true,
            provider: true
          }
        }
      }
    });
    
    // Add a message to the chat
    await prisma.message.create({
      data: {
        chatId: chat.id,
        senderId: session.user.id,
        receiverId: service.providerId,
        content: message || `I'm interested in booking ${service.name}. Can we discuss details?`
      }
    });
    
    // Create notification for the message
    const messageNotification = await prisma.notification.create({
      data: {
        userId: service.providerId,
        type: NotificationType.MESSAGE,
        title: 'New Message',
        content: `You have a new message regarding ${service.name}. Click to view chat ID: ${chat.id}`,
        isRead: false
      }
    });
    
    // Create a separate notification for the service request
    const requestNotification = await prisma.notification.create({
      data: {
        userId: service.providerId,
        type: NotificationType.SYSTEM,
        title: 'New Service Request',
        content: `You have a new service request for ${service.name}. Please review and respond.`,
        isRead: false,
      }
    });
    
    // Emit notifications via socket.io for real-time updates
    try {
      const io = getSocketServer();
      if (io) {
        // Emit to the provider's specific room
        io.to(`user:${service.providerId}`).emit('notification:new', messageNotification);
        io.to(`user:${service.providerId}`).emit('notification:new', requestNotification);
        console.log('Service request notifications emitted via socket.io');
      }
    } catch (socketError) {
      console.error('Failed to emit socket notifications:', socketError);
      // Continue with the API response even if socket emission fails
    }
    
    const responseData = { 
      success: true, 
      data: { 
        party, 
        chat: {
          id: chat.id,
          offerId: chat.offerId,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        }, 
        offer 
      }
    };
    
    console.log('Service request response:', JSON.stringify(responseData));
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Create service request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: error.message || 'Failed to create service request' } 
    }, { status: 500 });
  }
}

// Get service requests for a provider
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Authentication required' } 
      }, { status: 401 });
    }
    
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Only providers can view service requests' } 
      }, { status: 403 });
    }
    
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    
    // Get all parties that include the provider's services
    const parties = await prisma.party.findMany({
      where: { 
        partyServices: {
          some: {
            service: {
              providerId: session.user.id
            }
          }
        },
        ...(status && { status: status as any })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true
          }
        },
        partyServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                photos: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: parties 
    });
    
  } catch (error: any) {
    console.error('Get service requests error:', error);
    return NextResponse.json({ 
      success: false, 
      error: { message: error.message || 'Failed to fetch service requests' } 
    }, { status: 500 });
  }
} 
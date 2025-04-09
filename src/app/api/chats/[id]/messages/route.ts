import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { content, receiverId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: { message: 'Message content is required' } },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: id
      },
      include: {
        offer: true
      }
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: { message: 'Chat not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to send messages in this chat
    if (chat.offer.clientId !== session.user.id && chat.offer.providerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { message: 'You are not a participant in this chat' } },
        { status: 403 }
      );
    }

    // Determine the receiver ID based on the sender's role
    let actualReceiverId = receiverId;
    if (!receiverId) {
      actualReceiverId = session.user.id === chat.offer.clientId
        ? chat.offer.providerId
        : chat.offer.clientId;
    }

    const message = await prisma.message.create({
      data: {
        content,
        chatId: id,
        senderId: session.user.id,
        receiverId: actualReceiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: {
        id: id
      },
      data: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: message 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to send message' } },
      { status: 500 }
    );
  }
}

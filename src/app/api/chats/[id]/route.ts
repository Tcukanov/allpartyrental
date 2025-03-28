import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: params.id,
        offer: {
          OR: [
            { partyService: { party: { clientId: session.user.id } } },
            { providerId: session.user.id }
          ]
        }
      },
      include: {
        offer: {
          include: {
            partyService: {
              include: {
                party: {
                  include: {
                    client: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        profile: true
                      }
                    }
                  }
                }
              }
            },
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: true
              }
            },
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: true
              }
            }
          }
        },
        messages: {
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
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: { message: 'Chat not found' } },
        { status: 404 }
      );
    }

    // Format the response to match what the chat page component expects
    const formattedChat = {
      id: chat.id,
      clientId: chat.offer.clientId,
      providerId: chat.offer.providerId,
      client: chat.offer.client,
      provider: chat.offer.provider,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    };

    return NextResponse.json({ 
      success: true, 
      data: formattedChat
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to load chat' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: {
        id: params.id
      },
      include: {
        offer: true
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to send messages in this chat
    if (chat.offer.clientId !== session.user.id && chat.offer.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Determine the receiver ID based on the sender's role
    const receiverId = session.user.id === chat.offer.clientId
      ? chat.offer.providerId
      : chat.offer.clientId;

    const message = await prisma.message.create({
      data: {
        content,
        chatId: params.id,
        senderId: session.user.id,
        receiverId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatar: true
              }
            }
          }
        }
      }
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: {
        id: params.id
      },
      data: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

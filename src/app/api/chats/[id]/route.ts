import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
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

    const chat = await prisma.chat.findUnique({
      where: {
        id: params.id
      },
      include: {
        offer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    avatar: true
                  }
                }
              }
            },
            provider: {
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
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this chat
    if (chat.offer.clientId !== session.user.id && chat.offer.providerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chats = await prisma.chat.findMany({
      where: {
        offer: {
          OR: [
            { clientId: session.user.id },
            { providerId: session.user.id }
          ]
        }
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
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Check if chat already exists
    const existingChat = await prisma.chat.findUnique({
      where: {
        offerId
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
        }
      }
    });

    if (existingChat) {
      return NextResponse.json({ chat: existingChat });
    }

    // Create new chat
    const chat = await prisma.chat.create({
      data: {
        offerId
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
        }
      }
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}

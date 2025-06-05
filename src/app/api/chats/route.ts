import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`Fetching chats for user ID: ${session.user.id}, role: ${session.user.role}`);

    // First check if user has any offers as provider
    if (session.user.role === 'PROVIDER') {
      const providerOffers = await prisma.offer.findMany({
        where: {
          providerId: session.user.id
        },
        select: {
          id: true
        }
      });

      console.log(`Provider has ${providerOffers.length} offers`);
      
      // Log the offer IDs
      if (providerOffers.length > 0) {
        console.log("Offer IDs:", providerOffers.map(o => o.id));
      }
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
                user: {
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
            service: {
              select: {
                id: true,
                name: true
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

    console.log(`Found ${chats.length} chats for user ID: ${session.user.id}`);
    
    // Debug: log each chat's offer details
    if (chats.length > 0) {
      chats.forEach((chat, index) => {
        console.log(`Chat ${index + 1}:`, {
          chatId: chat.id,
          offerId: chat.offerId,
          hasOffer: !!chat.offer,
          clientId: chat.offer?.clientId,
          providerId: chat.offer?.providerId,
          clientName: chat.offer?.client?.name,
          providerName: chat.offer?.provider?.user?.name,
          messagesCount: chat.messages?.length || 0
        });
      });
    }

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
                user: {
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
                user: {
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

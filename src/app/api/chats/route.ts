import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user's chats
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          {
            offer: {
              providerId: session.user.id as string,
            },
          },
          {
            offer: {
              clientId: session.user.id as string,
            },
          },
        ],
      },
      include: {
        offer: {
          include: {
            provider: {
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
            client: {
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
            service: {
              select: {
                id: true,
                name: true,
              },
            },
            partyService: {
              include: {
                party: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: chats }, { status: 200 });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

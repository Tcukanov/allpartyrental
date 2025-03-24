import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get chat by ID
    const chat = await prisma.chat.findUnique({
      where: {
        id,
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
            service: true,
            partyService: {
              include: {
                party: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Chat not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this chat
    const isClient = session.user.id === chat.offer.clientId;
    const isProvider = session.user.id === chat.offer.providerId;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: chat }, { status: 200 });
  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

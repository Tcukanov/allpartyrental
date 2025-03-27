import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Client access required' } },
        { status: 403 }
      );
    }

    // Get parties for the client
    const parties = await prisma.party.findMany({
      where: {
        clientId: session.user.id as string,
      },
      include: {
        city: true,
        partyServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
            offers: {
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: parties }, { status: 200 });
  } catch (error) {
    console.error('Get client parties error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Client access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cityId, name, date, startTime, duration, guestCount } = body;

    // Validate input
    if (!cityId || !name || !date || !startTime || !duration || !guestCount) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Create party
    const party = await prisma.party.create({
      data: {
        clientId: session.user.id as string,
        cityId,
        name,
        date: new Date(date),
        startTime,
        duration,
        guestCount,
      },
    });

    return NextResponse.json({ success: true, data: party }, { status: 201 });
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

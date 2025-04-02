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

    // Determine content type and process accordingly
    const contentType = request.headers.get('content-type') || '';
    
    let partyData: any = {};
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      
      // Extract party data from form
      partyData = {
        cityId: formData.get('cityId'),
        name: formData.get('name'),
        date: formData.get('date'),
        startTime: formData.get('time'),
        duration: parseInt(formData.get('duration') as string) || 2,
        guestCount: parseInt(formData.get('guestCount') as string) || 10,
        description: formData.get('description')
      };
      
      // Handle images if needed
      // const images = formData.getAll('images') as File[];
      // TODO: Process images if needed
      
    } else {
      // Handle JSON data
      partyData = await request.json();
    }
    
    const { cityId, name, date, startTime, duration, guestCount } = partyData;

    // Validate input
    if (!cityId || !name || !date || !startTime) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    console.log('Creating party with data:', partyData);

    // Create party
    const party = await prisma.party.create({
      data: {
        clientId: session.user.id as string,
        cityId,
        name,
        date: new Date(date),
        startTime,
        duration: duration || 2,
        guestCount: guestCount || 10,
        status: 'DRAFT'
      },
    });

    return NextResponse.json({ success: true, data: party }, { status: 201 });
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get party by ID
    const party = await prisma.party.findUnique({
      where: {
        id,
      },
      include: {
        city: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatar: true,
                address: true,
                phone: true,
              },
            },
          },
        },
        partyServices: {
          include: {
            service: {
              include: {
                category: true,
                provider: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                      }
                    }
                  },
                },
              },
            },
            offers: {
              select: {
                id: true,
                providerId: true,
                status: true,
                provider: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                      }
                    }
                  },
                },
              },
            },
          },
        },
        transactions: true,
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this party
    const isClient = session.user.id === party.clientId;
    // Check if user is a provider with either:
    // 1. The party is published OR
    // 2. The provider has made an offer for any service in this party
    const isProvider = session.user.role === 'PROVIDER' && (
      party.status === 'PUBLISHED' || 
      (party as any).partyServices?.some((ps: any) => 
        ps.offers?.some((offer: any) => offer.providerId === session.user.id)
      )
    );
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }
    
    // Add the client's profile address to the top-level client object for easier access
    if ((party as any).client && (party as any).client.profile) {
      console.log('Debug - Client profile in API response:', (party as any).client.profile);
      
      // Try to find address in partyServices.specificOptions if profile address is not available
      let address = (party as any).client.profile.address || (party as any).client.address;
      
      if (!address) {
        // Look for address in partyServices specificOptions
        for (const partyService of (party as any).partyServices || []) {
          if (partyService.specificOptions && typeof partyService.specificOptions === 'object') {
            try {
              const options = partyService.specificOptions as any;
              if (options.address) {
                address = options.address;
                console.log('Found address in specificOptions:', address);
                break;
              }
            } catch (e) {
              console.error('Error parsing specificOptions for address:', e);
            }
          }
        }
      }
      
      const responseData = {
        ...party,
        client: {
          ...(party as any).client,
          // Use type assertion to avoid TypeScript errors
          address: address
        }
      };
      return NextResponse.json({ success: true, data: responseData }, { status: 200 });
    }

    return NextResponse.json({ success: true, data: party }, { status: 200 });
  } catch (error) {
    console.error('Get party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, date, startTime, duration, guestCount, status } = body;

    // Get party by ID
    const party = await prisma.party.findUnique({
      where: {
        id,
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Party not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this party
    if (session.user.id !== party.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Update party
    const updatedParty = await prisma.party.update({
      where: {
        id,
      },
      data: {
        name,
        date: date ? new Date(date) : undefined,
        startTime,
        duration,
        guestCount,
        status,
      },
    });

    return NextResponse.json({ success: true, data: updatedParty }, { status: 200 });
  } catch (error) {
    console.error('Update party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

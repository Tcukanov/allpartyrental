import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Get parties for the authenticated client with optional status filtering
 */
export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userId = session.user.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    // Determine statuses to include based on the status parameter
    let statusFilter = {};
    
    if (statusParam) {
      if (statusParam === 'active') {
        // Active parties: DRAFT, PUBLISHED, IN_PROGRESS
        statusFilter = {
          status: {
            in: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS']
          }
        };
      } else if (statusParam === 'completed') {
        // Completed parties: COMPLETED
        statusFilter = {
          status: 'COMPLETED'
        };
      } else if (statusParam === 'cancelled') {
        // Cancelled parties: CANCELLED
        statusFilter = {
          status: 'CANCELLED'
        };
      } else {
        // Specific status
        statusFilter = {
          status: statusParam
        };
      }
    }

    // Fetch parties
    const parties = await prisma.party.findMany({
      where: { 
        clientId: userId,
        ...statusFilter
      },
      include: {
        city: true,
        partyServices: {
          include: {
            service: true,
            offers: {
              where: {
                status: 'ACCEPTED'
              },
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc',
      },
    });
    
    // Process parties to include additional information
    const processedParties = parties.map(party => {
      const servicesCount = party.partyServices.length;
      const confirmedServices = party.partyServices.filter(ps => 
        ps.offers && ps.offers.some(o => o.status === 'ACCEPTED')
      ).length;
      
      return {
        ...party,
        servicesCount,
        confirmedServices,
        location: party.city?.name || ''
      };
    });

    return NextResponse.json(processedParties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
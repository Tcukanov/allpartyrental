import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Get parties for the authenticated client with optional status filtering
 */
export async function GET(request) {
  try {
    console.log('API request: /api/client/parties');
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log('Unauthorized access attempt to /api/client/parties');
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userId = session.user.id;
    console.log(`Fetching parties for user: ${userId}`);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    console.log(`Status filter: ${statusParam || 'none'}`);
    
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

    console.log('Executing Prisma query with filters:', JSON.stringify(statusFilter));
    
    try {
      // Simplified query to avoid potential relationship issues
      const parties = await prisma.party.findMany({
        where: { 
          clientId: userId,
          ...statusFilter
        },
        include: {
          city: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
      
      console.log(`Found ${parties.length} parties for user ${userId}`);
      
      // Process parties with minimal transformation
      const processedParties = parties.map(party => {
        return {
          ...party,
          servicesCount: 0, // Default value to avoid errors
          confirmedServices: 0, // Default value to avoid errors
          location: party.city?.name || party.cityId || 'Unknown'
        };
      });

      return NextResponse.json({
        success: true,
        data: processedParties
      });
    } catch (prismaError) {
      console.error('Prisma error in parties endpoint:', prismaError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database query error',
          error: prismaError.message,
          code: prismaError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching parties:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
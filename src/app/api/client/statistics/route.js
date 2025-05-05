import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Get statistics for the authenticated client
 */
export async function GET() {
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

    // Get total parties organized
    const totalPartiesCount = await prisma.party.count({
      where: { 
        clientId: userId 
      }
    });
    
    // Get upcoming parties count
    const now = new Date();
    const upcomingPartiesCount = await prisma.party.count({
      where: {
        clientId: userId,
        date: {
          gte: now
        },
        status: {
          in: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS']
        }
      }
    });
    
    // Get total spent from transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        offer: {
          clientId: userId
        },
        status: {
          in: ['COMPLETED', 'ESCROW']
        }
      },
      select: {
        amount: true
      }
    });
    
    const totalSpent = transactions.reduce((sum, tx) => 
      sum + parseFloat(tx.amount.toString()), 0
    );
    
    // Get favorite service category
    const partyServices = await prisma.partyService.findMany({
      where: {
        party: {
          clientId: userId
        }
      },
      include: {
        service: {
          include: {
            category: true
          }
        }
      }
    });
    
    // Count occurrences of each category
    const categoryCount = {};
    partyServices.forEach(ps => {
      if (ps.service?.category?.name) {
        const categoryName = ps.service.category.name;
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      }
    });
    
    // Find category with highest count
    let favoriteCategory = '';
    let maxCount = 0;
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteCategory = category;
      }
    });

    // Compile statistics
    const statistics = {
      totalPartiesOrganized: totalPartiesCount,
      upcomingParties: upcomingPartiesCount,
      totalSpent: totalSpent,
      favoriteServiceCategory: favoriteCategory
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching client statistics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 
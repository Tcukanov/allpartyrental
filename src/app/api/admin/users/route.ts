import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Fetch all users with their provider data and transaction counts
    const users = await prisma.user.findMany({
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            receivedOffers: true,
            clientParties: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.emailVerified ? 'ACTIVE' : 'PENDING',
      createdAt: user.createdAt.toISOString(),
      lastLogin: null, // User model doesn't have lastLogin field
      transactions: user._count.receivedOffers + user._count.clientParties,
      isProvider: !!user.provider,
      providerVerified: user.provider?.isVerified || false,
      businessName: user.provider?.businessName || null
    }));

    return NextResponse.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

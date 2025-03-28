import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get transaction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    const transactionId = params.id;
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Transaction ID is required' } },
        { status: 400 }
      );
    }
    
    // Fetch the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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
                name: true,
                profile: {
                  select: {
                    avatar: true
                  }
                }
              }
            },
            service: true,
            partyService: {
              include: {
                party: true
              }
            }
          }
        },
        party: true
      }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }
    
    // Check authorization - the user must be either the client or the provider
    const isClient = transaction.offer.client.id === session.user.id;
    const isProvider = transaction.offer.provider.id === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    
    if (!isClient && !isProvider && !isAdmin) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You are not authorized to view this transaction' } },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ success: true, data: transaction }, { status: 200 });
  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
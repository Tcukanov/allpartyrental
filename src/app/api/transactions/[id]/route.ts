import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Get a transaction by ID
 * This can be used to check if a transaction exists and see its details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    console.log(`Fetching transaction ${id}`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // Try to get the transaction by ID with comprehensive includes
    const transaction = await prisma.transaction.findUnique({
      where: { id: id },
      include: {
        offer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
              }
            },
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                provider: {
                  select: {
                    paypalEmail: true,
                    paypalMerchantId: true,
                    paypalOnboardingComplete: true,
                    paypalEnvironment: true
                  }
                }
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        party: {
          select: {
            id: true,
            name: true,
            date: true,
            startTime: true,
            duration: true,
            guestCount: true,
            status: true,
            createdAt: true
          }
        },
        dispute: true
      }
    });
    
    if (!transaction) {
      console.log(`Transaction not found: ${id}`);
      return NextResponse.json(
        { success: false, error: { message: 'Transaction not found' } },
        { status: 404 }
      );
    }
    
    // Check permissions - admin can see all, users can only see their own transactions
    const isAdmin = session.user.role === 'ADMIN';
    const isClient = transaction.offer?.clientId === session.user.id;
    const isProvider = transaction.offer?.providerId === session.user.id;
    
    if (!isAdmin && !isClient && !isProvider) {
      return NextResponse.json(
        { success: false, error: { message: 'Access denied' } },
        { status: 403 }
      );
    }
    
    console.log(`Transaction found: ${transaction.id}`);
    return NextResponse.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch transaction' } },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the provider for this user
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Fetch the transaction with full details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: id,
        offer: {
          providerId: provider.id
        }
      },
      include: {
        offer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                photos: true,
                price: true
              }
            },
            provider: {
              select: {
                id: true,
                businessName: true,
                paypalEnvironment: true
              }
            },
            partyService: {
              select: {
                id: true,
                specificOptions: true
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
            guestCount: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
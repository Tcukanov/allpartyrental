import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { params } = context;
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Find the transaction by PayPal order ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        paypalOrderId: orderId
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
                name: true,
                price: true,
                photos: true
              }
            },
            partyService: {
              select: {
                specificOptions: true
              }
            }
          }
        },
        party: {
          select: {
            name: true,
            date: true,
            guestCount: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (transaction.offer.client.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      );
    }


    console.log('======== transaction =========');
    console.log(transaction);
    console.log('=================');

    // Transform data to match expected format
    const specificOptions = transaction.offer.partyService?.specificOptions || {};
    
    const bookingData = {
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      bookingDate: transaction.party?.date || specificOptions.bookingDate || '',
      address: specificOptions.address || '',
      city: specificOptions.city || '',
      zipCode: specificOptions.zipCode || '',
      guestCount: transaction.party?.guestCount || specificOptions.guestCount || 0,
      duration: specificOptions.duration || 4,
      contactPhone: specificOptions.contactPhone || '',
      contactEmail: specificOptions.contactEmail || transaction.offer.client.email || '',
      comments: specificOptions.specialRequests || specificOptions.comments || '',
      service: {
        ...transaction.offer.service,
        photos: transaction.offer.service.photos || []
      },
      user: transaction.offer.client,
      // Pricing breakdown
      pricing: {
        basePrice: parseFloat(transaction.offer.service.price || 0),
        serviceFee: parseFloat(transaction.amount || 0) - parseFloat(transaction.offer.service.price || 0),
        total: parseFloat(transaction.amount || 0)
      }
    };

    return NextResponse.json({
      success: true,
      data: bookingData
    });

  } catch (error) {
    console.error('Error fetching booking by order ID:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

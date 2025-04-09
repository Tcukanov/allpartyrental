import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    // Get provider's advertisements
    const advertisements = await prisma.advertisement.findMany({
      where: {
        userId: session.user.id as string,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: advertisements }, { status: 200 });
  } catch (error) {
    console.error('Get advertisements error:', error);
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

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Provider access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, startDate, endDate } = body;

    // Validate input
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Create advertisement
    const advertisement = await prisma.advertisement.create({
      data: {
        userId: session.user.id as string,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    // In a real application, we would create a payment intent here
    // For now, we'll just return the advertisement
    return NextResponse.json({
      success: true,
      data: {
        advertisement,
        paymentIntent: {
          id: 'mock_payment_intent_id',
          clientSecret: 'mock_client_secret',
          amount: type === 'HOMEPAGE' ? 5000 : 2000, // $50 or $20
          currency: 'usd',
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create advertisement error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

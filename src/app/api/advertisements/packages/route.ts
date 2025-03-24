import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

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

    // Get advertisement packages
    const packages = {
      homepage: {
        durations: [
          { days: 1, price: 10.00 },
          { days: 3, price: 25.00 },
          { days: 5, price: 40.00 },
          { days: 7, price: 50.00 },
          { days: 14, price: 90.00 },
          { days: 30, price: 150.00 },
        ],
      },
      firstWave: {
        subscriptions: [
          { type: 'weekly', price: 20.00 },
          { type: 'monthly', price: 60.00 },
        ],
      },
      combos: [
        { 
          name: 'Starter Bundle', 
          includes: 'Homepage (3 days) + First Wave (weekly)', 
          price: 40.00,
          originalPrice: 45.00
        },
        { 
          name: 'Premium Bundle', 
          includes: 'Homepage (7 days) + First Wave (monthly)', 
          price: 100.00,
          originalPrice: 110.00
        },
        { 
          name: 'Ultimate Bundle', 
          includes: 'Homepage (30 days) + First Wave (monthly)', 
          price: 190.00,
          originalPrice: 210.00
        },
      ],
    };

    return NextResponse.json({ success: true, data: packages }, { status: 200 });
  } catch (error) {
    console.error('Get advertisement packages error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

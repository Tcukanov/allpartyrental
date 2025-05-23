import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

/**
 * Create advertisement transaction for provider
 * POST /api/advertisements/create
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only providers can purchase advertisements
    if (session.user.role !== 'PROVIDER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only providers can purchase advertisement packages' },
        { status: 403 }
      );
    }

    const { packageId, packageName, price, duration, features } = await request.json();

    // Validate input
    if (!packageId || !packageName || !price || !duration) {
      return NextResponse.json(
        { success: false, error: 'packageId, packageName, price, and duration are required' },
        { status: 400 }
      );
    }

    // Create advertisement transaction record
    const advertisement = await prisma.advertisement.create({
      data: {
        providerId: session.user.id,
        packageId: packageId.toString(),
        packageName,
        price: parseFloat(price),
        duration,
        features: features || [],
        status: 'PENDING_PAYMENT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`Advertisement transaction created: ${advertisement.id} for provider: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: advertisement.id,
        packageName: advertisement.packageName,
        price: advertisement.price,
        duration: advertisement.duration,
        status: advertisement.status
      }
    });

  } catch (error) {
    console.error('Error creating advertisement transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
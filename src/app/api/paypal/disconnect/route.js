import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Only providers can disconnect PayPal' }, { status: 403 });
    }

    // Get the provider
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id }
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Disconnect PayPal by clearing all PayPal-related fields
    await prisma.provider.update({
      where: { userId: session.user.id },
      data: {
        paypalMerchantId: null,
        paypalEmail: null,
        paypalOnboardingComplete: false,
        paypalOnboardingId: null,
        paypalTrackingId: null,
        paypalOnboardingStatus: 'NOT_STARTED',
        paypalCanReceivePayments: false,
        paypalStatusIssues: null,
        accountType: null,
        paypalStatus: null
      }
    });

    console.log(`✅ PayPal account disconnected for provider: ${provider.id}`);

    return NextResponse.json({ 
      success: true,
      message: 'PayPal account disconnected successfully'
    });

  } catch (error) {
    console.error('PayPal disconnect error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to disconnect PayPal account'
      },
      { status: 500 }
    );
  }
}


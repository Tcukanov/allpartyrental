import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { enablePayLater } = await request.json();

    if (typeof enablePayLater !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enablePayLater must be a boolean' },
        { status: 400 }
      );
    }

    // Update provider's Pay Later preference
    const provider = await prisma.provider.update({
      where: { userId: session.user.id },
      data: { enablePayLater },
      select: {
        id: true,
        enablePayLater: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error('Error updating Pay Later setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get provider's current Pay Later preference
    const provider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        enablePayLater: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error('Error fetching Pay Later setting:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


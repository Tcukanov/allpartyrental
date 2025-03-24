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

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id as string,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ success: true, data: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, avatar, phone, address, website, socialLinks } = body;

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id as string,
      },
      data: {
        name: name,
        profile: {
          update: {
            avatar,
            phone,
            address,
            website,
            socialLinks,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ success: true, data: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

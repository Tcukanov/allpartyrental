import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type, options, isRequired, isTextOnly = false } = body;

    // Validate request
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Ensure options is an array
    const sanitizedOptions = Array.isArray(options) ? options : [];

    // Check if filter exists
    const existingFilter = await prisma.categoryFilter.findUnique({
      where: { id },
    });

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: { message: 'Filter not found' } },
        { status: 404 }
      );
    }

    // Update the filter
    const updatedFilter = await prisma.categoryFilter.update({
      where: { id },
      data: {
        name,
        type,
        options: sanitizedOptions,
        isRequired: isRequired ?? existingFilter.isRequired,
      },
    });

    return NextResponse.json({ success: true, data: updatedFilter });
  } catch (error: any) {
    console.error('Error updating category filter:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update category filter' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;

    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Check if filter exists
    const existingFilter = await prisma.categoryFilter.findUnique({
      where: { id },
    });

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: { message: 'Filter not found' } },
        { status: 404 }
      );
    }

    // Delete the filter
    await prisma.categoryFilter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Filter deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category filter:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete category filter' } },
      { status: 500 }
    );
  }
} 
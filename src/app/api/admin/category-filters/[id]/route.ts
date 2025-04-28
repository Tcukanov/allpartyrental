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
    const { name, type, options, isRequired, isTextOnly = false, iconUrl } = body;

    // Validate request
    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Ensure options is an array
    const sanitizedOptions = Array.isArray(options) ? options : [];

    // Check if filter exists using raw query
    const existingFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter" WHERE id = ${id}
    `;
    
    const existingFilter = Array.isArray(existingFilters) && existingFilters.length > 0 
      ? existingFilters[0] 
      : null;

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: { message: 'Filter not found' } },
        { status: 404 }
      );
    }

    // Update the filter using raw query
    await prisma.$executeRaw`
      UPDATE "CategoryFilter" 
      SET 
        name = ${name}, 
        type = ${type}, 
        options = ${JSON.stringify(sanitizedOptions)}::jsonb, 
        "isRequired" = ${isRequired ?? existingFilter.isRequired},
        "iconUrl" = ${iconUrl !== undefined ? iconUrl : existingFilter.iconUrl},
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // Fetch the updated record
    const updatedFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter" WHERE id = ${id}
    `;
    
    const updatedFilter = Array.isArray(updatedFilters) && updatedFilters.length > 0 
      ? updatedFilters[0] 
      : null;

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

    // Check if filter exists using raw query
    const existingFilters = await prisma.$queryRaw`
      SELECT * FROM "CategoryFilter" WHERE id = ${id}
    `;
    
    const existingFilter = Array.isArray(existingFilters) && existingFilters.length > 0 
      ? existingFilters[0] 
      : null;

    if (!existingFilter) {
      return NextResponse.json(
        { success: false, error: { message: 'Filter not found' } },
        { status: 404 }
      );
    }

    // Delete the filter using raw query
    await prisma.$executeRaw`
      DELETE FROM "CategoryFilter" WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Filter deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category filter:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to delete category filter' } },
      { status: 500 }
    );
  }
} 
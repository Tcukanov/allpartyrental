import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only authenticated users can access this endpoint
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: { message: 'Category ID is required' } },
        { status: 400 }
      );
    }

    // Check if the category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: { message: 'Category not found' } },
        { status: 404 }
      );
    }

    // Get filters for the specified category
    const filters = await prisma.categoryFilter.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: filters });
  } catch (error: any) {
    console.error('Error fetching category filters:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch category filters' } },
      { status: 500 }
    );
  }
} 
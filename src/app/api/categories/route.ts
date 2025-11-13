import { prisma } from '@/lib/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching categories from database...');
    
    // Check if there are any categories in the database
    const categoryCount = await prisma.serviceCategory.count();
    console.log(`Category count in database: ${categoryCount}`);
    
    // If no categories, add some default ones for testing
    if (categoryCount === 0) {
      console.log('No categories found in database, creating default categories');
      
      const defaultCategories = [
        { name: 'Party Equipment', slug: 'party-equipment', description: 'Tents, tables, chairs, and other party essentials' },
        { name: 'Entertainment', slug: 'entertainment', description: 'DJ services, bands, karaoke, and more' },
        { name: 'Food & Catering', slug: 'food-catering', description: 'Catering services, food trucks, and specialty foods' },
        { name: 'Decoration', slug: 'decoration', description: 'Balloons, banners, and themed decorations' },
        { name: 'Venues', slug: 'venues', description: 'Event spaces, halls, and outdoor venues' },
        { name: 'Photography', slug: 'photography', description: 'Event photography and videography services' },
        { name: 'Bounce Houses', slug: 'bounce-houses', description: 'Inflatable bounce houses and play structures' },
      ];
      
      // Create the default categories
      await Promise.all(
        defaultCategories.map(category => 
          prisma.serviceCategory.create({
            data: category
          })
        )
      );
      
      console.log('Default categories created successfully');
    }
    
    // Get all categories with full logging
    const categories = await prisma.serviceCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log(`Found ${categories.length} categories in database`);
    if (categories.length > 0) {
      console.log('Sample category:', JSON.stringify(categories[0]));
    }

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch categories',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, description } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Name and slug are required' } 
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'A category with this slug already exists' } 
        },
        { status: 400 }
      );
    }

    // Create the category
    const category = await prisma.serviceCategory.create({
      data: {
        name,
        slug,
        description: description || null
      }
    });

    console.log('Category created:', category);

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to create category',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, slug, description } = body;

    // Validate required fields
    if (!id || !name || !slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'ID, name and slug are required' } 
        },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Category not found' } 
        },
        { status: 404 }
      );
    }

    // Check if slug is taken by another category
    if (slug !== existingCategory.slug) {
      const slugTaken = await prisma.serviceCategory.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      });

      if (slugTaken) {
        return NextResponse.json(
          { 
            success: false, 
            error: { message: 'A category with this slug already exists' } 
          },
          { status: 400 }
        );
      }
    }

    // Update the category
    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null
      }
    });

    console.log('Category updated:', category);

    return NextResponse.json(
      { success: true, data: category },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to update category',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'Category ID is required' } 
        },
        { status: 400 }
      );
    }

    // Check if category has services
    const servicesCount = await prisma.service.count({
      where: { categoryId: id }
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: `Cannot delete category with ${servicesCount} associated service(s)` } 
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.serviceCategory.delete({
      where: { id }
    });

    console.log('Category deleted:', id);

    return NextResponse.json(
      { success: true, message: 'Category deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to delete category',
          details: error instanceof Error ? error.message : 'Unknown error' 
        } 
      },
      { status: 500 }
    );
  }
}
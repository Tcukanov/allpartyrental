import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
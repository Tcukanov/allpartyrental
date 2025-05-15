import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

interface RatingsData {
  rating: number;
  reviewCount: number;
  success?: boolean;
}

/**
 * This API fetches Google Business ratings for a URL and optionally updates a provider's profile
 * 
 * GET /api/google/ratings?url=https://g.co/kgs/YS5ahTg
 * POST /api/google/ratings (updates the logged-in provider's profile)
 */

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Extract URL from query params
    const url = new URL(request.url);
    const googleUrl = url.searchParams.get('url');
    
    if (!googleUrl) {
      return NextResponse.json({
        success: false,
        error: { message: 'Google Business URL is required' }
      }, { status: 400 });
    }
    
    // Fetch ratings data from Google
    // NOTE: In a production environment, you would use Google Places API or a proper scraping solution
    // This is a mock implementation for demonstration
    
    // For demo purposes, return mock data
    const mockData: RatingsData = {
      rating: 4.7,
      reviewCount: 14,
      success: true
    };
    
    return NextResponse.json({
      success: true,
      data: mockData
    });
  } catch (error: any) {
    console.error('Error fetching Google Business ratings:', error);
    return NextResponse.json({
      success: false,
      error: { message: error.message || 'Failed to fetch Google Business ratings' }
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'PROVIDER') {
      return NextResponse.json({
        success: false,
        error: { message: 'Unauthorized' }
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { googleBusinessUrl } = body;
    
    if (!googleBusinessUrl) {
      return NextResponse.json({
        success: false,
        error: { message: 'Google Business URL is required' }
      }, { status: 400 });
    }
    
    // In production:
    // 1. Fetch ratings data using Google Places API or a proper scraper
    // 2. Update the provider's profile with the fetched data
    
    // For demo purposes, we'll use mock data
    const mockData: RatingsData = {
      rating: 4.7,
      reviewCount: 14
    };
    
    // Update provider profile with the mock data
    const updatedProfile = await prisma.profile.update({
      where: { 
        userId: session.user.id 
      },
      data: {
        googleBusinessUrl,
        googleBusinessRating: mockData.rating,
        googleBusinessReviews: mockData.reviewCount
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        googleBusinessUrl,
        googleBusinessRating: mockData.rating,
        googleBusinessReviews: mockData.reviewCount
      }
    });
  } catch (error: any) {
    console.error('Error updating Google Business ratings:', error);
    return NextResponse.json({
      success: false,
      error: { message: error.message || 'Failed to update Google Business ratings' }
    }, { status: 500 });
  }
} 
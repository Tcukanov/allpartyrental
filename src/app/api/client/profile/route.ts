import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma/client';

// Helper function to get the user by session or email
async function getUserBySessionOrEmail(session: any) {
  if (!session || !session.user) return null;
  
  // Try to find by ID first if available
  if (session.user.id) {
    const userById = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    if (userById) return userById;
  }
  
  // Fallback to email
  if (session.user.email) {
    return await prisma.user.findUnique({
      where: { email: session.user.email }
    });
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    // Find the real user from the database
    const user = await getUserBySessionOrEmail(session);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "User not found in database. Please log out and log in again." } 
      }, { status: 404 });
    }
    
    const userId = user.id; // Use the real user ID from database
    
    const profile = await prisma.profile.findUnique({
      where: {
        userId: userId
      }
    });
    
    if (!profile) {
      return NextResponse.json({ 
        success: true, 
        data: {
          userId: userId,
          avatar: null,
          phone: null,
          address: null,
          website: null,
          socialLinks: {},
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        message: "Failed to fetch profile",
        details: error instanceof Error ? error.message : 'Unknown error' 
      } 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "CLIENT") {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    // Find the real user from the database
    const user = await getUserBySessionOrEmail(session);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: { message: "User not found in database. Please log out and log in again." } 
      }, { status: 404 });
    }
    
    const userId = user.id; // Use the real user ID from database
    const data = await request.json();
    
    // Validate the data
    const {
      avatar,
      phone,
      address,
      website,
      socialLinks,
    } = data;
    
    // Create or update the profile
    const updatedProfile = await prisma.profile.upsert({
      where: {
        userId: userId
      },
      update: {
        avatar,
        phone,
        address,
        website,
        socialLinks,
      },
      create: {
        userId: userId,
        avatar,
        phone,
        address,
        website,
        socialLinks,
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: updatedProfile
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        message: "Failed to update profile",
        details: error instanceof Error ? error.message : 'Unknown error' 
      } 
    }, { status: 500 });
  }
} 
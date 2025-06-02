import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { User, Profile } from "@prisma/client";

interface ProfileData {
  companyName?: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  googleBusinessUrl?: string | null;
  googleBusinessRating?: string | number | null;
  googleBusinessReviews?: string | number | null;
  description?: string | null;
  contactPerson?: string | null;
  socialLinks?: Record<string, string> | null;
  isProStatus?: boolean;
}

interface NormalizedProfileData {
  avatar: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  googleBusinessUrl: string | null;
  googleBusinessRating?: number | null;
  googleBusinessReviews?: number | null;
  description: string | null;
  contactPerson: string | null;
  socialLinks: Record<string, string>;
  isProStatus: boolean;
}

async function getUserBySessionOrEmail(session: Session | null): Promise<User | null> {
  if (!session || !session.user) return null;
  
  // Try to find user by ID first
  let user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  
  // If not found by ID, try to find by email
  if (!user && session.user.email) {
    user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (user) {
      console.log(`Found user by email instead of ID: ${user.id} (session had ID: ${session.user.id})`);
    }
  }
  
  return user;
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    console.log('Updating provider profile...');
    const session = await getServerSession(authOptions);
    
    console.log('Full session data:', JSON.stringify(session, null, 2));
    
    if (!session || session.user.role !== "PROVIDER") {
      console.log('Unauthorized: Session or provider role missing', session);
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    // Find the real user from the database
    const user = await getUserBySessionOrEmail(session);
    
    if (!user) {
      console.error('User not found in database with ID or email');
      return NextResponse.json({ 
        success: false, 
        error: { message: "User not found in database. Please log out and log in again." } 
      }, { status: 404 });
    }
    
    const userId = user.id; // Use the real user ID from database
    console.log('Using user ID from database:', userId);
    
    console.log('Session user:', session.user);
    const data = await request.json() as ProfileData;
    console.log('Profile data received:', data);
    
    // Check if we need to update the user's name (company name)
    if (data.companyName && data.companyName !== user.name) {
      console.log(`Updating user name from "${user.name}" to "${data.companyName}"`);
      try {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { name: data.companyName }
        });
        console.log('User name updated successfully:', updatedUser.name);
      } catch (nameUpdateError) {
        console.error('Error updating user name:', nameUpdateError);
        // Continue with profile update even if name update fails
      }
    } else {
      console.log('No need to update user name - unchanged or empty');
    }
    
    // Check if profile exists first
    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId: userId
      }
    });
    
    // Normalize all fields to prevent undefined values
    const normalizedData: NormalizedProfileData = {
      avatar: data.avatar || null,
      phone: data.phone || null,
      address: data.address || null,
      website: data.website || null,
      googleBusinessUrl: data.googleBusinessUrl || null,
      description: data.description || null,
      contactPerson: data.contactPerson || null,
      socialLinks: data.socialLinks || {},
      isProStatus: data.isProStatus || false,
    };
    
    // Float values need special handling
    if (data.googleBusinessRating !== undefined) {
      try {
        normalizedData.googleBusinessRating = parseFloat(data.googleBusinessRating as string) || null;
      } catch (e) {
        normalizedData.googleBusinessRating = null;
      }
    }
    
    // Integer values need special handling
    if (data.googleBusinessReviews !== undefined) {
      try {
        normalizedData.googleBusinessReviews = parseInt(data.googleBusinessReviews as string) || null;
      } catch (e) {
        normalizedData.googleBusinessReviews = null;
      }
    }
    
    console.log('Normalized data for update:', normalizedData);
    
    if (!existingProfile) {
      console.log('Profile not found for user, creating new profile');      
      // Create profile if it doesn't exist
      const newProfile = await prisma.profile.create({
        data: {
          userId: userId,
          ...normalizedData
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        data: newProfile
      });
    }
    
    // Handle profile update if it exists
    console.log('Updating existing profile for user', userId);

    const updatedProfile = await prisma.profile.update({
      where: {
        userId: userId
      },
      data: normalizedData
    });
    
    console.log('Profile updated successfully');
    return NextResponse.json({ 
      success: true, 
      data: updatedProfile
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        message: "Failed to update profile",
        details: error.message
      } 
    }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    console.log('Fetching provider profile...');
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('Unauthorized: Session missing', session);
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    // Find the real user from the database
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        provider: true,
        profile: true
      }
    });
    
    if (!user) {
      console.error('User not found in database with ID');
      return NextResponse.json({ 
        success: false, 
        error: { message: "User not found in database. Please log out and log in again." } 
      }, { status: 404 });
    }

    // If user has PROVIDER role but no provider record, create one
    if (user.role === 'PROVIDER' && !user.provider) {
      console.log('Creating provider record for user:', user.id);
      const newProvider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: user.name || 'Business Name',
          bio: '',
          isVerified: false
        }
      });
      
      // Refetch user with the new provider record
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          provider: true,
          profile: true
        }
      });
    }
    
    console.log('Fetching profile for user:', user.id);
    console.log('Profile found:', user.profile);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      provider: user.provider,
      profile: user.profile
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        message: "Failed to fetch profile",
        details: error.message
      } 
    }, { status: 500 });
  }
} 
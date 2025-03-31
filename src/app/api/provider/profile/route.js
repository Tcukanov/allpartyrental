import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Handle profile update
    const updatedProfile = await prisma.profile.update({
      where: {
        userId: session.user.id
      },
      data: {
        avatar: data.avatar,
        phone: data.phone,
        address: data.address,
        website: data.website,
        googleBusinessUrl: data.googleBusinessUrl,
        // Only update these if they're provided
        ...(data.googleBusinessRating !== undefined && { 
          googleBusinessRating: parseFloat(data.googleBusinessRating) 
        }),
        ...(data.googleBusinessReviews !== undefined && { 
          googleBusinessReviews: parseInt(data.googleBusinessReviews) 
        }),
        socialLinks: data.socialLinks || {},
        isProStatus: data.isProStatus || false,
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
      error: { message: "Failed to update profile" } 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json({ 
        success: false, 
        error: { message: "Unauthorized" } 
      }, { status: 401 });
    }
    
    const profile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      data: profile
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ 
      success: false, 
      error: { message: "Failed to fetch profile" } 
    }, { status: 500 });
  }
} 
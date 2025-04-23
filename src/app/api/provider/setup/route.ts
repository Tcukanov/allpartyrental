import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

// POST endpoint to set up a provider record for the authenticated user
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    console.log('POST /api/provider/setup: Session check', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      userRole: session?.user?.role
    });
    
    if (!session?.user?.id) {
      console.log("POST /api/provider/setup: No user session found");
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }
    
    // Verify the user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log(`POST /api/provider/setup: User ${session.user.id} is not a provider, role: ${session.user.role}`);
      return NextResponse.json(
        { success: false, error: { message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }
    
    // Check if provider record already exists
    const existingProvider = await prisma.provider.findUnique({
      where: { userId: session.user.id },
    });
    
    if (existingProvider) {
      console.log(`POST /api/provider/setup: Provider record already exists for user ${session.user.id}`);
      return NextResponse.json({
        success: true,
        message: 'Provider record already exists',
        data: {
          providerId: existingProvider.id,
          existingRecord: true
        }
      });
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      console.log(`POST /api/provider/setup: User record not found for ID ${session.user.id}`);
      return NextResponse.json(
        { success: false, error: { message: 'User record not found' } },
        { status: 404 }
      );
    }
    
    // Create a provider record
    const newProvider = await prisma.provider.create({
      data: {
        userId: session.user.id,
        businessName: user.name || 'My Business',
        businessEmail: user.email,
        commissionRate: 10.0, // Default commission rate
        isApproved: true, // Auto-approve for development
      },
    });
    
    console.log(`POST /api/provider/setup: Created provider record with ID: ${newProvider.id}`);
    
    // Create a notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'SYSTEM',
        title: 'Provider Account Set Up',
        content: 'Your provider account has been set up successfully.',
        isRead: false
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Provider record created successfully',
      data: {
        providerId: newProvider.id
      }
    });
  } catch (error) {
    console.error('POST /api/provider/setup: Error setting up provider:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to set up provider',
          details: error instanceof Error ? error.message : String(error)
        } 
      },
      { status: 500 }
    );
  }
} 
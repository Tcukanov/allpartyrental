import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma/client';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
    });
    
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Not a provider account' },
        { status: 403 }
      );
    }
    
    // Return provider business data if available
    if (user.provider) {
      return NextResponse.json({
        success: true,
        data: {
          businessName: user.provider.businessName,
          businessDescription: user.provider.businessDescription,
          businessAddress: user.provider.businessAddress,
          businessCity: user.provider.businessCity,
          businessState: user.provider.businessState,
          businessZip: user.provider.businessZip,
          businessPhone: user.provider.businessPhone,
          businessEmail: user.provider.businessEmail,
          businessWebsite: user.provider.businessWebsite,
          ein: user.provider.ein,
          businessType: user.provider.businessType,
          foundedYear: user.provider.foundedYear,
          employeeCount: user.provider.employeeCount,
          insuranceProvider: user.provider.insuranceProvider,
          insurancePolicyNum: user.provider.insurancePolicyNum,
          taxIdVerified: user.provider.taxIdVerified,
          bankAccountVerified: user.provider.bankAccountVerified,
          stripeAccountId: user.provider.stripeAccountId,
          isApproved: user.provider.isApproved
        }
      });
    } else {
      // If provider record doesn't exist yet
      return NextResponse.json({
        success: true,
        data: null
      });
    }
  } catch (error) {
    console.error('Error fetching provider business data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provider business data' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { provider: true }
    });
    
    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Not a provider account' },
        { status: 403 }
      );
    }
    
    // Get data from request
    const data = await request.json();
    
    // Fields that should not be updated directly by the provider
    delete data.taxIdVerified;
    delete data.bankAccountVerified;
    delete data.isApproved;
    delete data.stripeAccountId;
    
    // Update or create provider business data
    const updatedProvider = await prisma.provider.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        ...data
      },
      create: {
        userId: session.user.id,
        businessName: data.businessName || user.name + "'s Business",
        ...data
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updatedProvider
    });
  } catch (error) {
    console.error('Error updating provider business data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update provider business data' },
      { status: 500 }
    );
  }
} 
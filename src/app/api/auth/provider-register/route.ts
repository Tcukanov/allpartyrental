import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      companyName, 
      contactPerson, 
      email, 
      password, 
      phone, 
      website, 
      companyDescription, 
      serviceLocation 
    } = body;

    // Validate required fields
    if (!companyName || !contactPerson || !email || !password || !phone || !companyDescription || !serviceLocation) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'All required fields must be filled' } 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { message: 'An account with this email already exists' } 
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with PROVIDER role but not verified yet
    const user = await prisma.user.create({
      data: {
        name: contactPerson,
        email,
        password: hashedPassword,
        role: 'PROVIDER',
        emailVerified: null, // Will be verified by admin approval
      }
    });

    // Create provider profile with all company information
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        businessName: companyName,
        bio: companyDescription,
        phone: phone,
        website: website || null,
        isVerified: false, // Requires admin approval
        paypalCanReceivePayments: false,
        paypalOnboardingStatus: 'NOT_STARTED',
        paypalEnvironment: 'sandbox',
      }
    });

    // Link provider to service location (city)
    await prisma.providerCity.create({
      data: {
        providerId: provider.id,
        cityId: serviceLocation
      }
    });

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    if (admins.length > 0) {
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'SYSTEM',
              title: 'New Provider Application',
              content: `${companyName} (${contactPerson}) has applied to become a service provider. Please review their application.`,
              isRead: false,
            },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Provider application submitted successfully',
      data: {
        userId: user.id,
        email: user.email,
        companyName: companyName
      }
    });

  } catch (error) {
    console.error('Provider registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'Failed to process registration. Please try again.' } 
      },
      { status: 500 }
    );
  }
}


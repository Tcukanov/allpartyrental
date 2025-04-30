import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { prisma } from '@/lib/prisma/client';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { sendMail, generateVerificationEmailHtml } from '@/lib/mail/send-mail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email already in use' } },
        { status: 400 }
      );
    }

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid role' } },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExp = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        verificationToken,
        verificationTokenExp,
        profile: {
          create: {
            // Create empty profile
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
    
    const emailHtml = generateVerificationEmailHtml(name, verificationLink);
    const emailSent = await sendMail({
      to: email,
      subject: 'Verify Your Email - Party Vendors',
      html: emailHtml
    });

    if (!emailSent) {
      console.error(`Failed to send verification email to ${email}`);
    }

    // Return response
    return NextResponse.json({ 
      success: true, 
      data: user,
      verification: process.env.NODE_ENV === 'development' 
        ? { link: verificationLink } 
        : undefined 
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

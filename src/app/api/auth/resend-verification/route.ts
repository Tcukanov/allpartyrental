import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { randomBytes } from 'crypto';
import { sendMail, generateVerificationEmailHtml } from '@/lib/mail/send-mail';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        emailVerified: true
      }
    });

    // If user doesn't exist or is already verified, we still return success 
    // to avoid leaking information about registered users
    if (!user || user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'If this email exists and requires verification, a verification link has been sent.'
      });
    }

    // Generate a new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExp = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Update user with new verification token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExp
      }
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
    
    const emailHtml = generateVerificationEmailHtml(user.name || 'User', verificationLink);
    const emailSent = await sendMail({
      to: email,
      subject: 'Verify Your Email - Party Vendors',
      html: emailHtml
    });

    if (!emailSent) {
      console.error(`Failed to send verification email to ${email}`);
      
      // In development, provide a direct verification link for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Verification email could not be sent. In development mode, you can use the direct link below:',
          verificationLink,
          token: verificationToken
        });
      }
      
      return NextResponse.json(
        { success: false, error: { message: 'Failed to send verification email' } },
        { status: 500 }
      );
    }

    // For development, always include the verification link
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully. In development mode, you can also use the direct link:',
        verificationLink,
        token: verificationToken
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'An error occurred while processing your request' } 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { randomBytes } from 'crypto';
import { sendMail, generatePasswordResetEmailHtml } from '@/lib/mail/send-mail';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Generate a secure token
    const token = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update user with verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: token,
          verificationTokenExp: tokenExpiry,
        },
      });

      // Construct reset password link
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const resetPasswordLink = `${baseUrl}/auth/reset-password?token=${token}`;

      // Generate and send password reset email
      const emailHtml = generatePasswordResetEmailHtml(user.name || 'User', resetPasswordLink);
      const emailSent = await sendMail({
        to: email,
        subject: 'Reset Your Password - Party Vendors',
        html: emailHtml,
      });

      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
      }

      console.log(`Password reset link for ${email}: ${resetPasswordLink}`);
      
      // For development, return the link directly in the response
      // In production, this should only log to the server and not expose the token in the response
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
          // Only included for development:
          debug: {
            resetLink: resetPasswordLink,
            token
          }
        });
      }
    }

    // Always return success even if the email doesn't exist
    // This prevents email enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { message: 'An error occurred while processing your request' } 
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameters
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: { message: 'Verification token is missing' } 
      }, 
      { status: 400 });
    }

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExp: {
          gt: new Date() // token is not expired
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        verificationToken: true,
        verificationTokenExp: true,
        emailVerified: true
      }
    });

    if (!user) {
      // In development, try to find any user with this token regardless of expiry
      // to help with debugging
      if (process.env.NODE_ENV === 'development') {
        const debugUser = await prisma.user.findFirst({
          where: { verificationToken: token },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            verificationTokenExp: true
          }
        });

        if (debugUser) {
          if (debugUser.emailVerified) {
            return NextResponse.json({ 
              success: false, 
              error: { 
                message: 'Email already verified',
                debugInfo: {
                  emailVerified: debugUser.emailVerified,
                  email: debugUser.email
                }
              } 
            }, 
            { status: 400 });
          }

          if (debugUser.verificationTokenExp && debugUser.verificationTokenExp < new Date()) {
            return NextResponse.json({ 
              success: false, 
              error: { 
                message: 'Verification token expired',
                debugInfo: {
                  tokenExpiry: debugUser.verificationTokenExp,
                  currentTime: new Date(),
                  email: debugUser.email
                }
              } 
            }, 
            { status: 400 });
          }
        }
      }

      return NextResponse.json({ 
        success: false, 
        error: { message: 'Invalid or expired verification token' } 
      }, 
      { status: 400 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        success: true,
        message: 'Email already verified',
        alreadyVerified: true
      });
    }

    // Update user, marking email as verified and clearing the token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExp: null
      }
    });

    const response = {
      success: true,
      message: 'Email verified successfully'
    };

    // Add extra debug info in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        ...response,
        userEmail: user.email,
        verifiedAt: new Date().toISOString()
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error verifying email:', error);
    
    const errorResponse = { 
      success: false, 
      error: { message: 'An error occurred while verifying your email' }
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error instanceof Error) {
      return NextResponse.json({
        ...errorResponse,
        stack: error.stack,
        message: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 
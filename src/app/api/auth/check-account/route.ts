import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        emailVerified: true,
        accounts: {
          select: {
            provider: true
          }
        }
      }
    });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ isGoogleAccount: false, needsVerification: false });
    }
    
    // Check if this is a Google account (has Google provider in accounts AND no password)
    const isGoogleAccount = user.accounts.some(account => account.provider === 'google') && 
      (!user.password || user.password.length === 0);
    
    // Check if email needs verification (has password but no emailVerified timestamp)
    const needsVerification = user.password && !user.emailVerified;
    
    return NextResponse.json({ isGoogleAccount, needsVerification });
  } catch (error) {
    console.error('Error checking account:', error);
    return NextResponse.json({ 
      error: 'An error occurred while checking the account' 
    }, { status: 500 });
  }
} 
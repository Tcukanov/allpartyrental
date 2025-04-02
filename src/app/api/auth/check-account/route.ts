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
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
      }
    });
    
    if (!user) {
      // User doesn't exist
      return NextResponse.json({ 
        exists: false,
        isGoogleAccount: false 
      });
    }
    
    // Check if user has a Google account using raw query
    const accounts = await prisma.$queryRaw`
      SELECT * FROM "Account" 
      WHERE "userId" = ${user.id} AND "provider" = 'google'
      LIMIT 1
    `;
    
    // Check if this is a Google account (has Google provider in accounts AND no password)
    const isGoogleAccount = Array.isArray(accounts) && accounts.length > 0 && 
                           (!user.password || user.password.length === 0);
    
    return NextResponse.json({
      exists: true,
      isGoogleAccount
    });
    
  } catch (error) {
    console.error('Error checking account:', error);
    return NextResponse.json({ 
      error: 'An error occurred while checking the account' 
    }, { status: 500 });
  }
} 
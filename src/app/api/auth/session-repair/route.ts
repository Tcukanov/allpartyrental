export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: { message: 'No active session' }
      }, { status: 401 });
    }
    
    // Log session details for debugging
    console.log('Current session:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    });
    
    // Check if user exists in database
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email as string
      }
    });
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: { message: 'User not found in database' },
        sessionData: {
          id: session.user.id,
          email: session.user.email,
        }
      }, { status: 404 });
    }
    
    // Check if session ID matches database ID
    const sessionMismatch = session.user.id !== user.id;
    
    // Return session status
    return NextResponse.json({
      success: true,
      sessionStatus: {
        valid: !sessionMismatch,
        sessionId: session.user.id,
        databaseId: user.id,
        email: user.email,
        role: user.role,
        needsRepair: sessionMismatch
      }
    });
  } catch (error) {
    console.error('Session repair error:', error);
    return NextResponse.json({
      success: false,
      error: { 
        message: 'Error checking session',
        details: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
} 
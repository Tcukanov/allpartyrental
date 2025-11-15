import { NextResponse } from 'next/server';
import { getPlatformFeePercent } from '@/lib/config/fees';

/**
 * GET /api/config/platform-fee
 * Public endpoint to get current platform fee percentage
 */
export async function GET() {
  try {
    const feePercent = await getPlatformFeePercent();
    
    return NextResponse.json({
      success: true,
      platformFeePercent: feePercent
    });
    
  } catch (error) {
    console.error('Error fetching platform fee:', error);
    
    return NextResponse.json({
      success: true,
      platformFeePercent: 10.0 // Default fallback
    }, { status: 200 }); // Still return 200 with default
  }
}


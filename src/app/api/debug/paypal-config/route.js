import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Debug endpoint to check PayPal configuration
 * GET /api/debug/paypal-config
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow admin users to access this debug endpoint
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = {
      hasClientId: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      clientIdLength: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.length || 0,
      clientIdPreview: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.substring(0, 8) + '...',
      
      paypalMode: process.env.PAYPAL_MODE || 'not set',
      
      hasSandboxSecret: !!process.env.PAYPAL_SANDBOX_CLIENT_SECRET,
      sandboxSecretLength: process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.length || 0,
      
      hasLiveSecret: !!process.env.PAYPAL_LIVE_CLIENT_SECRET,
      liveSecretLength: process.env.PAYPAL_LIVE_CLIENT_SECRET?.length || 0,
      
      hasPartnerId: !!process.env.PAYPAL_PARTNER_ID,
      partnerIdLength: process.env.PAYPAL_PARTNER_ID?.length || 0,
      
      hasAttributionId: !!process.env.PAYPAL_PARTNER_ATTRIBUTION_ID,
      attributionIdLength: process.env.PAYPAL_PARTNER_ATTRIBUTION_ID?.length || 0,
      
      nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
      
      // Environment check
      nodeEnv: process.env.NODE_ENV,
      
      // Recommended configuration
      recommendations: []
    };

    // Add recommendations based on current config
    if (!config.hasClientId) {
      config.recommendations.push('MISSING: NEXT_PUBLIC_PAYPAL_CLIENT_ID is required');
    }

    if (config.paypalMode === 'sandbox' || config.paypalMode === 'not set') {
      if (!config.hasSandboxSecret) {
        config.recommendations.push('MISSING: PAYPAL_SANDBOX_CLIENT_SECRET is required for sandbox mode');
      }
    }

    if (config.paypalMode === 'live' || config.paypalMode === 'production') {
      if (!config.hasLiveSecret) {
        config.recommendations.push('MISSING: PAYPAL_LIVE_CLIENT_SECRET is required for live mode');
      }
    }

    if (config.paypalMode === 'not set') {
      config.recommendations.push('RECOMMENDATION: Set PAYPAL_MODE to "sandbox" or "live"');
    }

    if (!config.hasPartnerId) {
      config.recommendations.push('OPTIONAL: PAYPAL_PARTNER_ID for marketplace features');
    }

    if (!config.hasAttributionId) {
      config.recommendations.push('OPTIONAL: PAYPAL_PARTNER_ATTRIBUTION_ID for partner attribution');
    }

    if (config.nextAuthUrl === 'not set') {
      config.recommendations.push('MISSING: NEXTAUTH_URL is required for return URLs');
    }

    return NextResponse.json({
      success: true,
      config: config,
      status: config.recommendations.length === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
    });

  } catch (error) {
    console.error('Error checking PayPal config:', error);
    return NextResponse.json(
      { error: 'Failed to check PayPal configuration', details: error.message },
      { status: 500 }
    );
  }
} 
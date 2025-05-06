import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { 
  getFeeSettings, 
  updateFeeSettings 
} from '@/lib/payment/fee-settings';

/**
 * Get current fee settings
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access fee settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the current fee settings
    const settings = await getFeeSettings();

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error retrieving fee settings:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to retrieve fee settings: ${error.message}`
    }, { status: 500 });
  }
}

/**
 * Update fee settings
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update fee settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the new fee settings from request body
    const data = await request.json();
    const { clientFeePercent, providerFeePercent } = data;

    if (clientFeePercent === undefined && providerFeePercent === undefined) {
      return NextResponse.json({
        success: false,
        error: 'At least one fee percentage must be provided'
      }, { status: 400 });
    }

    // Update the fee settings
    const result = await updateFeeSettings({
      clientFeePercent,
      providerFeePercent
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to update fee settings'
      }, { status: 400 });
    }

    // Get the updated settings
    const updatedSettings = await getFeeSettings();

    return NextResponse.json({
      success: true,
      message: 'Fee settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating fee settings:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update fee settings: ${error.message}`
    }, { status: 500 });
  }
} 
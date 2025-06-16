import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PayPalClientFixed } from '@/lib/payment/paypal-client';

export async function GET(req) {
  console.log('📋 Webhook management - List webhooks');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to manage webhooks
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const paypalClient = new PayPalClientFixed();
    const webhooks = await paypalClient.listWebhooks();

    return NextResponse.json({
      success: true,
      data: webhooks
    });

  } catch (error) {
    console.error('❌ Error listing webhooks:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to list webhooks'
    }, { status: 500 });
  }
}

export async function POST(req) {
  console.log('🔔 Webhook management - Create webhook');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to manage webhooks
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { webhookUrl } = body;

    if (!webhookUrl) {
      return NextResponse.json({ 
        error: 'webhookUrl is required' 
      }, { status: 400 });
    }

    // Validate webhook URL format
    try {
      new URL(webhookUrl);
    } catch {
      return NextResponse.json({ 
        error: 'Invalid webhook URL format' 
      }, { status: 400 });
    }

    const paypalClient = new PayPalClientFixed();
    const webhook = await paypalClient.createWebhook(webhookUrl);

    return NextResponse.json({
      success: true,
      data: webhook,
      message: 'Webhook created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating webhook:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create webhook'
    }, { status: 500 });
  }
}

export async function DELETE(req) {
  console.log('🗑️ Webhook management - Delete webhook');
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admins to manage webhooks
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ 
        error: 'webhookId is required' 
      }, { status: 400 });
    }

    const paypalClient = new PayPalClientFixed();
    await paypalClient.deleteWebhook(webhookId);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete webhook'
    }, { status: 500 });
  }
} 
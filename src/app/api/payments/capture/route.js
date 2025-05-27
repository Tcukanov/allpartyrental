import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Capture payment after client approval
 * POST /api/payments/capture
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();

    // Validate input
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'orderId is required' },
        { status: 400 }
      );
    }

    console.log(`Capturing payment for order: ${orderId}`);

    // Find transaction by PayPal order ID
    const transaction = await prisma.transaction.findFirst({
      where: { 
        paymentIntentId: orderId
      },
      include: {
        offer: {
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            },
            service: {
              select: {
                name: true,
                providerId: true
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found for this payment order' },
        { status: 404 }
      );
    }

    // Check if user is authorized
    if (transaction.offer.client.id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to capture this payment' },
        { status: 403 }
      );
    }

    // Get PayPal credentials
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
    const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
    const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json({ 
        success: false, 
        error: 'PayPal configuration missing' 
      }, { status: 500 });
    }

    // Get PayPal access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get PayPal token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Capture the PayPal payment
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error('PayPal capture failed:', errorText);
      throw new Error(`Failed to capture PayPal payment: ${captureResponse.status}`);
    }

    const captureResult = await captureResponse.json();
    console.log('PayPal payment captured:', captureResult.id);

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'COMPLETED',
        paymentMethodId: captureResult.id,
        updatedAt: new Date()
      }
    });

    // Create notification for provider
    if (transaction.offer.service.providerId) {
      await prisma.notification.create({
        data: {
          userId: transaction.offer.service.providerId,
          type: 'PAYMENT',
          title: 'New Booking Request - Payment Received',
          content: `You have a new booking request for "${transaction.offer.service.name}" from ${transaction.offer.client.name}. Payment of $${transaction.amount.toFixed(2)} has been received. Please review and confirm the booking.`,
          isRead: false
        }
      });
    }

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.client.id,
        type: 'PAYMENT',
        title: 'Payment Successful',
        content: `Your payment of $${transaction.amount.toFixed(2)} for "${transaction.offer.service.name}" has been processed successfully. The provider will contact you to confirm the booking details.`,
        isRead: false
      }
    });

    console.log(`Payment captured for transaction ${transaction.id}`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: transaction.id,
        captureId: captureResult.id,
        amountReceived: transaction.amount,
        status: captureResult.status,
        message: 'Payment captured successfully. Provider will be notified to review your booking.'
      }
    });

  } catch (error) {
    console.error('Error capturing payment:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 
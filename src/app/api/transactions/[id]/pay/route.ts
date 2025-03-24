// src/app/api/transactions/[id]/pay/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { paymentService } from '@/lib/payment/stripe';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { paymentMethodId } = body;

    // Get transaction by ID
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        offer: {
          include: {
            provider: true,
            client: true,
            service: true,
          },
        },
        party: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to make payment
    if (session.user.id !== transaction.offer.clientId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if transaction is in valid state
    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Transaction cannot be paid' } },
        { status: 400 }
      );
    }

    // Create payment intent
    const amountInCents = Math.round(Number(transaction.amount) * 100);
    const description = `Payment for ${transaction.offer.service.name} service (${transaction.party.name})`;
    
    const paymentIntent = await paymentService.createPaymentIntent({
      offerId: transaction.offer.id,
      clientId: transaction.offer.clientId,
      providerId: transaction.offer.providerId,
      amount: amountInCents,
      description,
    });

    if (!paymentIntent.success) {
      return NextResponse.json(
        { success: false, error: paymentIntent.error },
        { status: 500 }
      );
    }

    // Update transaction with payment intent information
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        paymentIntentId: paymentIntent.data.paymentIntentId,
        paymentMethodId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        clientSecret: paymentIntent.data.clientSecret,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// src/app/api/transactions/[id]/confirm/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { paymentService } from '@/lib/payment/stripe';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get transaction by ID
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        offer: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to confirm service
    if (session.user.id !== transaction.offer.clientId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if transaction is in escrow
    if (transaction.status !== 'ESCROW') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Transaction must be in escrow' } },
        { status: 400 }
      );
    }

    // Schedule the release of funds after 12 hours (in a real production system)
    // For now, we're just updating the status and creating a notification
    
    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.providerId,
        type: 'PAYMENT',
        title: 'Service Confirmed',
        content: `The client has confirmed your service. Payment will be released in 12 hours.`,
      },
    });

    // In a real implementation, we would schedule a job to release funds after 12 hours
    // using a task queue like Bull or a scheduled serverless function
    
    return NextResponse.json({
      success: true,
      data: updatedTransaction,
    }, { status: 200 });
  } catch (error) {
    console.error('Confirm service error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// src/app/api/transactions/[id]/arrived/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get transaction by ID
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        offer: true,
        party: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to mark as arrived
    if (session.user.id !== transaction.offer.providerId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: transaction.offer.clientId,
        type: 'PAYMENT',
        title: 'Provider Has Arrived',
        content: `Your service provider for ${transaction.offer.service?.name || 'your service'} has marked their arrival. Please confirm once the service has been delivered.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client has been notified of your arrival',
    }, { status: 200 });
  } catch (error) {
    console.error('Mark as arrived error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// src/app/api/transactions/[id]/dispute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { reason, description } = body;

    // Get transaction by ID
    const transaction = await prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        offer: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Transaction not found' } },
        { status: 404 }
      );
    }

    // Check if user is authorized to create a dispute
    if (session.user.id !== transaction.offer.clientId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if transaction can be disputed
    if (transaction.status !== 'ESCROW') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Transaction cannot be disputed' } },
        { status: 400 }
      );
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id,
      },
      data: {
        status: 'DISPUTED',
      },
    });

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId: transaction.id,
        reason,
        description,
        isResolved: false,
      },
    });

    // Create notification for provider
    await prisma.notification.create({
      data: {
        userId: transaction.offer.providerId,
        type: 'PAYMENT',
        title: 'Dispute Filed',
        content: `The client has filed a dispute regarding your service. An administrator will review the case.`,
      },
    });

    // Create notification for admin
    // In a real implementation, we would notify all admins or a specific admin
    // This is just a simplified version
    const admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: 'New Dispute',
          content: `A new dispute has been filed for transaction ${transaction.id}. Please review.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: updatedTransaction,
        dispute,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create dispute error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// src/app/api/webhook/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { paymentService } from '@/lib/payment/stripe';

export async function POST(request: NextRequest) {
  try {
    const signature = headers().get('stripe-signature');
    const body = await request.text();
    
    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const webhookResponse = await paymentService.handleWebhookEvent(body, signature);

    if (!webhookResponse.success) {
      return NextResponse.json(
        { success: false, error: webhookResponse.error },
        { status: 400 }
      );
    }

    return NextResponse.json(webhookResponse.data, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
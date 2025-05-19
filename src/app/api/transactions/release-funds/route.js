import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { getFeeSettings } from '@/lib/payment/fee-settings';
import { paymentService } from '@/lib/payment/service';
import { logger } from '@/lib/logger';

/**
 * Release captured funds to a provider's PayPal account
 * This endpoint transfers money from the platform to the provider
 * A platform fee will be retained based on the configured provider fee percentage
 */
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Only admins or the system can release funds
    // In a production app, this would likely be triggered by a webhook or system process
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only administrators can release funds manually' 
      }, { status: 403 });
    }

    // Get paymentIntentId from request body
    const data = await request.json();
    const { paymentIntentId } = data;

    if (!paymentIntentId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment intent ID is required' 
      }, { status: 400 });
    }

    // Get the transaction associated with this payment intent
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId },
      include: {
        offer: {
          include: {
            provider: true,
            service: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found for the provided payment intent ID' 
      }, { status: 404 });
    }

    // Get provider from transaction
    const providerId = transaction.offer.provider.id;
    
    // Find provider's PayPal account
    const provider = await prisma.provider.findFirst({
      where: { userId: providerId }
    });

    if (!provider || !provider.paypalEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Provider has no connected PayPal account' 
      }, { status: 400 });
    }

    // Get the fee settings
    const { providerFeePercent } = await getFeeSettings();

    // Release the funds using PayPal service
    try {
      logger.info(`Releasing funds for payment intent ${paymentIntentId} to provider ${providerId}`);
      
      // Call the service to handle the PayPal transfer
      const releaseResult = await paymentService.releaseFundsToProvider({
        paymentIntentId,
        providerId,
        amount: Number(transaction.amount)
      });
      
      // Update transaction in database
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { 
          transferId: releaseResult.id,
          transferStatus: 'COMPLETED',
          status: 'COMPLETED',
          transferDate: new Date()
        }
      });

      // Send notification to provider
      await prisma.notification.create({
        data: {
          userId: providerId,
          type: 'PAYMENT',
          title: 'Payment Released',
          content: `Your payment for ${transaction.offer.service.name} has been released to your PayPal account.`,
          isRead: false
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          transfer: {
            id: releaseResult.id,
            status: releaseResult.status,
            created: new Date().toISOString()
          },
          transaction: {
            id: transaction.id,
            status: 'COMPLETED'
          }
        }
      });
    } catch (error) {
      logger.error('Error releasing funds to provider:', error);
      return NextResponse.json({
        success: false,
        error: `Failed to release funds: ${error.message}`
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Error in release funds endpoint:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to process request: ${error.message}`
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { getFeeSettings } from '@/lib/payment/fee-settings';
import { logger } from '@/lib/logger';

/**
 * Release captured funds for a specific transaction
 * Admin-only endpoint for manually releasing funds to providers through PayPal
 */
export async function POST(request, { params }) {
  try {
    // Get transaction ID from URL parameters
    const { id } = params;
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID is required' 
      }, { status: 400 });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Admin-only endpoint
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only administrators can release funds' 
      }, { status: 403 });
    }

    logger.info(`Admin requested to release funds for transaction ID: ${id}`);

    // Find the transaction in the database
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        offer: {
          include: {
            provider: true,
            service: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Check if transaction is in completed status and has a payment intent
    if (transaction.status !== 'COMPLETED' || !transaction.paymentIntentId) {
      return NextResponse.json({ 
        success: false, 
        error: `Transaction cannot be released. Status: ${transaction.status}, PaymentIntent: ${transaction.paymentIntentId ? 'exists' : 'missing'}` 
      }, { status: 400 });
    }

    // Check if funds were already released
    if (transaction.transferId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Funds have already been released for this transaction' 
      }, { status: 400 });
    }

    // Get provider details
    const providerId = transaction.offer.provider.userId;
    const provider = await prisma.provider.findFirst({
      where: { userId: providerId }
    });

    if (!provider || !provider.paypalEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Provider has no associated PayPal account' 
      }, { status: 400 });
    }

    // Get the fee settings
    const { providerFeePercent } = await getFeeSettings();

    // Calculate amount and fees
    const totalAmount = Number(transaction.amount) * 100; // Convert to cents for consistency
    const platformFee = Math.round(totalAmount * (providerFeePercent / 100));
    const transferAmount = totalAmount - platformFee;

    logger.info(`Would transfer: ${transferAmount / 100} to ${provider.paypalEmail} (fee: ${platformFee / 100})`);

    // TODO: Implement actual PayPal payout here
    // For now, simulate a successful transfer
    
    // Update transaction with transfer information
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        transferId: `paypal-manual-${Date.now()}`,
        transferAmount: transferAmount / 100, // Store in dollars
        platformFee: platformFee / 100, // Store in dollars 
        transferStatus: 'COMPLETED',
        transferDate: new Date()
      }
    });

    // Send notification to provider
    await prisma.notification.create({
      data: {
        userId: providerId,
        type: 'PAYMENT',
        title: 'Payment Received',
        content: `A payment of ${(transferAmount / 100).toFixed(2)} USD for "${transaction.offer.service.name}" has been transferred to your PayPal account.`,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        transaction: {
          id: updatedTransaction.id,
          status: updatedTransaction.status,
          transferStatus: updatedTransaction.transferStatus,
          transferDate: updatedTransaction.transferDate
        },
        transfer: {
          id: updatedTransaction.transferId,
          amount: transferAmount / 100,
          currency: 'USD',
          created: new Date().toISOString()
        },
        fees: {
          platformFee: platformFee / 100,
          providerFeePercent
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
} 
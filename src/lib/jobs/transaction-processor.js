'use strict';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma/client';
import { paymentService } from '@/lib/payment/service';
import { logger } from '@/lib/logger';
import { getFeeSettings } from '@/lib/payment/fee-settings';

/**
 * Processes all transactions with expired review deadlines
 * If a provider hasn't responded to a service request within 24 hours,
 * the transaction is automatically refunded.
 */
export async function processReviewDeadlines() {
  try {
    logger.info('Processing expired review deadlines');
    
    // Get the current timestamp
    const now = new Date();
    
    // Find all transactions in PROVIDER_REVIEW status with expired review deadline
    const expiredTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PROVIDER_REVIEW',
        reviewDeadline: {
          lt: now
        }
      },
      include: {
        client: true,
        provider: true,
        service: true
      }
    });
    
    logger.info(`Found ${expiredTransactions.length} transactions with expired review deadlines`);
    
    // Process each expired transaction
    const results = await Promise.allSettled(
      expiredTransactions.map(async (transaction) => {
        try {
          logger.debug(`Processing expired review for transaction: ${transaction.id}`);
          
          // If there's a payment intent, cancel it to issue a refund
          if (transaction.paymentIntentId) {
            try {
              await paymentService.cancelPaymentIntent(transaction.paymentIntentId);
              logger.info(`Refunded payment for expired transaction: ${transaction.id}`);
            } catch (error) {
              logger.error(`Failed to refund payment for transaction ${transaction.id}:`, error);
              throw error;
            }
          }
          
          // Update the transaction status to REFUNDED
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'REFUNDED',
              updatedAt: now
            }
          });
          
          // Send notification to the client
          await prisma.notification.create({
            data: {
              userId: transaction.clientId,
              type: 'PAYMENT',
              title: 'Service Request Expired',
              content: `Your service request for ${transaction.service.name} has expired as the provider did not respond within 24 hours. Your payment has been refunded.`,
              isRead: false
            }
          });
          
          // Send notification to the provider
          await prisma.notification.create({
            data: {
              userId: transaction.providerId,
              type: 'PAYMENT',
              title: 'Service Request Expired',
              content: `A service request for ${transaction.service.name} has expired as you did not respond within 24 hours. The client has been refunded.`,
              isRead: false
            }
          });
          
          logger.info(`Successfully processed expired review for transaction: ${transaction.id}`);
          return updatedTransaction;
        } catch (error) {
          logger.error(`Error processing expired review for transaction ${transaction.id}:`, error);
          throw error;
        }
      })
    );
    
    // Log overall results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Processed ${successful} expired reviews successfully, ${failed} failed`);
    
    return {
      processed: expiredTransactions.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    logger.error('Error processing review deadlines:', error);
    throw error;
  }
}

/**
 * Processes all transactions with expired escrow periods
 * When the escrow period ends, funds are automatically released to the provider.
 */
export async function processEscrowReleases() {
  try {
    logger.info('Processing expired escrow periods');
    
    // Get the current timestamp
    const now = new Date();
    
    // Find all transactions in ESCROW status with expired escrow end time
    const expiredEscrows = await prisma.transaction.findMany({
      where: {
        status: 'ESCROW',
        escrowEndTime: {
          lt: now
        }
      },
      include: {
        client: true,
        provider: true,
        service: true
      }
    });
    
    logger.info(`Found ${expiredEscrows.length} transactions with expired escrow periods`);
    
    // Process each expired escrow
    const results = await Promise.allSettled(
      expiredEscrows.map(async (transaction) => {
        try {
          logger.debug(`Processing escrow release for transaction: ${transaction.id}`);
          
          // If there's a payment intent, release the funds to the provider
          if (transaction.paymentIntentId) {
            try {
              // Get current fee settings or use the transaction's stored values
              const { providerFeePercent } = 
                await getFeeSettings().catch(() => ({ 
                  providerFeePercent: transaction.providerFeePercent 
                }));
              
              // Release funds with the provider fee percentage
              await paymentService.releaseFundsToProvider(
                transaction.paymentIntentId,
                transaction.providerId,
                null,  // Let the service retrieve the transferGroup
                null,  // Let the service calculate the amount
                providerFeePercent  // Use the configured fee percentage
              );
              logger.info(`Released funds to provider for transaction: ${transaction.id}`);
            } catch (error) {
              logger.error(`Failed to release funds for transaction ${transaction.id}:`, error);
              throw error;
            }
          }
          
          // Update the transaction status to COMPLETED
          const updatedTransaction = await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'COMPLETED',
              updatedAt: now
            }
          });
          
          // Send notification to the client
          await prisma.notification.create({
            data: {
              userId: transaction.clientId,
              type: 'PAYMENT',
              title: 'Payment Released',
              content: `Your payment for ${transaction.service.name} has been released to the provider as the escrow period has ended.`,
              isRead: false
            }
          });
          
          // Send notification to the provider
          await prisma.notification.create({
            data: {
              userId: transaction.providerId,
              type: 'PAYMENT',
              title: 'Payment Received',
              content: `Payment for ${transaction.service.name} has been released to you as the escrow period has ended.`,
              isRead: false
            }
          });
          
          logger.info(`Successfully processed escrow release for transaction: ${transaction.id}`);
          return updatedTransaction;
        } catch (error) {
          logger.error(`Error processing escrow release for transaction ${transaction.id}:`, error);
          throw error;
        }
      })
    );
    
    // Log overall results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Processed ${successful} escrow releases successfully, ${failed} failed`);
    
    return {
      processed: expiredEscrows.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    logger.error('Error processing escrow releases:', error);
    throw error;
  }
}

/**
 * Process all transaction deadlines
 * This is the main function called by the cron job
 */
export async function processAllTransactions() {
  logger.info('Starting transaction processor');
  
  try {
    // Process review deadlines (refund if provider didn't respond in time)
    const reviewResults = await processReviewDeadlines();
    
    // Process escrow releases (pay provider after escrow period ends)
    const escrowResults = await processEscrowReleases();
    
    logger.info('Transaction processor completed successfully');
    
    // Return combined results
    return {
      reviewDeadlines: reviewResults,
      escrowReleases: escrowResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error in transaction processor:', error);
    throw error;
  }
} 
'use strict';

import { CronJob } from 'cron';
import { processAllTransactions } from './transaction-processor';
import { logger } from '@/lib/logger';

// Define the CronJobs type
export interface CronJobs {
  transactionProcessorJob: CronJob;
  transactionReportJob: CronJob;
}

/**
 * Initializes cron jobs for the application
 * This includes:
 * - Transaction processor: runs every hour to check for transactions that need processing
 */
export function initCronJobs(): CronJobs {
  // Transaction processor job - runs every hour
  const transactionProcessorJob = new CronJob(
    '0 * * * *', // Cron syntax: At minute 0 of every hour
    async () => {
      try {
        logger.info('Running scheduled transaction processor job');
        await processAllTransactions();
        logger.info('Scheduled transaction processor job completed');
      } catch (error: any) {
        logger.error('Error in transaction processor cron job:', error);
      }
    },
    null, // onComplete
    false, // start
    'UTC' // timezone
  );

  // Daily transaction report job - runs once a day at 00:00 UTC
  const transactionReportJob = new CronJob(
    '0 0 * * *', // Cron syntax: At 00:00 (midnight) every day
    async () => {
      try {
        logger.info('Running daily transaction report job');
        // Code to generate and send daily transaction reports
        // This could email admins a summary of transactions
        logger.info('Daily transaction report job completed');
      } catch (error: any) {
        logger.error('Error in daily transaction report cron job:', error);
      }
    },
    null,
    false,
    'UTC'
  );

  // Start the cron jobs
  transactionProcessorJob.start();
  transactionReportJob.start();

  logger.info('Cron jobs initialized');

  // Return job references in case we need to stop them later
  return {
    transactionProcessorJob,
    transactionReportJob
  };
}

/**
 * Stop all cron jobs (useful for graceful shutdown)
 */
export function stopCronJobs(jobs: CronJobs): void {
  if (jobs.transactionProcessorJob) {
    jobs.transactionProcessorJob.stop();
  }
  
  if (jobs.transactionReportJob) {
    jobs.transactionReportJob.stop();
  }
  
  logger.info('Cron jobs stopped');
} 
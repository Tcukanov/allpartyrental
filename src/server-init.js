'use strict';

import { initCronJobs } from '@/lib/jobs/cron';
import { logger } from '@/lib/logger';

/**
 * Initialize server-side components
 * This function should be called when the server starts
 */
export async function initializeServer() {
  try {
    logger.info('Starting server initialization...');
    
    // Initialize cron jobs
    const cronJobs = initCronJobs();
    
    logger.info('Server initialization completed successfully');
    
    // Return references to initialized resources
    return {
      cronJobs
    };
  } catch (error) {
    logger.error('Error during server initialization:', error);
    throw error;
  }
}

// Handle graceful shutdown
function handleShutdown(resources) {
  return async () => {
    logger.info('Server shutdown initiated...');
    
    try {
      // Stop cron jobs
      if (resources && resources.cronJobs) {
        logger.info('Stopping cron jobs...');
        await new Promise((resolve) => {
          stopCronJobs(resources.cronJobs);
          resolve();
        });
      }
      
      logger.info('Server shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during server shutdown:', error);
      process.exit(1);
    }
  };
}

// Set up shutdown handlers if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  (async () => {
    try {
      const resources = await initializeServer();
      
      // Set up shutdown handlers
      process.on('SIGTERM', handleShutdown(resources));
      process.on('SIGINT', handleShutdown(resources));
      
      logger.info('Server ready');
    } catch (error) {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    }
  })();
} 
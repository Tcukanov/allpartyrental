'use strict';

import { initCronJobs, stopCronJobs } from '@/lib/jobs/cron';
import { logger } from '@/lib/logger';

// Store references to initialized resources
let resources = null;

/**
 * Initialize server-side components for Next.js API routes
 * This should be called once when the server starts
 */
export async function initializeApi() {
  // Only initialize once
  if (resources) {
    logger.debug('API already initialized, using existing resources');
    return resources;
  }
  
  try {
    logger.info('Starting API initialization...');
    
    // Initialize cron jobs
    const cronJobs = initCronJobs();
    
    // Store references to initialized resources
    resources = {
      cronJobs,
      initialized: true,
      initTime: new Date().toISOString()
    };
    
    logger.info('API initialization completed successfully');
    
    // Set up shutdown handlers
    setupShutdownHandlers();
    
    return resources;
  } catch (error) {
    logger.error('Error during API initialization:', error);
    throw error;
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupShutdownHandlers() {
  // Only set up handlers once and only in a Node.js environment
  if (typeof process !== 'undefined' && process.on && !process._apiShutdownHandlersSet) {
    process._apiShutdownHandlersSet = true;
    
    const handleShutdown = async () => {
      logger.info('API shutdown initiated...');
      
      try {
        // Stop cron jobs
        if (resources && resources.cronJobs) {
          logger.info('Stopping cron jobs...');
          stopCronJobs(resources.cronJobs);
        }
        
        logger.info('API shutdown completed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during API shutdown:', error);
        process.exit(1);
      }
    };
    
    // Register handlers for various signals
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
    
    logger.debug('API shutdown handlers registered');
  }
}

/**
 * Get API status and initialization information
 */
export function getApiStatus() {
  return {
    status: resources ? 'initialized' : 'uninitialized',
    initTime: resources ? resources.initTime : null,
    cronJobsActive: resources ? !!resources.cronJobs : false
  };
} 
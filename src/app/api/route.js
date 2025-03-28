'use strict';

import { NextResponse } from 'next/server';
import { initializeApi, getApiStatus } from './init';
import { logger } from '@/lib/logger';

// Initialize the API when this module is first loaded
// This ensures cron jobs and other services start when Next.js initializes
(async () => {
  try {
    // Don't run in development on hot reloads
    if (process.env.NODE_ENV === 'development' && global._apiInitialized) {
      logger.debug('Skipping re-initialization in development mode');
      return;
    }
    
    await initializeApi();
    
    // Mark as initialized to prevent re-initialization on hot reload in development
    if (typeof global !== 'undefined') {
      global._apiInitialized = true;
    }
  } catch (error) {
    logger.error('Failed to initialize API on startup:', error);
  }
})();

/**
 * API root endpoint
 * Returns basic API information
 */
export async function GET() {
  try {
    const status = getApiStatus();
    
    return NextResponse.json({
      name: 'AllPartyRent API',
      version: '1.0.0',
      status: status.status,
      environment: process.env.NODE_ENV,
      docs: '/api/docs', // If you have API docs
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error handling API root request:', error);
    
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error.message
    }, { status: 500 });
  }
} 
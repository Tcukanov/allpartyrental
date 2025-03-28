'use strict';

import { NextResponse } from 'next/server';
import { getApiStatus, initializeApi } from '@/app/api/init';
import { logger } from '@/lib/logger';

/**
 * API endpoint to check system status
 * This is useful for monitoring and debugging
 */
export async function GET() {
  try {
    // Initialize API if not already initialized
    if (!getApiStatus().status === 'initialized') {
      await initializeApi();
    }
    
    // Get current status
    const status = getApiStatus();
    
    // Add system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      currentTime: new Date().toISOString()
    };
    
    logger.debug('System status requested');
    
    return NextResponse.json({
      success: true,
      data: {
        status,
        system: systemInfo
      }
    });
  } catch (error) {
    logger.error('Error retrieving system status:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to retrieve system status',
        details: error.message
      }
    }, { status: 500 });
  }
} 
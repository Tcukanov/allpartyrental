import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import os from 'os';
import { exec } from 'child_process';
import util from 'util';
import { prisma } from '@/lib/prisma/client';

export const dynamic = 'force-dynamic';

// Convert exec to promise-based
const execPromise = util.promisify(exec);

// Get system uptime in human-readable format
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
};

// Format bytes to human-readable format
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.warn('Unauthorized access attempt to system status API');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      console.warn(`User attempted to access system status without admin privileges`);
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }
    
    console.info(`Admin accessed system status`);
    
    // Collect system information
    const systemInfo = {
      time: {
        current: new Date().toISOString(),
        uptime: formatUptime(os.uptime()),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      node: {
        version: process.version,
        environment: process.env.NODE_ENV,
      },
      memory: {
        total: formatBytes(os.totalmem()),
        free: formatBytes(os.freemem()),
        usage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1) + '%',
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        load: os.loadavg(),
      },
      os: {
        platform: os.platform(),
        release: os.release(),
        hostname: os.hostname(),
      }
    };
    
    // Get database information
    const dbInfo = {};
    
    // Get counts of main entities from the database
    const [
      userCount,
      serviceCount,
      transactionCount,
      activeTransactionCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.service.count(),
      prisma.transaction.count(),
      prisma.transaction.count({
        where: {
          status: {
            in: ['PENDING', 'PROVIDER_REVIEW', 'ESCROW']
          }
        }
      })
    ]);
    
    dbInfo.counts = {
      users: userCount,
      services: serviceCount,
      transactions: {
        total: transactionCount,
        active: activeTransactionCount
      }
    };
    
    // Get information about scheduled jobs/cron tasks
    const cronInfo = {
      transactionProcessor: {
        lastRun: new Date(Date.now() - 3600000).toISOString(), // Mock data
        nextRun: new Date(Date.now() + 3600000).toISOString(),  // Mock data
        status: 'active'
      }
    };
    
    // Get latest log entries (this is a simplified example)
    const recentLogs = [
      { time: new Date(Date.now() - 120000).toISOString(), level: 'info', message: 'Transaction processor completed successfully' },
      { time: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'User authentication successful' },
      { time: new Date(Date.now() - 600000).toISOString(), level: 'warn', message: 'Failed payment attempt' },
      { time: new Date(Date.now() - 1800000).toISOString(), level: 'error', message: 'Database connection error (resolved)' },
    ];
    
    return NextResponse.json({
      status: 'success',
      system: systemInfo,
      database: dbInfo,
      cron: cronInfo,
      logs: recentLogs,
      api: {
        status: 'online',
        lastRestart: new Date(Date.now() - 86400000).toISOString(), // Mock data
        responseTime: '125ms',
      }
    });
  } catch (error) {
    console.error('Error retrieving system status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve system status', message: error.message ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
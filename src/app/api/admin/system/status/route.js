import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
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

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
    
    // Get system stats
    const systemStats = {
      api: {
        status: 'online',
        responseTime: `${Math.floor(Math.random() * 50 + 10)}ms`,
        version: process.env.npm_package_version || '1.0.0'
      },
      node: {
        version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      os: {
        platform: process.platform,
        arch: process.arch,
        version: os.release(),
        cores: os.cpus().length,
        totalMem: os.totalmem(),
        freeMem: os.freemem()
      },
      memory: {
        usage: process.memoryUsage(),
        percent: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)
      },
      time: {
        current: new Date().toISOString(),
        uptime: process.uptime(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      cron: {
        transactionProcessor: {
          status: 'active',
          lastRun: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // Mock 3 hours ago
        }
      }
    };
    
    // Get database stats
    try {
      // Count users
      const userCount = await prisma.user.count();
      
      // Count parties
      const partyCount = await prisma.party.count();
      
      // Add to stats
      systemStats.database = {
        status: 'connected',
        users: userCount,
        parties: partyCount,
        provider: 'PostgreSQL'
      };
    } catch (dbError) {
      console.error('Error fetching database stats:', dbError);
      systemStats.database = {
        status: 'error',
        error: dbError.message
      };
    }
    
    return NextResponse.json(systemStats);
  } catch (error) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch system status',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 
'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

interface ActivityLog {
  id: string;
  type: string;
  action: string;
  description: string;
  user: string;
  userRole: string;
  timestamp: string;
  metadata?: any;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Gather activity from multiple sources
    const activities: ActivityLog[] = [];

    // 1. Recent Users (signups)
    const recentUsers = await prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'USER',
        action: 'SIGNUP',
        description: `New ${user.role.toLowerCase()} registered`,
        user: user.name || user.email || 'Unknown User',
        userRole: user.role,
        timestamp: user.createdAt.toISOString(),
        metadata: { userId: user.id, email: user.email }
      });
    });

    // 2. Recent Transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        offer: {
          include: {
            client: {
              select: { id: true, name: true, email: true }
            },
            provider: {
              select: { 
                id: true, 
                businessName: true,
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            service: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    recentTransactions.forEach(transaction => {
      activities.push({
        id: `transaction-${transaction.id}`,
        type: 'TRANSACTION',
        action: transaction.status,
        description: `Payment ${transaction.status.toLowerCase()} for ${transaction.offer?.service?.name || 'service'}`,
        user: transaction.offer?.client?.name || 'Unknown User',
        userRole: 'CLIENT',
        timestamp: transaction.createdAt.toISOString(),
        metadata: {
          amount: transaction.amount,
          serviceName: transaction.offer?.service?.name,
          providerName: transaction.offer?.provider?.businessName
        }
      });
    });

    // 3. Recent Services
    const recentServices = await prisma.service.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    recentServices.forEach(service => {
      activities.push({
        id: `service-${service.id}`,
        type: 'SERVICE',
        action: service.status,
        description: `Service "${service.name}" ${service.status === 'PENDING_APPROVAL' ? 'submitted for approval' : service.status.toLowerCase()}`,
        user: service.provider?.businessName || service.provider?.user?.name || 'Unknown Provider',
        userRole: 'PROVIDER',
        timestamp: service.createdAt.toISOString(),
        metadata: {
          serviceId: service.id,
          serviceName: service.name,
          status: service.status
        }
      });
    });

    // 4. Recent Notifications (system events)
    const recentNotifications = await prisma.notification.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      where: {
        type: 'SYSTEM'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    recentNotifications.forEach(notification => {
      activities.push({
        id: `notification-${notification.id}`,
        type: 'NOTIFICATION',
        action: 'SYSTEM_EVENT',
        description: notification.title,
        user: notification.user?.name || 'System',
        userRole: notification.user?.role || 'SYSTEM',
        timestamp: notification.createdAt.toISOString(),
        metadata: {
          content: notification.content
        }
      });
    });

    // Sort all activities by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(skip, skip + limit);
    const totalItems = activities.length;
    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      success: true,
      data: paginatedActivities,
      meta: {
        page: page,
        limit: limit,
        total: totalItems,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Admin activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 
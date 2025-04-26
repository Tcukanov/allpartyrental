'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { logger } from '@/lib/logger';
import { DEFAULT_CITY_SETTING_KEY } from '@/lib/cities/default-city';

interface ActivityLogQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  userId?: string;
  actionType?: string;
  dateRange?: string;
  resource?: string;
}

/**
 * API route for fetching admin activity logs
 * This endpoint is restricted to admin users only
 */
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and authorized as admin
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized access' } },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden: Admin access required' } },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const params: ActivityLogQueryParams = {
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
      search: url.searchParams.get('search') || undefined,
      userId: url.searchParams.get('userId') || undefined,
      actionType: url.searchParams.get('actionType') || undefined,
      dateRange: url.searchParams.get('dateRange') || undefined,
      resource: url.searchParams.get('resource') || undefined,
    };
    
    // Parse pagination parameters
    const page = parseInt(params.page, 10);
    const limit = Math.min(parseInt(params.limit, 10), 100); // Cap at 100 items
    const skip = (page - 1) * limit;
    
    // Build filters
    const where: any = {};
    
    // Filter by user role if specified
    if (params.userId && params.userId !== 'all') {
      where.user = {
        role: params.userId
      };
    }
    
    // Filter by action type if specified
    if (params.actionType && params.actionType !== 'all') {
      where.actionType = params.actionType;
    }
    
    // Filter by date range if specified
    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date;
      
      switch (params.dateRange) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          dateFrom = new Date(now);
          dateFrom.setDate(dateFrom.getDate() - 1);
          dateFrom.setHours(0, 0, 0, 0);
          break;
        case '7days':
          dateFrom = new Date(now);
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case '30days':
          dateFrom = new Date(now);
          dateFrom.setDate(dateFrom.getDate() - 30);
          break;
        default:
          dateFrom = new Date(0); // From epoch
      }
      
      where.timestamp = {
        gte: dateFrom
      };
    }
    
    // Search functionality
    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { resource: { contains: params.search, mode: 'insensitive' } },
        { details: { contains: params.search, mode: 'insensitive' } },
        { 
          user: {
            name: { contains: params.search, mode: 'insensitive' }
          }
        }
      ];
    }
    
    // Get activity logs from various sources
    let activityLogs = [];
    
    // 1. Get user registration activity
    const newUsers = await prisma.user.findMany({
      where: {
        ...where.user,
        createdAt: where.timestamp,
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...newUsers.map(user => ({
        id: `user-reg-${user.id}`,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        userAvatar: null,
        action: 'User registration',
        actionType: 'CREATE',
        resource: 'user',
        resourceId: user.id,
        details: `${user.name} (${user.email}) registered as ${user.role.toLowerCase()}`,
        timestamp: user.createdAt.toISOString(),
        ipAddress: null
      }))
    ];
    
    // 2. Get recent transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: where.timestamp,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        offer: {
          select: {
            client: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            provider: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...transactions.map(tx => ({
        id: `tx-${tx.id}`,
        userId: tx.offer.client.id,
        userName: tx.offer.client.name,
        userRole: tx.offer.client.role,
        userAvatar: null,
        action: 'Transaction created',
        actionType: 'CREATE',
        resource: 'transaction',
        resourceId: tx.id,
        details: `${tx.offer.client.name} created transaction for $${tx.amount} with ${tx.offer.provider.name} for ${tx.offer.service.name}`,
        timestamp: tx.createdAt.toISOString(),
        ipAddress: null
      }))
    ];
    
    // 3. Get recent services
    const services = await prisma.service.findMany({
      where: {
        createdAt: where.timestamp,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...services.map(service => ({
        id: `svc-${service.id}`,
        userId: service.provider.id,
        userName: service.provider.name,
        userRole: service.provider.role,
        userAvatar: null,
        action: 'Service created',
        actionType: 'CREATE',
        resource: 'service',
        resourceId: service.id,
        details: `${service.provider.name} created ${service.category.name} service: ${service.name}`,
        timestamp: service.createdAt.toISOString(),
        ipAddress: null
      }))
    ];
    
    // 4. Get recent parties
    const parties = await prisma.party.findMany({
      where: {
        createdAt: where.timestamp,
      },
      select: {
        id: true,
        name: true,
        guestCount: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        city: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...parties.map(party => ({
        id: `party-${party.id}`,
        userId: party.client.id,
        userName: party.client.name,
        userRole: party.client.role,
        userAvatar: null,
        action: 'Party created',
        actionType: 'CREATE',
        resource: 'party',
        resourceId: party.id,
        details: `${party.client.name} created party "${party.name}" with ${party.guestCount} guests in ${party.city.name}`,
        timestamp: party.createdAt.toISOString(),
        ipAddress: null
      }))
    ];
    
    // 5. Get recent offers
    const offers = await prisma.offer.findMany({
      where: {
        createdAt: where.timestamp,
      },
      select: {
        id: true,
        price: true,
        status: true,
        createdAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...offers.map(offer => ({
        id: `offer-${offer.id}`,
        userId: offer.provider.id,
        userName: offer.provider.name,
        userRole: offer.provider.role,
        userAvatar: null,
        action: 'Offer created',
        actionType: 'CREATE',
        resource: 'offer',
        resourceId: offer.id,
        details: `${offer.provider.name} created offer for ${offer.service.name} at $${offer.price} for ${offer.client.name}`,
        timestamp: offer.createdAt.toISOString(),
        ipAddress: null
      }))
    ];
    
    // 6. Get status changes for offers
    const offerStatusChanges = await prisma.offer.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED', 'CANCELLED'] },
        updatedAt: { not: { equals: prisma.offer.fields.createdAt } },
        ...(where.timestamp && { updatedAt: where.timestamp }),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        service: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...offerStatusChanges.map(offer => {
        const isClientAction = ['APPROVED', 'REJECTED'].includes(offer.status);
        return {
          id: `offer-status-${offer.id}`,
          userId: isClientAction ? offer.client.id : offer.provider.id,
          userName: isClientAction ? offer.client.name : offer.provider.name,
          userRole: isClientAction ? offer.client.role : offer.provider.role,
          userAvatar: null,
          action: `Offer ${offer.status.toLowerCase()}`,
          actionType: offer.status === 'CANCELLED' ? 'DELETE' : 'UPDATE',
          resource: 'offer',
          resourceId: offer.id,
          details: isClientAction 
            ? `${offer.client.name} ${offer.status.toLowerCase()} offer for ${offer.service.name} from ${offer.provider.name}`
            : `${offer.provider.name} cancelled offer for ${offer.service.name} to ${offer.client.name}`,
          timestamp: offer.updatedAt.toISOString(),
          ipAddress: null
        };
      })
    ];
    
    // 7. Get transaction status changes
    const txStatusChanges = await prisma.transaction.findMany({
      where: {
        status: { in: ['ESCROW', 'COMPLETED', 'REFUNDED', 'DISPUTED', 'PROVIDER_REVIEW'] },
        updatedAt: { not: { equals: prisma.transaction.fields.createdAt } },
        ...(where.timestamp && { updatedAt: where.timestamp }),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        offer: {
          select: {
            client: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            provider: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...txStatusChanges.map(tx => {
        let action, actionType, actor;
        
        switch(tx.status) {
          case 'ESCROW':
            action = 'Payment in escrow';
            actionType = 'UPDATE';
            actor = tx.offer.client;
            break;
          case 'COMPLETED':
            action = 'Transaction completed';
            actionType = 'UPDATE';
            actor = { id: 'system', name: 'System', role: 'SYSTEM' };
            break;
          case 'REFUNDED':
            action = 'Transaction refunded';
            actionType = 'UPDATE';
            actor = { id: 'system', name: 'System', role: 'SYSTEM' };
            break;
          case 'DISPUTED':
            action = 'Transaction disputed';
            actionType = 'UPDATE';
            actor = tx.offer.client;
            break;
          case 'PROVIDER_REVIEW':
            action = 'Provider review requested';
            actionType = 'UPDATE';
            actor = { id: 'system', name: 'System', role: 'SYSTEM' };
            break;
          default:
            action = `Transaction status changed to ${tx.status}`;
            actionType = 'UPDATE';
            actor = { id: 'system', name: 'System', role: 'SYSTEM' };
        }
        
        return {
          id: `tx-status-${tx.id}`,
          userId: actor.id,
          userName: actor.name,
          userRole: actor.role,
          userAvatar: null,
          action,
          actionType,
          resource: 'transaction',
          resourceId: tx.id,
          details: `Transaction for ${tx.offer.service.name} between ${tx.offer.client.name} and ${tx.offer.provider.name} changed to ${tx.status.toLowerCase().replace('_', ' ')}`,
          timestamp: tx.updatedAt.toISOString(),
          ipAddress: null
        };
      })
    ];
    
    // 8. Get service status changes
    const serviceStatusChanges = await prisma.service.findMany({
      where: {
        status: { in: ['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL'] },
        updatedAt: { not: { equals: prisma.service.fields.createdAt } },
        ...(where.timestamp && { updatedAt: where.timestamp }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    activityLogs = [
      ...activityLogs,
      ...serviceStatusChanges.map(service => {
        const isProviderAction = service.status === 'INACTIVE';
        return {
          id: `service-status-${service.id}`,
          userId: isProviderAction ? service.provider.id : 'system',
          userName: isProviderAction ? service.provider.name : 'System',
          userRole: isProviderAction ? service.provider.role : 'SYSTEM',
          userAvatar: null,
          action: `Service ${service.status.toLowerCase().replace('_', ' ')}`,
          actionType: 'UPDATE',
          resource: 'service',
          resourceId: service.id,
          details: `Service "${service.name}" by ${service.provider.name} changed to ${service.status.toLowerCase().replace('_', ' ')}`,
          timestamp: service.updatedAt.toISOString(),
          ipAddress: null
        };
      })
    ];
    
    // 9. Most recent logins (simulated from session data)
    const recentSessions = await prisma.session.findMany({
      select: {
        id: true,
        expires: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true
          }
        }
      },
      orderBy: {
        expires: 'desc'
      },
      take: 10 // Only take most recent
    });
    
    activityLogs = [
      ...activityLogs,
      ...recentSessions.map(session => {
        // Session expires in the future, so subtract session length to get approximate login time
        const loginTime = new Date(session.expires);
        loginTime.setHours(loginTime.getHours() - 24); // Assume 24-hour session
        
        if (where.timestamp && loginTime < where.timestamp.gte) {
          return null; // Filter out based on date range
        }
        
        return {
          id: `login-${session.id}`,
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          userAvatar: null,
          action: 'User login',
          actionType: 'LOGIN',
          resource: 'session',
          resourceId: session.id,
          details: `${session.user.name} (${session.user.email}) logged in`,
          timestamp: loginTime.toISOString(),
          ipAddress: null
        };
      }).filter(Boolean)
    ];
    
    // 10. Add city management activity
    const cityChanges = await prisma.city.findMany({
      where: {
        updatedAt: { not: { equals: prisma.city.fields.createdAt } },
        ...(where.timestamp && { updatedAt: where.timestamp }),
      },
      select: {
        id: true,
        name: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit,
      skip: skip
    });
    
    // Get the default city ID from system settings
    const defaultCitySetting = await prisma.systemSettings.findUnique({
      where: { key: DEFAULT_CITY_SETTING_KEY }
    });
    
    // Find system settings updates related to default city
    const defaultCityChanges = await prisma.systemSettings.findMany({
      where: {
        key: DEFAULT_CITY_SETTING_KEY,
        updatedAt: { not: { equals: prisma.systemSettings.fields.createdAt } },
        ...(where.timestamp && { updatedAt: where.timestamp }),
      },
      select: {
        value: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: limit
    });
    
    // Process city changes
    activityLogs = [
      ...activityLogs,
      ...cityChanges.map(city => {
        const isDefault = defaultCitySetting?.value === city.id;
        return {
          id: `city-update-${city.id}`,
          userId: 'system',
          userName: 'Admin System',
          userRole: 'ADMIN',
          userAvatar: null,
          action: isDefault ? 'Default city updated' : 'City updated',
          actionType: 'UPDATE',
          resource: 'city',
          resourceId: city.id,
          details: isDefault 
            ? `Updated settings for default city ${city.name}`
            : `Updated settings for city ${city.name}`,
          timestamp: city.updatedAt.toISOString(),
          ipAddress: null
        };
      })
    ];
    
    // Process default city setting changes
    if (defaultCityChanges.length > 0) {
      // Get city names for the change logs
      const cityIds = defaultCityChanges.map(change => change.value);
      const cities = await prisma.city.findMany({
        where: {
          id: {
            in: cityIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      // Create activity logs for default city changes
      activityLogs = [
        ...activityLogs,
        ...defaultCityChanges.map(change => {
          const city = cities.find(c => c.id === change.value);
          return {
            id: `default-city-${change.value}-${change.updatedAt.getTime()}`,
            userId: 'system',
            userName: 'Admin System',
            userRole: 'ADMIN',
            userAvatar: null,
            action: 'Set default city',
            actionType: 'UPDATE',
            resource: 'city',
            resourceId: change.value,
            details: city 
              ? `Set ${city.name} as the default city` 
              : `Set city ID ${change.value} as the default city`,
            timestamp: change.updatedAt.toISOString(),
            ipAddress: null
          };
        })
      ];
    }
    
    // Sort by timestamp (newest first)
    activityLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Apply pagination
    const paginatedLogs = activityLogs.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      meta: {
        page,
        limit,
        total: activityLogs.length,
        pages: Math.ceil(activityLogs.length / limit)
      }
    });
    
  } catch (error) {
    logger.error('Error fetching admin activity logs:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to fetch activity logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 
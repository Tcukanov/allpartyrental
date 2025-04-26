'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

/**
 * API route for fetching admin reports data
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || 'last30days';
    const reportType = url.searchParams.get('type') || 'overview';
    
    // Get date ranges for filtering
    const now = new Date();
    
    // Configure start date based on time range
    let startDate: Date;
    switch (timeRange) {
      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'last30days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'last90days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
        break;
      case 'allTime':
      default:
        startDate = new Date(0); // Beginning of time (Jan 1, 1970)
        break;
    }
    
    // Get previous period for comparison (same duration before startDate)
    const previousPeriodDuration = now.getTime() - startDate.getTime();
    const previousPeriodStart = new Date(startDate.getTime() - previousPeriodDuration);
    const previousPeriodEnd = new Date(startDate);
    
    // Calculate first day of previous month and current month for monthly comparisons
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Fetch transaction data
    const [
      // Current period transactions 
      currentTransactions,
      // Previous period transactions
      previousTransactions,
      // Current month transactions
      thisMonthTransactions,
      // Last month transactions
      lastMonthTransactions,
      // Total transactions
      totalTransactions,
      // Transaction aggregate (sum of amount)
      transactionSum
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        include: {
          offer: {
            include: {
              service: true
            }
          },
          party: {
            include: {
              city: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        },
        select: {
          id: true,
          amount: true
        }
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: thisMonth,
            lt: nextMonth
          }
        },
        select: {
          id: true, 
          amount: true
        }
      }),
      prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        },
        select: {
          id: true,
          amount: true
        }
      }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: {
          amount: true
        }
      })
    ]);
    
    // Calculate revenue metrics
    const currentRevenue = currentTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const previousRevenue = previousTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalRevenue = transactionSum._sum.amount ? Number(transactionSum._sum.amount) : 0;
    
    // Calculate percentage change
    const revenuePercentChange = previousRevenue === 0 
      ? 100 
      : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    
    const transactionsPercentChange = previousTransactions.length === 0
      ? 100
      : ((thisMonthTransactions.length - lastMonthTransactions.length) / lastMonthTransactions.length) * 100;
    
    // Fetch user data
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      // Fetch service data
      services
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: thisMonth,
            lt: nextMonth
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      prisma.service.findMany({
        select: {
          id: true,
          name: true,
          status: true
        }
      })
    ]);
    
    // Calculate user percentage change
    const usersPercentChange = newUsersLastMonth === 0
      ? 100
      : ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100;
    
    // Count services by status
    const activeServices = services.filter(s => s.status === 'ACTIVE').length;
    const inactiveServices = services.filter(s => s.status === 'INACTIVE').length;
    const pendingServices = services.filter(s => s.status === 'PENDING_APPROVAL').length;
    
    // Calculate top services by bookings and revenue
    const serviceCounts = new Map();
    const serviceRevenue = new Map();
    
    currentTransactions.forEach(transaction => {
      const serviceName = transaction.offer?.service?.name || 'Unknown Service';
      const serviceId = transaction.offer?.service?.id || 'unknown';
      
      // Count bookings
      if (!serviceCounts.has(serviceId)) {
        serviceCounts.set(serviceId, { id: serviceId, name: serviceName, count: 0, revenue: 0 });
      }
      serviceCounts.get(serviceId).count += 1;
      
      // Sum revenue
      serviceRevenue.set(serviceId, 
        (serviceRevenue.get(serviceId) || 0) + Number(transaction.amount)
      );
      serviceCounts.get(serviceId).revenue = serviceRevenue.get(serviceId);
    });
    
    // Get top services
    const topServices = Array.from(serviceCounts.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(service => ({
        id: service.id,
        name: service.name,
        bookings: service.count,
        revenue: service.revenue
      }));
    
    // Calculate top cities by bookings and revenue
    const cityCounts = new Map();
    const cityRevenue = new Map();
    
    currentTransactions.forEach(transaction => {
      const cityName = transaction.party?.city?.name || 'Unknown City';
      const cityId = transaction.party?.city?.id || 'unknown';
      
      // Count bookings
      if (!cityCounts.has(cityId)) {
        cityCounts.set(cityId, { id: cityId, name: cityName, count: 0, revenue: 0 });
      }
      cityCounts.get(cityId).count += 1;
      
      // Sum revenue
      cityRevenue.set(cityId, 
        (cityRevenue.get(cityId) || 0) + Number(transaction.amount)
      );
      cityCounts.get(cityId).revenue = cityRevenue.get(cityId);
    });
    
    // Get top cities
    const topCities = Array.from(cityCounts.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(city => ({
        id: city.id,
        name: city.name,
        bookings: city.count,
        revenue: city.revenue
      }));
    
    // Calculate monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthTransactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: month,
            lt: nextMonth
          }
        },
        select: {
          id: true,
          amount: true
        }
      });
      
      const monthName = month.toLocaleString('default', { month: 'short' });
      const count = monthTransactions.length;
      const revenue = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      monthlyData.push({
        month: monthName,
        transactions: count,
        revenue: revenue
      });
    }
    
    // Construct the report data
    const reportData = {
      transactions: {
        total: totalTransactions,
        thisMonth: thisMonthTransactions.length,
        lastMonth: lastMonthTransactions.length,
        percentChange: Math.round(transactionsPercentChange * 10) / 10
      },
      revenue: {
        total: totalRevenue,
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        percentChange: Math.round(revenuePercentChange * 10) / 10
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        lastMonth: newUsersLastMonth,
        percentChange: Math.round(usersPercentChange * 10) / 10
      },
      services: {
        total: services.length,
        active: activeServices,
        inactive: inactiveServices,
        pending: pendingServices
      },
      topServices,
      topCities,
      monthlyData
    };
    
    return NextResponse.json({
      success: true,
      data: reportData
    });
    
  } catch (error) {
    logger.error('Error generating admin reports:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
} 
'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

/**
 * Fetch all transactions for admin view
 * This endpoint is restricted to admin users only
 */
export async function GET(request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is an admin
    if (session.user.role !== 'ADMIN') {
      logger.warn(`Non-admin user ${session.user.id} attempted to access admin transactions`);
      return NextResponse.json(
        { message: 'Forbidden - Only administrators can access this endpoint' },
        { status: 403 }
      );
    }

    logger.info(`Admin ${session.user.id} requested all transactions`);

    // Get query parameters for filtering/sorting
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDir = url.searchParams.get('sortDir') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    
    // Build the query
    const query = {
      where: {},
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortDir,
      },
      take: Math.min(limit, 500), // Limit to prevent excessive data transfer
    };
    
    // Add status filter if provided
    if (status) {
      query.where.status = status;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany(query);

    logger.info(`Returning ${transactions.length} transactions to admin ${session.user.id}`);
    
    return NextResponse.json(transactions);
  } catch (error) {
    logger.error('Error fetching admin transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
} 
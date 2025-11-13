'use strict';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import { logger } from '@/lib/logger';

/**
 * Fetch all transactions for admin view
 * This endpoint is restricted to admin users only
 */
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
    
    logger.info('Admin fetching all transactions');
    
    // Fetch transactions directly from the database
    const dbTransactions = await prisma.transaction.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        offer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            provider: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        party: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 100 // Limit to the latest 100 transactions
    });
    
    // Format the transactions for the response
    const transactions = dbTransactions.map(transaction => {
      return {
        id: transaction.id,
        amount: Number(transaction.amount),
        status: transaction.status,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        paypalOrderId: transaction.paypalOrderId || null,
        paypalCaptureId: transaction.paypalCaptureId || null,
        paymentMethod: transaction.paypalOrderId ? 'PayPal' : 'Unknown',
        partyId: transaction.party?.id || null,
        partyName: transaction.party?.name || 'Unknown Party',
        userId: transaction.offer?.client?.id || null,
        userName: transaction.offer?.client?.name || 'Unknown User',
        userEmail: transaction.offer?.client?.email || 'unknown@example.com',
        providerId: transaction.offer?.provider?.id || null,
        providerName: transaction.offer?.provider?.businessName || transaction.offer?.provider?.user?.name || 'Unknown Provider',
        providerEmail: transaction.offer?.provider?.user?.email || 'unknown@example.com',
        serviceName: transaction.offer?.service?.name || 'Unknown Service',
        escrowStartTime: transaction.escrowStartTime ? transaction.escrowStartTime.toISOString() : null,
        escrowEndTime: transaction.escrowEndTime ? transaction.escrowEndTime.toISOString() : null,
        clientFeePercent: transaction.clientFeePercent,
        providerFeePercent: transaction.providerFeePercent
      };
    });
    
    // Return the transactions
    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch transactions',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 
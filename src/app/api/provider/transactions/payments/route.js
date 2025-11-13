import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

export async function GET(request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Ensure the user is a provider and get/create provider record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, name: true, provider: true }
    });

    if (!user || user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }

    // Get or create provider record
    let provider = user.provider;
    if (!provider) {
      console.log(`Auto-creating Provider record for user: ${user.name} (${user.id})`);
      
      provider = await prisma.provider.create({
        data: {
          userId: user.id,
          businessName: user.name || 'Business Name',
          bio: `Professional services provider`,
          isVerified: false,
          paypalCanReceivePayments: false,
          paypalOnboardingStatus: 'NOT_STARTED',
          paypalEnvironment: 'sandbox'
        }
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'this_month';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate, endDate;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'this_week':
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        // Default to this month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    // Always use sandbox mode for now
    const useSandbox = true;
    
    // Get provider's PayPal details
    const providerPayPalDetails = provider ? {
      paypalEmail: provider.paypalEmail,
      paypalMerchantId: provider.paypalMerchantId,
      paypalEnvironment: provider.paypalEnvironment || 'SANDBOX'
    } : null;

    // Build where clause - Use Provider ID, not User ID
    const where = {
      offer: {
        providerId: provider.id  // Use Provider ID instead of User ID
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Apply status filter if provided
    if (status) {
      where.status = status;
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        offer: {
          include: {
            client: {
              select: { id: true, name: true }
            },
            service: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip
    });

    // Transform data for client-side consumption
    const transformedTransactions = transactions.map(tx => {
      // Calculate provider amount (original amount minus fees)
      const originalAmount = Number(tx.amount);
      const providerFeePercent = tx.providerFeePercent || 10;
      const providerAmount = originalAmount * (1 - (providerFeePercent / 100));
      
      // Format transferId for sandbox
      let transferId = tx.transferId;
      
      // If sandbox and no transferId, use a placeholder transferId with a sandbox prefix 
      // (only for completed transactions without actual transferIds)
      if (useSandbox && !transferId && tx.status === 'COMPLETED') {
        transferId = `SANDBOX-${tx.id.substring(0, 10)}`;
      }
      
      return {
        id: tx.id,
        status: tx.status,
        amount: originalAmount,
        providerAmount: providerAmount,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        serviceName: tx.offer?.service?.name || 'Service',
        clientName: tx.offer?.client?.name || 'Client',
        clientId: tx.offer?.client?.id,
        transferId: transferId,
        transferStatus: tx.transferStatus || (transferId ? 'COMPLETED' : null),
        transferDate: tx.transferDate || (transferId ? new Date() : null),
        // Add sandbox info
        isSandbox: useSandbox
      };
    });

    // Count total matching transactions for pagination
    const totalCount = await prisma.transaction.count({ where });

    // Calculate earnings statistics
    const allTransactions = await prisma.transaction.findMany({
      where: {
        offer: {
          providerId: provider.id
        }
      },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        providerFeePercent: true
      }
    });

    // Calculate total earnings (completed transactions)
    const completedTransactions = allTransactions.filter(tx => tx.status === 'COMPLETED');
    const totalEarnings = completedTransactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      const feePercent = tx.providerFeePercent || 10;
      const providerAmount = amount * (1 - (feePercent / 100));
      return sum + providerAmount;
    }, 0);

    // Calculate this month's earnings
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = completedTransactions
      .filter(tx => new Date(tx.createdAt) >= startOfMonth)
      .reduce((sum, tx) => {
        const amount = Number(tx.amount);
        const feePercent = tx.providerFeePercent || 10;
        const providerAmount = amount * (1 - (feePercent / 100));
        return sum + providerAmount;
      }, 0);

    // Calculate pending payments
    const pendingTransactions = allTransactions.filter(tx => tx.status === 'PENDING');
    const pendingPayments = pendingTransactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      const feePercent = tx.providerFeePercent || 10;
      const providerAmount = amount * (1 - (feePercent / 100));
      return sum + providerAmount;
    }, 0);

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions,
      // Statistics at top level for frontend compatibility
      totalEarnings: totalEarnings,
      thisMonthEarnings: thisMonthEarnings,
      pendingPayments: pendingPayments,
      completedTransactions: completedTransactions.length,
      pendingTransactionsCount: pendingTransactions.length,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      },
      paypalDetails: {
        ...providerPayPalDetails,
        isSandbox: useSandbox
      }
    });
  } catch (error) {
    console.error('Error fetching provider transactions for payments:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
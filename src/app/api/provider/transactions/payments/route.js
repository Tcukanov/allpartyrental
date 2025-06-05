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
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : undefined;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
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
      }
    };

    // Apply date filter if provided
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

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

    return NextResponse.json({
      success: true,
      transactions: transformedTransactions,
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
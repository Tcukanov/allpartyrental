import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';

// Define an extended service type that includes metadata
interface ServiceWithMetadata {
  id: string;
  name: string;
  description: string;
  price: number | string;
  categoryId: string;
  providerId: string;
  photos: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  availableDays: string[];
  availableHoursStart?: string | null;
  availableHoursEnd?: string | null;
  minRentalHours?: number | null;
  maxRentalHours?: number | null;
  colors: string[];
  metadata?: string | null;
  filterValues?: Record<string, any>;
}

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = await prisma.service.findUnique({
      where: {
        id: id,
      },
      include: {
        provider: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile: {
                  select: {
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        category: true,

      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    let serviceWithMetadata = service as unknown as ServiceWithMetadata;
    
    // Parse metadata if it exists
    if (service.metadata) {
      try {
        const metadata = JSON.parse(service.metadata);
        if (metadata.filterValues) {
          serviceWithMetadata.filterValues = metadata.filterValues;
        }
      } catch (error) {
        console.error('Error parsing service metadata:', error);
      }
    }

    return NextResponse.json({ success: true, data: serviceWithMetadata });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const requestData = await request.json();
    
    // Get the current service to check its status
    const currentService = await prisma.service.findUnique({
      where: {
        id: id,
        providerId: session.user.id
      }
    });

    if (!currentService) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found or you do not have permission to edit it'
        }
      }, { status: 404 });
    }
    
    // PAYPAL CONNECTION REQUIREMENT: Check if trying to set status to ACTIVE
    if (requestData.status === 'ACTIVE') {
      console.log('📊 Provider attempting to activate service - checking PayPal connection');
      
      // Get provider record to check PayPal status
      const provider = await prisma.provider.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          paypalCanReceivePayments: true,
          paypalMerchantId: true,
          paypalOnboardingStatus: true
        }
      });

      if (!provider) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider record not found'
          }
        }, { status: 400 });
      }

      console.log('📊 PayPal connection status for service activation:', {
        providerId: provider.id,
        paypalCanReceivePayments: provider.paypalCanReceivePayments,
        paypalMerchantId: provider.paypalMerchantId,
        paypalOnboardingStatus: provider.paypalOnboardingStatus
      });

      if (!provider.paypalCanReceivePayments || !provider.paypalMerchantId) {
        console.log('❌ Provider cannot activate service - PayPal not connected');
        return NextResponse.json({
          success: false,
          error: {
            code: 'PAYPAL_CONNECTION_REQUIRED',
            message: 'PayPal connection required to activate services',
            details: 'You must connect your PayPal account before activating services. This ensures you can receive payments from customers.',
            action: {
              text: 'Connect PayPal Account',
              url: '/provider/dashboard/paypal'
            }
          }
        }, { status: 400 });
      }

      console.log('✅ Provider PayPal connection verified - proceeding with service activation');
    }
    
    // Prepare metadata with filterValues if they exist
    let metadata = null;
    if (requestData.filterValues) {
      metadata = JSON.stringify({ filterValues: requestData.filterValues });
      // Remove it from the main data object since it's not a direct field
      delete requestData.filterValues;
    }

    // Remove non-Prisma fields if they exist
    const { provider, category, ...serviceData } = requestData;

    // Add metadata back if it exists
    if (metadata) {
      serviceData.metadata = metadata;
    }

    // APPROVAL WORKFLOW: If the service is currently ACTIVE and provider is making changes,
    // set status to PENDING_APPROVAL to require admin review
    // Exception: If they're just changing status to INACTIVE, allow that directly
    const isStatusOnlyChange = Object.keys(serviceData).length === 1 && 'status' in serviceData;
    const isDeactivating = serviceData.status === 'INACTIVE';
    
    if (currentService.status === 'ACTIVE' && !isStatusOnlyChange) {
      console.log('📝 Provider editing ACTIVE service - setting to PENDING_APPROVAL for admin review');
      serviceData.status = 'PENDING_APPROVAL';
    } else if (currentService.status === 'ACTIVE' && isStatusOnlyChange && !isDeactivating) {
      // If they're just trying to change status but service is already active, keep it active
      console.log('✅ Service is already ACTIVE - no status change needed');
      delete serviceData.status;
    }

    const updatedService = await prisma.service.update({
      where: {
        id: id,
        providerId: session.user.id
      },
      data: serviceData,
      include: {
        category: true
      }
    });

    const needsApproval = updatedService.status === 'PENDING_APPROVAL' && currentService.status === 'ACTIVE';

    return NextResponse.json({ 
      success: true, 
      data: updatedService,
      message: needsApproval 
        ? 'Your changes have been submitted and are pending admin approval.'
        : 'Service updated successfully.'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // First, check if the service exists and belongs to the current provider
    const service = await prisma.service.findUnique({
      where: {
        id: id,
        providerId: session.user.id
      },
      include: {
        offers: true,
        partyServices: true
      }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found or not owned by you' },
        { status: 404 }
      );
    }

    // Use a transaction to safely delete related records first
    await prisma.$transaction(async (prisma) => {
      // 1. Delete related offers
      if (service.offers.length > 0) {
        // We need to check if any offers have transactions or chats
        for (const offer of service.offers) {
          // Delete any related chat and messages
          const chat = await prisma.chat.findUnique({
            where: { offerId: offer.id }
          });
          
          if (chat) {
            // First delete messages
            await prisma.message.deleteMany({
              where: { chatId: chat.id }
            });
            
            // Then delete the chat
            await prisma.chat.delete({
              where: { id: chat.id }
            });
          }
          
          // Check and delete related transactions
          const transaction = await prisma.transaction.findUnique({
            where: { offerId: offer.id }
          });
          
          if (transaction) {
            // Check if there's a dispute
            const dispute = await prisma.dispute.findUnique({
              where: { transactionId: transaction.id }
            });
            
            if (dispute) {
              await prisma.dispute.delete({
                where: { id: dispute.id }
              });
            }
            
            // Delete the transaction
            await prisma.transaction.delete({
              where: { id: transaction.id }
            });
          }
        }
        
        // Now delete all offers
        await prisma.offer.deleteMany({
          where: { serviceId: id }
        });
      }
      
      // 2. Delete related party services
      if (service.partyServices.length > 0) {
        await prisma.partyService.deleteMany({
          where: { serviceId: id }
        });
      }
      
      // 3. Finally delete the service
      await prisma.service.delete({
        where: {
          id: id,
          providerId: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service. There might be active transactions or other related records.' },
      { status: 500 }
    );
  }
} 
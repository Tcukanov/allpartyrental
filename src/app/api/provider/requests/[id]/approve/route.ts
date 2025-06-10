import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { NotificationType } from '@prisma/client'; 
import { offerRequiresAction } from '@/utils/statusConfig';
import { PaymentService } from '@/lib/payment/payment-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error('Approve request: No session or user found');
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Unwrap the params Promise
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    console.log(`Processing approval for offer ID: ${id}`);
    
    // Check if user is a provider
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { 
        id: true, 
        role: true,
        provider: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user || user.role !== 'PROVIDER') {
      console.error(`User ${session.user.email} is not a provider`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only providers can access this endpoint' } },
        { status: 403 }
      );
    }

    if (!user.provider) {
      console.error(`Provider record not found for user: ${user.id}`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Provider record not found' } },
        { status: 404 }
      );
    }

    // Get the offer with service data
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            providerId: true,
            name: true  // Include the service name
          }
        },
        client: {
          select: {
            id: true
          }
        }
      }
    });

    if (!offer) {
      console.error(`Offer with ID ${id} not found`);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Offer not found' } },
        { status: 404 }
      );
    }

    // Check if the provider owns the service - use Provider ID, not User ID
    if (offer.service.providerId !== user.provider.id) {
      console.error(`Provider ${user.provider.id} does not own service ${offer.service.id} (owned by ${offer.service.providerId})`);
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only manage offers for your own services' } },
        { status: 403 }
      );
    }

    // Check if the offer status allows approval
    if (!offerRequiresAction(offer.status)) {
      console.error(`Offer status ${offer.status} does not allow approval`);
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `Offers with status ${offer.status} cannot be approved` } },
        { status: 400 }
      );
    }

    console.log(`Updating offer ${id} status to APPROVED`);
    // Update the offer status to APPROVED
    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: {
        status: 'APPROVED',
      }
    });

    // Check for an existing transaction
    console.log(`Checking for existing transaction for offer ${id}`);
    const existingTransaction = await prisma.transaction.findUnique({
      where: { offerId: id }
    });

    // If there's a transaction, update its status and auto-capture PayPal payment
    if (existingTransaction) {
      console.log(`Updating transaction ${existingTransaction.id} to COMPLETED status`);
      
      // Auto-capture PayPal payment if it exists (for both PayPal and credit card payments)
      if (existingTransaction.paypalOrderId) {
        console.log(`Checking PayPal order status for: ${existingTransaction.paypalOrderId}`);
        try {
          const paymentService = new PaymentService();
          
          // First check if the order is approved by the customer
          const orderDetails = await paymentService.getOrderDetails(existingTransaction.paypalOrderId);
          console.log(`PayPal order status: ${orderDetails.status}`);
          
          if (orderDetails.status === 'APPROVED') {
            // Order is approved, proceed with capture
            console.log(`Auto-capturing approved PayPal payment for order: ${existingTransaction.paypalOrderId}`);
            const captureResult = await paymentService.capturePayment(existingTransaction.paypalOrderId);
            
            if (captureResult.success) {
              console.log(`PayPal payment captured successfully: ${captureResult.captureId}`);
              // Transaction status will be updated to COMPLETED by the capturePayment method
            } else {
              console.error(`PayPal capture failed for transaction ${existingTransaction.id}`);
              await prisma.transaction.update({
                where: { id: existingTransaction.id },
                data: {
                  status: 'PROVIDER_REVIEW',
                  reviewDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
              });
            }
          } else {
            // Order is not approved by customer - decline the service request
            console.log(`PayPal order ${existingTransaction.paypalOrderId} is not approved (status: ${orderDetails.status}). Cannot approve service request.`);
            
            return NextResponse.json({
              success: false,
              error: { 
                code: 'PAYMENT_NOT_COMPLETED', 
                message: 'Cannot approve service request - customer has not completed payment. Please ask customer to complete their payment first.' 
              }
            }, { status: 400 });
          }
        } catch (captureError) {
          console.error(`PayPal order check/capture error for transaction ${existingTransaction.id}:`, captureError);
          
          // If error contains "ORDER_NOT_APPROVED", provide specific message
          if (captureError.message && captureError.message.includes('ORDER_NOT_APPROVED')) {
            return NextResponse.json({
              success: false,
              error: { 
                code: 'PAYMENT_NOT_COMPLETED', 
                message: 'Cannot approve service request - customer has not completed payment. Please ask customer to complete their payment first.' 
              }
            }, { status: 400 });
          }
          
          // For other errors, fall back to PROVIDER_REVIEW
          await prisma.transaction.update({
            where: { id: existingTransaction.id },
            data: {
              status: 'PROVIDER_REVIEW',
              reviewDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          });
        }
      } else {
        // No PayPal order - check current transaction status
        if (existingTransaction.status === 'COMPLETED') {
          console.log(`Transaction ${existingTransaction.id} is already COMPLETED, no update needed`);
        } else {
          // Transaction needs to be updated to COMPLETED (e.g., credit card payment that was already captured during payment)
          // Update directly to COMPLETED status for immediate payment methods
          await prisma.transaction.update({
            where: { id: existingTransaction.id },
            data: {
              status: 'COMPLETED',
              escrowStartTime: new Date(),
              escrowEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days escrow
            }
          });
          console.log(`Transaction ${existingTransaction.id} updated to COMPLETED status (no PayPal order required)`);
        }
      }
    } else {
      console.log(`No existing transaction found for offer ${id}`);
    }

    // Create a notification for the client
    console.log(`Creating notification for client ${offer.client.id}`);
    await prisma.notification.create({
      data: {
        userId: offer.client.id,
        title: 'Service Request Approved',
        content: `Your request for the service "${offer.service.name}" has been approved.`,
        type: NotificationType.SYSTEM,
        isRead: false,
      }
    });

    console.log(`Successfully approved offer ${id}`);
    return NextResponse.json({
      success: true,
      data: updatedOffer
    }, { status: 200 });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
} 
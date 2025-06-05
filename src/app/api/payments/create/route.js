import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/payment/payment-service';

/**
 * Create payment order for a booking
 * POST /api/payments/create
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required. Please log in to continue.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const { serviceId, bookingDate, hours, addons = [] } = await request.json();

    // Validate required fields
    if (!serviceId || !bookingDate || !hours) {
      return NextResponse.json({ 
        error: 'Missing required fields: serviceId, bookingDate, hours',
        code: 'MISSING_FIELDS',
        details: {
          serviceId: !serviceId ? 'Service ID is required' : null,
          bookingDate: !bookingDate ? 'Booking date is required' : null,
          hours: !hours ? 'Hours is required' : null
        }
      }, { status: 400 });
    }

    console.log('Creating payment order for:', {
      serviceId,
      bookingDate,
      hours,
      userId: session.user.id
    });

    // Get service information
    const { prisma } = require('@/lib/prisma');
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: true,
        category: true
      }
    });

    if (!service) {
      return NextResponse.json({ 
        error: `Service with ID '${serviceId}' not found. The service may have been removed or is no longer available.`,
        code: 'SERVICE_NOT_FOUND' 
      }, { status: 404 });
    }

    console.log(`Service price: $${service.price} for service: ${service.name}`);

    // Check if provider has PayPal connected
    if (!service.provider.paypalCanReceivePayments || !service.provider.paypalMerchantId) {
      return NextResponse.json({ 
        error: `Payment setup incomplete for this service provider. The provider "${service.provider.businessName || 'this provider'}" needs to complete their PayPal marketplace setup before accepting payments.`,
        code: 'PROVIDER_PAYMENT_NOT_CONFIGURED',
        details: {
          canReceivePayments: service.provider.paypalCanReceivePayments,
          hasMerchantId: !!service.provider.paypalMerchantId,
          onboardingStatus: service.provider.paypalOnboardingStatus
        }
      }, { status: 400 });
    }

    // Create payment order using PayPal marketplace
    const paymentService = new PaymentService();
    const result = await paymentService.createPaymentOrder({
      serviceId,
      userId: session.user.id,
      bookingDate,
      hours,
      addons
    });

    console.log(`Created transaction: ${result.transactionId}`);
    console.log(`PayPal order created: ${result.orderId}`);

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      transactionId: result.transactionId,
      approvalUrl: result.approvalUrl,
      total: result.total,
      currency: result.currency
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    
    // Handle specific error types
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Database record not found. The service or related data may have been deleted.',
        code: 'DATABASE_RECORD_NOT_FOUND',
        details: error.message
      }, { status: 404 });
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Duplicate transaction detected. Please try again.',
        code: 'DUPLICATE_TRANSACTION',
        details: error.message
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to create payment order',
      code: 'PAYMENT_CREATION_FAILED',
      details: {
        errorType: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 
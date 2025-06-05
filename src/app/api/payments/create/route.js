import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/payment/payment-service';

/**
 * Create payment order for a booking
 * POST /api/payments/create
 */
export async function POST(request) {
  console.log('🚀 Payment creation endpoint hit');
  
  try {
    // Debug environment variables
    console.log('🔧 Environment debug:', {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      paypalMode: process.env.PAYPAL_MODE,
      hasPaypalSandboxClientId: !!process.env.PAYPAL_SANDBOX_CLIENT_ID,
      hasPaypalSandboxSecret: !!process.env.PAYPAL_SANDBOX_CLIENT_SECRET,
      hasPublicPaypalId: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      paypalSandboxClientIdLength: process.env.PAYPAL_SANDBOX_CLIENT_ID?.length || 0,
      paypalSandboxSecretLength: process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.length || 0
    });

    const session = await getServerSession(authOptions);
    
    console.log('👤 Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      userEmail: session?.user?.email
    });
    
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Authentication required. Please log in to continue.',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const requestBody = await request.json();
    console.log('📝 Request body received:', requestBody);
    
    const { serviceId, bookingDate, hours, addons = [] } = requestBody;

    // Validate required fields
    if (!serviceId || !bookingDate || !hours) {
      console.log('❌ Missing required fields:', { serviceId, bookingDate, hours });
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

    console.log('✅ Creating payment order for:', {
      serviceId,
      bookingDate,
      hours,
      userId: session.user.id
    });

    // Get service information
    console.log('🔍 Fetching service from database...');
    const { prisma } = require('@/lib/prisma');
    
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: true,
        category: true
      }
    });

    console.log('🔍 Service query result:', {
      found: !!service,
      serviceId: service?.id,
      serviceName: service?.name,
      servicePrice: service?.price,
      providerId: service?.provider?.id,
      providerBusinessName: service?.provider?.businessName,
      providerPaypalMerchantId: service?.provider?.paypalMerchantId,
      providerCanReceivePayments: service?.provider?.paypalCanReceivePayments,
      providerOnboardingStatus: service?.provider?.paypalOnboardingStatus
    });

    if (!service) {
      console.log('❌ Service not found for ID:', serviceId);
      return NextResponse.json({ 
        error: `Service with ID '${serviceId}' not found. The service may have been removed or is no longer available.`,
        code: 'SERVICE_NOT_FOUND' 
      }, { status: 404 });
    }

    console.log(`💰 Service price: $${service.price} for service: ${service.name}`);

    // Check if provider has PayPal connected
    if (!service.provider.paypalCanReceivePayments || !service.provider.paypalMerchantId) {
      console.log('❌ Provider PayPal not configured:', {
        canReceivePayments: service.provider.paypalCanReceivePayments,
        hasMerchantId: !!service.provider.paypalMerchantId,
        onboardingStatus: service.provider.paypalOnboardingStatus
      });
      
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

    console.log('✅ Provider PayPal is configured, proceeding with payment creation');

    // Create payment order using PayPal marketplace
    console.log('💳 Initializing PaymentService...');
    const paymentService = new PaymentService();
    
    console.log('💳 Calling createPaymentOrder...');
    const result = await paymentService.createPaymentOrder({
      serviceId,
      userId: session.user.id,
      bookingDate,
      hours,
      addons
    });

    console.log('✅ Payment order created successfully:', {
      transactionId: result.transactionId,
      orderId: result.orderId,
      total: result.total,
      currency: result.currency,
      hasApprovalUrl: !!result.approvalUrl
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      transactionId: result.transactionId,
      approvalUrl: result.approvalUrl,
      total: result.total,
      currency: result.currency
    });

  } catch (error) {
    console.error('💥 Payment creation error - FULL DETAILS:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      cause: error.cause
    });
    
    // Handle specific error types
    if (error.code === 'P2025') {
      console.log('❌ Database record not found error');
      return NextResponse.json({ 
        error: 'Database record not found. The service or related data may have been deleted.',
        code: 'DATABASE_RECORD_NOT_FOUND',
        details: error.message
      }, { status: 404 });
    }
    
    if (error.code === 'P2002') {
      console.log('❌ Duplicate transaction error');
      return NextResponse.json({ 
        error: 'Duplicate transaction detected. Please try again.',
        code: 'DUPLICATE_TRANSACTION',
        details: error.message
      }, { status: 409 });
    }
    
    // PayPal specific errors
    if (error.message?.includes('Failed to get PayPal access token')) {
      console.log('❌ PayPal authentication error');
      return NextResponse.json({ 
        error: 'PayPal authentication failed. Please contact support.',
        code: 'PAYPAL_AUTH_FAILED',
        details: 'PayPal credentials not properly configured'
      }, { status: 500 });
    }
    
    console.log('❌ Generic payment creation error');
    return NextResponse.json({ 
      error: error.message || 'Failed to create payment order',
      code: 'PAYMENT_CREATION_FAILED',
      details: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 
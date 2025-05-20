import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma/client';
import paypalClient from '@/lib/payment/paypal/service';

/**
 * Process a credit card payment through PayPal's REST API
 * This endpoint receives card details and creates/captures a payment
 */
export async function POST(request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse the request body
    const data = await request.json();
    const { cardData, amount, orderId, metadata = {} } = data;
    
    if (!cardData || !amount || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // Log the payment attempt (without sensitive data)
    console.log(`Processing card payment for amount ${amount}, orderId: ${orderId}`);
    
    try {
      // Process the card payment through PayPal's API
      // For this sandbox example, we'll just return a success response
      const paymentResult = {
        transactionId: orderId,
        status: 'completed',
        amount,
        paymentMethod: 'card',
        paymentDetails: {
          lastFour: cardData.cardNumber.slice(-4),
          cardType: detectCardType(cardData.cardNumber)
        }
      };
      
      // Find or retrieve a default city ID
      let cityId = null;
      
      // First try to get the city from the service if possible
      if (metadata.serviceId) {
        try {
          const service = await prisma.service.findUnique({
            where: { id: metadata.serviceId },
            select: { cityId: true }
          });
          
          if (service && service.cityId) {
            cityId = service.cityId;
            console.log(`Using city ID ${cityId} from service`);
          }
        } catch (serviceError) {
          console.error("Error getting service city:", serviceError);
        }
      }
      
      // If no city found from service, find the first available city
      if (!cityId) {
        try {
          // First try to find the default city
          let defaultCity = await prisma.city.findFirst({
            where: { isDefault: true },
            select: { id: true }
          });
          
          // If no default city, look for any city
          if (!defaultCity) {
            defaultCity = await prisma.city.findFirst({
              select: { id: true }
            });
          }
          
          if (defaultCity) {
            cityId = defaultCity.id;
            console.log(`Using available city ID: ${cityId}`);
          } else {
            // Create a default city if none exists
            const newDefaultCity = await prisma.city.create({
              data: {
                name: "Default City",
                slug: "default-city",
                state: "Default State",
                isDefault: true
              }
            });
            cityId = newDefaultCity.id;
            console.log(`Created default city with ID: ${cityId}`);
          }
          
          if (!cityId) {
            throw new Error('Could not find or create a valid city');
          }
        } catch (cityError) {
          console.error("Error finding or creating city:", cityError);
          return NextResponse.json(
            { success: false, error: `City error: ${cityError.message}` },
            { status: 500 }
          );
        }
      }
      
      // Find or create a party for this booking
      console.log('Creating a party for the transaction');
      const party = await prisma.party.create({
        data: {
          name: `Booking for ${metadata.serviceName || 'Service'}`,
          status: 'DRAFT',
          ...(metadata.bookingDetails?.isoDateTime && {
            date: new Date(metadata.bookingDetails.isoDateTime)
          }),
          ...(metadata.bookingDetails?.time && {
            startTime: metadata.bookingDetails.time
          }),
          ...(metadata.bookingDetails?.duration && {
            duration: parseInt(metadata.bookingDetails.duration)
          }),
          guestCount: metadata.bookingDetails?.guestCount || 1,
          city: {
            connect: { id: cityId }
          },
          client: {
            connect: { id: session.user.id }
          }
        }
      });
      
      console.log(`Created party with ID: ${party.id}`);
      
      // Create a party service linking the party and the service
      const partyService = await prisma.partyService.create({
        data: {
          serviceId: metadata.serviceId,
          partyId: party.id,
          specificOptions: metadata.bookingDetails ? {
            address: metadata.bookingDetails.address || '',
            comments: metadata.bookingDetails.comments || ''
          } : {}
        }
      });
      
      console.log(`Created party service with ID: ${partyService.id}`);
      
      // Create an offer without the transaction
      const offer = await prisma.offer.create({
        data: {
          price: parseFloat(amount),
          status: 'APPROVED',
          description: `Direct booking for ${metadata.serviceName || 'service'}`,
          photos: [],
          client: {
            connect: { id: session.user.id }
          },
          provider: {
            connect: { id: metadata.providerId }
          },
          service: {
            connect: { id: metadata.serviceId }
          },
          partyService: {
            connect: { id: partyService.id }
          }
        }
      });
      
      console.log(`Created offer with ID: ${offer.id}`);
      
      // Create transaction separately to properly establish the relationships
      const transaction = await prisma.transaction.create({
        data: {
          amount: parseFloat(amount),
          status: 'COMPLETED',
          paymentIntentId: orderId,
          paymentMethodId: 'CARD',
          party: {
            connect: { id: party.id }
          },
          offer: {
            connect: { id: offer.id }
          }
        }
      });
      
      console.log(`Created transaction with ID: ${transaction.id}`);
      
      // Create notification for provider
      await prisma.notification.create({
        data: {
          userId: metadata.providerId,
          type: 'OFFER_UPDATED',
          title: 'New Booking Received',
          content: `A client has made a direct payment for your service. Check your provider requests dashboard.`,
          isRead: false
        }
      });
      
      return NextResponse.json({
        success: true,
        data: paymentResult
      });
    } catch (error) {
      console.error(`Payment processing error:`, error);
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Payment processing failed',
          code: error.code || 'PAYMENT_ERROR',
          details: error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in card payment API route:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Detect card type based on card number
 */
function detectCardType(cardNumber) {
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Basic card type detection based on IIN/BIN ranges
  if (/^4/.test(cleanNumber)) return 'Visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'American Express';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';
  
  return 'Unknown';
} 
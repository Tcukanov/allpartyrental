import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createProviderNotification } from '@/lib/notifications/notification-service';
import { getDefaultCity } from '@/lib/cities/default-city';
import { getFeeSettings } from '@/lib/payment/fee-settings';

/**
 * Create a new transaction for a service request
 * This endpoint allows a client to initialize a transaction for a service
 */
export async function POST(request: NextRequest) {
  // Declare variables at the top level so they're accessible throughout the function
  let party;
  let partyService;
  let offerId;
  
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get request data
    const data = await request.json();
    const { serviceId, offerId: requestOfferId, amount, providerId, bookingDate, duration, comments, isFixedPrice, addons } = data;

    // Validate request data
    if ((!serviceId && !requestOfferId) || !amount || !providerId) {
      return NextResponse.json(
        { success: false, error: { message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    // Create a transaction
    let transactionData: any = {
      amount: new Prisma.Decimal(amount),
      status: 'PENDING'
    };

    // Handle transaction with offer
    if (requestOfferId) {
      // Create a transaction with the offerId
    const transaction = await prisma.transaction.create({
      data: {
            offer: {
            connect: { id: requestOfferId }
          },
          amount: new Prisma.Decimal(amount),
          status: 'PENDING',
          // Party connection is required by our schema
            party: {
            connect: {
              // We need to find the party associated with this offer
              id: (await prisma.offer.findUnique({
                where: { id: requestOfferId },
                select: { partyService: { select: { partyId: true } } }
              }))?.partyService?.partyId || ''
            }
          }
        }
      });

      // Get the offer details for the notification
      const offer = await prisma.offer.findUnique({
        where: { id: requestOfferId },
        include: {
          service: true
        }
      });

      // Create notification for the provider
      if (offer && offer.providerId) {
        await createProviderNotification(
          offer.providerId, 
          transaction.id,
          offer.service?.name || 'your service'
        );
      }
      
      return NextResponse.json({ success: true, data: { transaction } }, { status: 201 });
    } 
    // Handle direct service transaction
    else if (serviceId) {
      try {
        console.log("====== Starting direct service transaction flow ======");
        console.log("Request parameters:", {
        serviceId,
        amount,
          providerId, 
          userId,
          auth: session.user.id === userId ? "Valid" : "Invalid"
        });
        
        // Declare these variables at the top level of the try block
        let party;
        let partyService;
        
        // First, fetch the service to get provider information
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                profile: {
                  select: {
                    id: true
                  }
                }
              }
            },
            city: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        if (!service) {
          console.log(`Service not found: ${serviceId}`);
          return NextResponse.json(
            { success: false, error: { message: 'Service not found' } },
            { status: 404 }
          );
        }
        
        // Validate that we have all required information to create the entities
        if (!service.providerId) {
          console.error('Service missing provider ID:', service);
          return NextResponse.json({ 
            success: false, 
            error: { message: 'Service is missing provider information', details: 'providerId is required' } 
          }, { status: 400 });
        }

        // We need a cityId for the transaction, either from the service or from the provider
        let cityId = service.cityId;
        
        // If the service doesn't have a city, get a default city
        if (!cityId) {
          console.log('Service missing city ID, fetching a default city');
          
          const defaultCity = await getDefaultCity();
          
          if (defaultCity) {
            cityId = defaultCity.id;
            console.log(`Using default city: ${defaultCity.name} (${cityId})`);
          } else {
            console.error('No default city found in database');
            return NextResponse.json({ 
              success: false, 
              error: { message: 'Cannot process transaction without city information. Please contact support.' } 
            }, { status: 400 });
          }
        }
        
        console.log(`Service found with city ID: ${cityId}`, JSON.stringify(service, null, 2));
        
        // Instead of using a transaction, perform steps individually with better error handling
        
        // 1. Create a temporary party
        try {
          console.log("Creating party for transaction...");
          
          // Extract time from booking date or use default
          let bookingTime = '12:00'; // Default time
          if (bookingDate) {
            try {
              // Try to extract time from ISO datetime string
              const dateObj = new Date(bookingDate);
              bookingTime = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
            } catch (e) {
              console.warn('Could not parse time from booking date, using default time:', e);
            }
          }
          
          // Create minimal party data without a party theme
          party = await prisma.party.create({
            data: {
              clientId: userId,
              cityId: cityId,
              name: `${service.name} Booking`,
              date: new Date(bookingDate || new Date()),
              startTime: bookingTime,
              duration: Number(duration) || 1,
              guestCount: 1,
              status: 'DRAFT'
            }
          });
          
          console.log(`Created party: ${party.id}`);
        } catch (err) {
          console.error('Error creating party:', err);
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Failed to create party for transaction', 
                details: err instanceof Error ? err.message : String(err) 
              } 
            },
            { status: 500 }
          );
        }
        
        // 2. Create a party service connection
        try {
          console.log("Creating party service with:", {
            partyId: party.id,
            serviceId: service.id
          });
          
          // Create a new party service connection directly
          partyService = await prisma.partyService.create({
            data: {
              partyId: party.id,
              serviceId: service.id,
              specificOptions: addons && addons.length > 0 ? { 
                addons: addons.map(addon => ({
                  id: addon.id,
                  title: addon.title,
                  price: addon.price
                }))
              } : undefined
            }
          });
          console.log(`Created party service: ${partyService.id}`);
          
          if (!partyService || !partyService.id) {
            throw new Error('Failed to create party service - no ID returned');
          }
        } catch (err) {
          console.error('Error creating party service:', err);
          // Cleanup the party we created, but only if it doesn't have other services
          if (party && party.id) {
            // Check for other party services first
            const otherPartyServices = await prisma.partyService.count({
              where: { partyId: party.id }
            });
            
            if (otherPartyServices === 0) {
              await prisma.party.delete({ where: { id: party.id } }).catch(e => console.error('Cleanup failed:', e));
            } else {
              console.log(`Not deleting party ${party.id} as it has ${otherPartyServices} other services`);
            }
          }
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Failed to create party service for transaction', 
                details: err instanceof Error ? err.message : String(err) 
              } 
            },
            { status: 500 }
          );
        }
        
        // Create an offer for the service
        let offer;
        try {
          console.log("Creating offer with:", {
            clientId: userId,
            providerId: service.providerId,
            serviceId: service.id,
            partyServiceId: partyService.id,
            price: amount,
            description: `Direct booking for ${service.name}`
          });
          
          // Validate that required entities exist
          const clientCheck = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!clientCheck) {
            throw new Error(`Client with ID ${userId} not found`);
          }
          
          const providerCheck = await prisma.user.findUnique({
            where: { id: service.providerId }
          });
          
          if (!providerCheck) {
            throw new Error(`Provider with ID ${service.providerId} not found`);
          }
          
          const serviceCheck = await prisma.service.findUnique({
            where: { id: service.id }
          });
          
          if (!serviceCheck) {
            throw new Error(`Service with ID ${service.id} not found`);
          }
          
          const partyServiceCheck = await prisma.partyService.findUnique({
            where: { id: partyService.id }
          });
          
          if (!partyServiceCheck) {
            throw new Error(`PartyService with ID ${partyService.id} not found`);
          }
          
          // Create a new offer directly without trying to reuse existing ones
          offer = await prisma.offer.create({
            data: {
              price: new Prisma.Decimal(amount),
              description: `Direct booking for ${service.name}`,
              status: 'PENDING',
              photos: [],
              // Use direct assignments instead of connections to avoid potential issues
        clientId: userId,
              providerId: service.providerId,
              serviceId: service.id,
              partyServiceId: partyService.id
            },
            // Include related data for validation
            include: {
              client: true,
              provider: true,
              service: true,
              partyService: true
            }
          });
          console.log(`Created offer with ID: ${offer.id}`);
          
          if (!offer || !offer.id) {
            throw new Error('Failed to create offer - no ID returned');
          }
        } catch (err) {
          console.error('Error creating offer:', err);
          
          // Try to get more specific error information
          if (err instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(`Prisma error during offer creation: ${err.code} - ${err.message}`);
            console.error('Error metadata:', JSON.stringify(err.meta || {}, null, 2));
            
            if (err.code === 'P2003') {
              const field = err.meta?.field_name || 'unknown';
              console.error(`Foreign key constraint failed on ${field}`);
            }
          }
          
          // Clean up the party service and party we created
          if (partyService && partyService.id) {
            await prisma.partyService.delete({ where: { id: partyService.id } }).catch(e => console.error('Cleanup failed:', e));
          }
          if (party && party.id) {
            await prisma.party.delete({ where: { id: party.id } }).catch(e => console.error('Cleanup failed:', e));
          }
          
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                message: 'Failed to create offer for transaction', 
                details: err instanceof Error ? err.message : String(err) 
              } 
            },
            { status: 500 }
          );
        }
        
        // Create a transaction for the offer - use a completely different approach
        let transaction;
        try {
          console.log("Creating transaction for offer:", {
            offerId: offer.id,
            partyId: party.id,
            amount: amount
          });
          
          // Get the current fee settings
          const { clientFeePercent, providerFeePercent } = await getFeeSettings();
          
          // Create a transaction using Prisma's standard approach
          transaction = await prisma.transaction.create({
            data: {
              offerId: offer.id,
              partyId: party.id,
              amount: new Prisma.Decimal(amount),
              status: 'PENDING',
              clientFeePercent: clientFeePercent,
              providerFeePercent: providerFeePercent
            },
            include: {
              offer: true,
              party: true
            }
          });
          
          console.log(`Created transaction with ID: ${transaction.id}`);
          
          // Create notification for the provider
          await createProviderNotification(offer.providerId, transaction.id, service.name);
        } catch (prismaError) {
          // Check if this is a unique constraint error (transaction already exists)
          if (prismaError instanceof Prisma.PrismaClientKnownRequestError && 
              prismaError.code === 'P2002') {
            console.log("Transaction already exists for this offer, retrieving existing transaction");
            
            // Retrieve the existing transaction
            const existingTransaction = await prisma.transaction.findUnique({
              where: { offerId: offer.id },
              include: { 
                offer: true,
                party: true
              }
            });
            
            if (existingTransaction) {
              console.log(`Found existing transaction for offer ${offer.id}: ${existingTransaction.id}`);
              return NextResponse.json({ 
                success: true, 
                data: { 
                  transaction: existingTransaction,
                  isExisting: true 
                } 
              }, { status: 200 });
            } else {
              throw new Error(`Could not find existing transaction for offer ${offer.id} despite unique constraint error`);
            }
          }
          
          // Rethrow any other error
          throw prismaError;
        }
        
        return NextResponse.json({ 
          success: true, 
          data: { transaction } 
        }, { status: 201 });
      } catch (err) {
        console.error('Error creating transaction:', err);
        
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          // Log detailed error information for specific Prisma errors
          if (err.code === 'P2003') {
            // Check if it's specifically the offerId or partyId constraint that failed
            const fieldName = err.meta?.field_name as string | undefined;
            if (fieldName && fieldName.includes('offerId')) {
              console.error(`The offer with ID may have been deleted or is invalid`);
            } else if (fieldName && fieldName.includes('partyId')) {
              console.error(`The party with ID may have been deleted or is invalid`);
            }
          } else if (err.code === 'P2002') {
            console.error(`Unique constraint violation: ${err.meta?.target}`);
            
            // Check if it's the offer's unique constraint that failed
            const target = err.meta?.target as string[] | undefined;
            if (target && target.includes('offerId') && offerId) {
              // Try to find the existing transaction for this offer
              try {
                const existingTransaction = await prisma.transaction.findUnique({
                  where: { offerId },
                  include: { offer: true }
                });
                
                if (existingTransaction) {
                  console.log(`Found existing transaction for offer ${offerId}: ${existingTransaction.id}`);
                  return NextResponse.json({ 
                    success: true, 
                    data: { 
                      transaction: existingTransaction,
                      isExisting: true 
                    } 
                  }, { status: 200 });
                }
              } catch (findError) {
                console.error('Error finding existing transaction:', findError);
              }
            }
          }
        }
        
        // Cleanup the offer, party service, and party we created
        if (offerId) {
          // Skip offer cleanup as we don't have access to the offer object here
          console.log(`Cannot cleanup offer for offerId: ${offerId} as it's not accessible in this scope`);
        }
        
        // Safe cleanup function that doesn't rely on variables that might be undefined
        const safeCleanup = async () => {
          try {
            // Check if the transaction failed early and we need to cleanup 
            // a party service that might have been created
            if (typeof partyService !== 'undefined' && partyService && partyService.id) {
              await prisma.partyService.delete({ where: { id: partyService.id } })
                .catch(e => console.error('Party service cleanup failed:', e));
            }
            
            // Only after deleting party service can we delete the party
            if (typeof party !== 'undefined' && party && party.id) {
              // Double check that no party services remain before deleting
              const remainingPartyServices = await prisma.partyService.count({
                where: { partyId: party.id }
              });
              
              if (remainingPartyServices === 0) {
                await prisma.party.delete({ where: { id: party.id } })
                  .catch(e => console.error('Party cleanup failed:', e));
              } else {
                console.log(`Cannot delete party ${party.id} as it still has ${remainingPartyServices} services`);
              }
            }
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
          }
        };
        
        // Run the cleanup
        await safeCleanup();
        
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Failed to create transaction record', 
              details: err instanceof Error ? err.message : String(err) 
            } 
          },
          { status: 500 }
        );
      }
    }
    else {
      return NextResponse.json(
        { success: false, error: { message: 'Either offerId or serviceId is required' } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Transaction creation error details:', error);
    
    // Check if it's a Prisma error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(`Prisma error code: ${error.code}, message: ${error.message}`);
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'A transaction for this offer already exists',
              details: error.message,
              code: error.code
            }
          },
          { status: 409 } // Conflict
        );
      } else if (error.code === 'P2025') {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Required record not found to complete this operation',
              details: error.message,
              code: error.code
            }
          },
          { status: 404 } // Not Found
        );
      }
    }
    
    // A more descriptive generic error
    let errorMessage = 'Failed to create transaction record';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
    }
    
    return NextResponse.json(
      { success: false, error: { message: errorMessage, stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined } },
      { status: 500 }
    );
  }
}

/**
 * Get user's transactions
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Get transactions based on user role
    let transactions;
    
    if (session.user.role === 'CLIENT') {
      // Get client's transactions
      transactions = await prisma.transaction.findMany({
        where: {
          offer: {
            clientId: userId
          }
        },
        include: {
        offer: {
          include: {
            provider: {
              select: {
                id: true,
                name: true,
                  profile: {
                    select: {
                      avatar: true
                    }
                  }
                }
              },
              service: true
            }
          },
          party: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } else if (session.user.role === 'PROVIDER') {
      // Get provider's transactions
      transactions = await prisma.transaction.findMany({
        where: {
          offer: {
            providerId: userId
          }
        },
        include: {
          offer: {
            include: {
              client: {
              select: {
                id: true,
                name: true,
                  profile: {
                    select: {
                      avatar: true
                    }
                  }
                }
              },
              service: true
            }
          },
          party: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
    } else if (session.user.role === 'ADMIN') {
      // Get all transactions for admin
      transactions = await prisma.transaction.findMany({
        include: {
          offer: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              },
              provider: {
                select: {
                  id: true,
                  name: true
                }
              },
              service: true
            }
          },
          party: true
      },
      orderBy: {
          updatedAt: 'desc'
        },
        take: 50 // Limit to 50 most recent transactions
      });
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: transactions }, { status: 200 });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

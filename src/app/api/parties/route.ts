import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma/client';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Client access required' } },
        { status: 403 }
      );
    }

    // Get parties for the client
    const parties = await prisma.party.findMany({
      where: {
        clientId: session.user.id as string,
      },
      include: {
        city: true,
        partyServices: {
          include: {
            service: {
              include: {
                category: true,
              },
            },
            offers: {
              include: {
                provider: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                        profile: {
                          select: {
                            avatar: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: parties }, { status: 200 });
  } catch (error) {
    console.error('Get client parties error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check if user is a client
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Client access required' } },
        { status: 403 }
      );
    }

    // Determine content type and process accordingly
    const contentType = request.headers.get('content-type') || '';
    
    let partyData: any = {};
    let serviceData: any[] = [];
    let partyImages: File[] = [];
    let servicePhotos: Record<string, File[]> = {};
    
    if (contentType.includes('multipart/form-data')) {
      // Handle form data
      const formData = await request.formData();
      
      // Extract party data from form
      partyData = {
        cityId: formData.get('cityId'),
        name: formData.get('name'),
        date: formData.get('date'),
        startTime: formData.get('time'),
        duration: parseInt(formData.get('duration') as string) || 2,
        guestCount: parseInt(formData.get('guestCount') as string) || 10,
        description: formData.get('description')
      };
      
      // Handle party images
      partyImages = formData.getAll('partyImages') as File[];
      
      // Extract services data if available
      const servicesJson = formData.get('services');
      if (servicesJson && typeof servicesJson === 'string') {
        try {
          serviceData = JSON.parse(servicesJson);
          
          // Collect service photos
          for (const key of Array.from(formData.keys())) {
            if (key.startsWith('servicePhotos_')) {
              // Format is servicePhotos_serviceIndex_photoIndex
              const serviceIndex = parseInt(key.split('_')[1]);
              if (!servicePhotos[serviceIndex]) {
                servicePhotos[serviceIndex] = [];
              }
              servicePhotos[serviceIndex].push(formData.get(key) as File);
            }
          }
        } catch (err) {
          console.error('Error parsing services JSON:', err);
        }
      }
      
    } else {
      // Handle JSON data
      const jsonData = await request.json();
      partyData = jsonData;
      
      // Extract services data if available
      if (jsonData.services && Array.isArray(jsonData.services)) {
        serviceData = jsonData.services;
      }
    }
    
    const { cityId, name, date, startTime, duration, guestCount, description } = partyData;

    // Validate input
    if (!cityId || !name || !date || !startTime) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    console.log('Creating party with data:', partyData);

    // Create party
    const party = await prisma.party.create({
      data: {
        clientId: session.user.id as string,
        cityId,
        name,
        date: new Date(date),
        startTime,
        duration: duration || 2,
        guestCount: guestCount || 10,
        status: 'DRAFT'
      },
    });
    
    // Process services if any
    if (serviceData.length > 0) {
      console.log(`Creating ${serviceData.length} services for party`);
      
      for (let i = 0; i < serviceData.length; i++) {
        const service = serviceData[i];
        
        // TODO: In a production environment, you would:
        // 1. Upload the photos to a storage service like S3
        // 2. Store the URLs in the database
        // For now, we'll just log that we received the photos
        
        if (servicePhotos[i] && servicePhotos[i].length > 0) {
          console.log(`Service ${i} has ${servicePhotos[i].length} photos`);
          // Here you would process the photos
          // const photoUrls = await uploadPhotosToStorage(servicePhotos[i]);
        }
        
        // Create the service entry with its description
        try {
          // Find the existing service by name or create one
          const serviceRecord = await prisma.service.findFirst({
            where: {
              name: service.name
            }
          });
          
          if (!serviceRecord) {
            console.log(`Service ${service.name} not found in the database`);
            continue;
          }
          
          // Create party service association with description
          await prisma.partyService.create({
            data: {
              partyId: party.id,
              serviceId: serviceRecord.id,
              specificOptions: {
                description: service.description || ''
                // Add photo URLs here when implemented
                // photoUrls: photoUrls
              }
            }
          });
          
          console.log(`Added service ${service.name} to party`);
        } catch (error) {
          console.error(`Error adding service ${service.name}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, data: party }, { status: 201 });
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' } },
      { status: 500 }
    );
  }
}
